import { BINANCE_WALLETS } from "./binanceUtils";
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


// const RPC_ENDPOINT = process.env.NEXT_PUBLIC_QUIKNODE_M_RPC!;
// export const solanaConnection = new Connection(RPC_ENDPOINT);
// const connection = new Connection(RPC_ENDPOINT);

// async function getMintFromTokenAccount(tokenAccount: string): Promise<string | null> {
//     try {
//         const info = await connection.getParsedAccountInfo(new PublicKey(tokenAccount));
//         const parsed = (info.value?.data as any)?.parsed;
//         return parsed?.info?.mint || null;
//     } catch (err) {
//         console.error("Failed to fetch mint for token account", tokenAccount, err);
//         return null;
//     }
// }

const RPC_ENDPOINT = process.env.NEXT_PUBLIC_QUIKNODE_M_RPC!;
export const solanaConnection = new Connection(RPC_ENDPOINT);
// const connection = new Connection(RPC_ENDPOINT);
export async function getMintFromTokenAccount(tokenAccount: string): Promise<string | null> {
    try {
        const accountInfo = await solanaConnection.getParsedAccountInfo(new PublicKey(tokenAccount));
        const data = accountInfo.value?.data;
        if (
            data &&
            typeof data === "object" &&
            "parsed" in data &&
            data.parsed.info &&
            data.parsed.info.mint
        ) {
            return data.parsed.info.mint as string;
        }
        return null;
    } catch (e) {
        console.error("Failed to fetch mint from token account:", e);
        return null;
    }
}


export async function traceFlowEngine(wallets: string[]): Promise<TraceFlowEngineResult> {
    const QUICKNODE_RPC = process.env.NEXT_PUBLIC_QUIKNODE_M_RPC!;
    const allTransfers: TraceFlowItem[] = [];

    for (const wallet of wallets) {
        const response = await fetch(QUICKNODE_RPC, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "getSignaturesForAddress",
                params: [wallet, { limit: 100 }],
            }),
        });

        const sigs = await response.json();
        const signatures = sigs.result?.map((s: any) => ({
            signature: s.signature,
            blockTime: s.blockTime,
        })) ?? [];

        for (const { signature, blockTime } of signatures) {
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

            const tx = await txDetails.json();
            const parsed = tx.result;

            if (!parsed?.meta || !parsed?.transaction?.message) continue;
            const instructions = parsed.transaction.message.instructions;

            for (const ix of instructions) {
                if (ix.program === "spl-token" && ix.parsed?.type === "transfer") {
                    const { source, destination, amount } = ix.parsed.info;
                    const mint = await getMintFromTokenAccount(source);

                    // if (!mint) {
                    //     console.warn("Skipping SPL transfer with null mint. Source:", source);
                    //     continue;
                    // }

                    // console.log("Resolving mint:", mint);
                    // const tokenSymbol = mint ? await resolveTokenSymbol(mint : "UNKNOWN";
                    // const tokenSymbol = await resolveTokenSymbol(mint ?? ""); 

                    // const tokenSymbol = await resolveTokenSymbol(mint);

                    const tokenSymbol = mint ? await resolveTokenSymbol(mint) : "SOL";
                    // console.log("Resolved symbol:", tokenSymbol);
                    // console.log("Parsed transfer ix:", JSON.stringify(ix, null, 2));



                    allTransfers.push({
                        from: source,
                        to: destination,
                        token: tokenSymbol,
                        amount: Number(amount),
                        timestamp: blockTime || 0,
                        isBinanceInflow: BINANCE_WALLETS.has(destination),
                        isBinanceOutflow: BINANCE_WALLETS.has(source),
                    });
                }

                if (ix.program === "system" && ix.parsed?.type === "transfer") {
                    const { source, destination, lamports } = ix.parsed.info;

                    allTransfers.push({
                        from: source,
                        to: destination,
                        token: "SOL",
                        amount: Number(lamports) / 1e9,
                        timestamp: blockTime || 0,
                        isBinanceInflow: BINANCE_WALLETS.has(destination),
                        isBinanceOutflow: BINANCE_WALLETS.has(source),
                    });
                }
            }
        }
    }

    // Step: Identify first funders
    const firstFunderMap: FirstFunderMap = {};

    for (const tx of allTransfers) {
        const existing = firstFunderMap[tx.to];
        if ((!existing || tx.timestamp < existing.timestamp) && tx.amount > 0.001 && tx.from !== tx.to) {
            firstFunderMap[tx.to] = { from: tx.from, timestamp: tx.timestamp };
        }
    }

    for (const tx of allTransfers) {
        tx.isFirstFunder =
            firstFunderMap[tx.to]?.from === tx.from &&
            firstFunderMap[tx.to]?.timestamp === tx.timestamp;
    }

    // Step: Detect Convergence Points
    const receiverMap: Record<string, Set<string>> = {};
    for (const tx of allTransfers) {
        if (!receiverMap[tx.to]) receiverMap[tx.to] = new Set();
        receiverMap[tx.to].add(tx.from);
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

    //     if (!tokenMap[normalizedMint]) {
    //     console.warn("Unmatched token:", normalizedMint);
    // }


    const known = "So11111111111111111111111111111111111111112"; // SOL
    console.log("Test resolve known:", await resolveTokenSymbol(known));

    // Step: Detect Repeated Patterns
    const repeatedPatterns = detectRepeatedPatterns(allTransfers);
    console.log("🔥 REPEATED PATTERNS DETECTED:", repeatedPatterns);





    return {
        trace: allTransfers,
        firstFunders: firstFunderMap,
        convergencePoints,
        repeatedPatterns,
    };
}
