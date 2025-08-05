// detectRepeatedPatterns.ts

import { TraceFlowItem1 } from "@/types/traceFlowItem"; // assuming you have a TraceResult per token

export type TokenTraceProfile = {
    token: string;
    wallet: string;
    inflowCount: number;
    outflowCount: number;
    outflowToBinance: boolean;
    timeHeldAvgMinutes: number;
    outflowRatio: number; // out / in value ratio
};

export type PatternMatchResult = {
    wallet: string;
    tokens: string[];
    flags: string[];
    score: number; // 0 to 100 match score
};

/**
 * Analyze multiple trace results and return repeated behavior patterns
 */
export function detectRepeatedPatterns(TraceFlowItem1: Record<string, TraceFlowItem1[]>): PatternMatchResult[] {
    const profileMap: Map<string, TokenTraceProfile[]> = new Map();

    // Step 1: Create behavior profiles
    for (const [token, traces] of Object.entries(TraceFlowItem1)) {
        for (const trace of traces) {
            const inflows = trace.flow.filter(f => f.to === trace.wallet);
            const outflows = trace.flow.filter(f => f.from === trace.wallet);
            const toBinance = outflows.some(f => f.to.toLowerCase().includes("binance"));

            const inflowSum = inflows.reduce((acc, f) => acc + (f.amount || 0), 0);
            const outflowSum = outflows.reduce((acc, f) => acc + (f.amount || 0), 0);

            const avgHoldTime = outflows.length > 0
                ? outflows.reduce((acc, f) => acc + (f.timestamp - inflows[0]?.timestamp), 0) / outflows.length / 60
                : 0;

            const profile: TokenTraceProfile = {
                token,
                wallet: trace.wallet,
                inflowCount: inflows.length,
                outflowCount: outflows.length,
                outflowToBinance: toBinance,
                timeHeldAvgMinutes: Math.round(avgHoldTime),
                outflowRatio: inflowSum ? outflowSum / inflowSum : 0,
            };

            if (!profileMap.has(trace.wallet)) profileMap.set(trace.wallet, []);
            profileMap.get(trace.wallet)!.push(profile);
        }
    }

    // Step 2: Detect repeated behavior across tokens
    const results: PatternMatchResult[] = [];
    for (const [wallet, profiles] of profileMap.entries()) {
        if (profiles.length < 2) continue; // must appear in multiple tokens

        const flags: string[] = [];
        const score = (() => {
            let score = 0;
            const binanceFlags = profiles.filter(p => p.outflowToBinance).length;
            const highDumpRatio = profiles.filter(p => p.outflowRatio > 0.8).length;
            const fastMoves = profiles.filter(p => p.timeHeldAvgMinutes < 60).length;

            if (binanceFlags > 1) flags.push("Repeated Binance Exit");
            if (highDumpRatio > 1) flags.push("High Dump Ratio");
            if (fastMoves > 1) flags.push("Rapid Dump");

            score += binanceFlags * 20 + highDumpRatio * 25 + fastMoves * 15;
            return Math.min(score, 100);
        })();

        if (score >= 50) {
            results.push({
                wallet,
                tokens: profiles.map(p => p.token),
                flags,
                score,
            });
        }
    }

    return results;
}
