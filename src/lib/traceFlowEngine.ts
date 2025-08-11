import { HARDCODED_BINANCE_WALLETS } from "./binanceUtils";
import { TraceFlowItem } from "@/types/traceFlowItem";
import { FirstFunderMap } from "@/types/FirstFunderMap";
import { ConvergencePoint } from "@/types/ConvergencePoint";
import { detectRepeatedPatterns } from "@/lib/patternDetectionEngine";
import { resolveTokenSymbol } from "@/lib/tokenResolver";
import { Connection, PublicKey } from "@solana/web3.js";


type ConvergenceMap = Record<string, ConvergencePoint>;

type TraceFlowEngineResult = {
    trace: TraceFlowItem[];
    firstFunders: FirstFunderMap;
    convergencePoints: ConvergenceMap;
    repeatedPatterns: ReturnType<typeof detectRepeatedPatterns>;
};

const RPC_ENDPOINT = process.env.NEXT_PUBLIC_QUIKNODE_M_RPC!;
export const solanaConnection = new Connection(RPC_ENDPOINT);

function isBinanceAddress(addr?: string | null) {
    if (!addr) return false;
    try {
        return HARDCODED_BINANCE_WALLETS.has(addr.toLowerCase());
    } catch (e) {
        return HARDCODED_BINANCE_WALLETS.has(addr);
    }
}



/**
 * traceFlowEngine
 * - Supports SOL (native) transfers (lamports)
 * - Supports SPL token transfers by parsing instructions AND/token balance diffs (pre/post)
 * - Accepts an optional tokenFilter which can be: symbol (e.g. "USDC"), "SOL", or a token mint address
 */
