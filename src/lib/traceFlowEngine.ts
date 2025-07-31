import { BINANCE_WALLETS } from "./binanceUtils";
import { TraceFlowItem } from "@/types/traceFlowItem";
import { FirstFunderMap } from "@/types/FirstFunderMap";
import { ConvergencePoint } from "@/types/ConvergencePoint";

type ConvergenceMap = Record<string, ConvergencePoint>;

type TraceFlowEngineResult = {
    trace: TraceFlowItem[];
    firstFunders: FirstFunderMap;
    convergencePoints: ConvergenceMap;
};

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
                    const { source, destination, amount, mint } = ix.parsed.info;

                    allTransfers.push({
                        from: source,
                        to: destination,
                        token: mint || "UNKNOWN",
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

    return {
        trace: allTransfers,
        firstFunders: firstFunderMap,
        convergencePoints,
    };
}