export async function traceFlowEngine(
    wallets: string[],
    tokenFilter?: string | null
): Promise<TraceFlowEngineResult> {
    const QUICKNODE_RPC = RPC_ENDPOINT;

    const allTransfers: TraceFlowItem[] = [];

    // Normalize wallet list for quick checks
    const walletSet = new Set(wallets.map((w) => w.toLowerCase()));

    // helper to check token filter (symbol or mint)
    const tokenFilterNormalized = tokenFilter ? tokenFilter.trim().toLowerCase() : null;
    const matchesTokenFilter = (tokenSymbol?: string | null, mint?: string | null) => {
        if (!tokenFilterNormalized) return true;
        if (!tokenSymbol && !mint) return false;
        if (tokenSymbol && tokenSymbol.toLowerCase() === tokenFilterNormalized) return true;
        if (mint && mint.toLowerCase() === tokenFilterNormalized) return true;
        return false;
    };

    // We'll fetch signatures per wallet (limit can be increased later)
    const signaturesPerWallet: Record<string, Array<{ signature: string; blockTime?: number | null }>> = {};

    for (const wallet of wallets) {
        try {
            const response = await fetch(QUICKNODE_RPC, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    id: 1,
                    method: "getSignaturesForAddress",
                    params: [wallet, { limit: 200 }],
                }),
            });

            const sigs = await response.json();
            signaturesPerWallet[wallet] =
                sigs.result?.map((s: any) => ({ signature: s.signature, blockTime: s.blockTime })) ?? [];
        } catch (e) {
            console.error("Failed to fetch signatures for", wallet, e);
            signaturesPerWallet[wallet] = [];
        }
    }

    // Flatten unique signatures (avoid duplicate work when wallets overlap)
    const uniqueSigs = new Map<string, number | null>();
    for (const sarr of Object.values(signaturesPerWallet)) {
        for (const s of sarr) uniqueSigs.set(s.signature, s.blockTime ?? null);
    }

    const sigList = Array.from(uniqueSigs.entries());

    // Fetch transactions in parallel but in reasonable batches to avoid RPC throttling
    const BATCH = 20;
    for (let i = 0; i < sigList.length; i += BATCH) {
        const batch = sigList.slice(i, i + BATCH);

        const promises = batch.map(async ([signature, blockTime]) => {
            try {
                const txDetails = await fetch(QUICKNODE_RPC, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        jsonrpc: "2.0",
                        id: 1,
                        method: "getTransaction",
                        params: [signature, { encoding: "jsonParsed" }],
                    }),
                });

                const txJson = await txDetails.json();
                return { signature, parsed: txJson.result };
            } catch (e) {
                console.error("Failed to fetch tx", signature, e);
                return null;
            }
        });

        const results = await Promise.all(promises);

        for (const r of results) {
            if (!r || !r.parsed) continue;
            const tx = r.parsed;
            const blockTime = tx.blockTime || undefined;

            // Basic guards
            if (!tx.meta || !tx.transaction || !tx.transaction.message) continue;

            // 1) Parse instructions for clear SPL transfer events (preferred)
            const instructions = tx.transaction.message.instructions || [];

            for (const ix of instructions) {
                try {
                    // spl-token transfer (explicit)
                    if (ix.program === "spl-token" && ix.parsed?.type === "transfer") {
                        const info = ix.parsed.info;
                        const source = info.source;
                        const destination = info.destination;
                        const rawAmount = Number(info.amount);

                        // Try to resolve mint symbol using postTokenBalances where possible
                        // find mint by matching account index in postTokenBalances
                        const accountIndex = ix.account; // sometimes not available

                        // fallback: try to find the mint by looking through postTokenBalances for the destination account
                        let mint: string | null = null;
                        if (tx.meta.postTokenBalances) {
                            const match = tx.meta.postTokenBalances.find((p: any) => p.accountIndex === ix.account || p.owner === destination);
                            if (match) mint = match.mint;
                        }

                        const tokenSymbol = mint ? await resolveTokenSymbol(mint) : "UNKNOWN";

                        // amounts from parsed spl token transfers are in raw smallest unit; try to convert using ui amount where possible
                        // fallback to rawAmount if ui amount not available
                        const uiAmount = (() => {
                            const pb = tx.meta.postTokenBalances?.find((p: any) => p.owner === destination && p.mint === mint);
                            const pre = tx.meta.preTokenBalances?.find((p: any) => p.owner === destination && p.mint === mint);
                            if (pb && pb.uiTokenAmount && typeof pb.uiTokenAmount.uiAmount === "number") return pb.uiTokenAmount.uiAmount;
                            if (pre && pre.uiTokenAmount && typeof pre.uiTokenAmount.uiAmount === "number") return Math.abs((pb?.uiTokenAmount?.uiAmount || 0) - (pre.uiTokenAmount.uiAmount || 0));
                            return rawAmount;
                        })();

                        // filter by tokenFilter (symbol or mint)
                        if (!matchesTokenFilter(tokenSymbol, mint)) continue;

                        allTransfers.push({
                            from: source,
                            to: destination,
                            token: tokenSymbol || mint || "UNKNOWN",
                            amount: Number(uiAmount),
                            timestamp: blockTime || 0,
                            isBinanceInflow: isBinanceAddress(destination),
                            isBinanceOutflow: isBinanceAddress(source),
                        });
                    }

                    // system transfer (native SOL)
                    if (ix.program === "system" && ix.parsed?.type === "transfer") {
                        const { source, destination, lamports } = ix.parsed.info;
                        const amountInSol = Number(lamports) / 1e9;

                        if (!matchesTokenFilter("SOL", null)) continue;

                        allTransfers.push({
                            from: source,
                            to: destination,
                            token: "SOL",
                            amount: Number(amountInSol),
                            timestamp: blockTime || 0,
                            isBinanceInflow: isBinanceAddress(destination),
                            isBinanceOutflow: isBinanceAddress(source),
                        });
                    }
                } catch (e) {
                    // don't let one instruction break the whole tx
                    console.warn("instruction parse error", e);
                }
            }

            // 2) Use preTokenBalances/postTokenBalances diffs to catch SPL movements that might have been opaque
            const preTokenBalances = tx.meta.preTokenBalances || [];
            const postTokenBalances = tx.meta.postTokenBalances || [];

            for (const post of postTokenBalances) {
                try {
                    const pre = preTokenBalances.find((p: any) => p.accountIndex === post.accountIndex && p.mint === post.mint);
                    const preAmt = pre?.uiTokenAmount?.uiAmount || 0;
                    const postAmt = post?.uiTokenAmount?.uiAmount || 0;
                    const diff = Number(postAmt - preAmt);
                    if (!diff) continue;

                    const owner = post.owner || null; // owner could be null for some accounts
                    const mint = post.mint;
                    const tokenSymbol = await resolveTokenSymbol(mint).catch(() => mint);

                    // Only include if matches token filter
                    if (!matchesTokenFilter(tokenSymbol || null, mint)) continue;

                    if (diff > 0) {
                        // incoming to 'owner'
                        allTransfers.push({
                            from: "UNKNOWN", // we couldn't deduce exact source here
                            to: owner || "UNKNOWN",
                            token: tokenSymbol || mint,
                            amount: diff,
                            timestamp: blockTime || 0,
                            isBinanceInflow: isBinanceAddress(owner),
                            isBinanceOutflow: false,
                        });
                    } else if (diff < 0) {
                        // outgoing from 'owner'
                        allTransfers.push({
                            from: owner || "UNKNOWN",
                            to: "UNKNOWN",
                            token: tokenSymbol || mint,
                            amount: Math.abs(diff),
                            timestamp: blockTime || 0,
                            isBinanceInflow: false,
                            isBinanceOutflow: isBinanceAddress(owner),
                        });
                    }
                } catch (e) {
                    console.warn("token balance diff parse error", e);
                }
            }
        }
    }

    // STEP: Identify first funders (same logic as before, but now works for SPL tokens too)
    const firstFunderMap: FirstFunderMap = {};

    for (const tx of allTransfers) {
        const existing = firstFunderMap[tx.to];
        if ((!existing || tx.timestamp < existing.timestamp) && tx.amount > 0.000001 && tx.from !== tx.to) {
            firstFunderMap[tx.to] = { from: tx.from, timestamp: tx.timestamp };
        }
    }

    for (const tx of allTransfers) {
        tx.isFirstFunder =
            firstFunderMap[tx.to]?.from === tx.from && firstFunderMap[tx.to]?.timestamp === tx.timestamp;
    }

    // STEP: Detect Convergence Points
    const receiverMap: Record<string, Set<string>> = {};
    for (const tx of allTransfers) {
        if (!tx.to) continue;
        if (!receiverMap[tx.to]) receiverMap[tx.to] = new Set();
        if (tx.from) receiverMap[tx.to].add(tx.from);
    }

    const convergencePoints: ConvergenceMap = {};
    for (const [wallet, sourcesSet] of Object.entries(receiverMap)) {
        if (sourcesSet.size >= 2) {
            convergencePoints[wallet] = {
                sources: Array.from(sourcesSet),
                count: sourcesSet.size,
            };
        }
    }

    // Step: Detect Repeated Patterns (use your existing engine)
    const repeatedPatterns = detectRepeatedPatterns(allTransfers);
    console.log("🔥 REPEATED PATTERNS DETECTED:", repeatedPatterns);

    return {
        trace: allTransfers,
        firstFunders: firstFunderMap,
        convergencePoints,
        repeatedPatterns,
    };
}
