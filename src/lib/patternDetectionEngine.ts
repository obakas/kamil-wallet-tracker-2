// src/lib/patternDetectionEngine.ts

import { TraceFlowItem } from "@/types/traceFlowItem";

type WalletPattern = {
    wallet: string;
    token: string;
    pattern: string; // e.g., "pump_dump", "binance_cycle"
    timestamp: number;
};

type RepeatedPatternResult = {
    wallet: string;
    pattern: string;
    tokens: string[];
};

export function detectRepeatedPatterns(traceData: TraceFlowItem[]): RepeatedPatternResult[] {
    const walletPatterns: WalletPattern[] = [];

    for (const tx of traceData) {
        // Rule 1: Pump & dump pattern — large inflow, short hold, then outflow
        const inflow = tx.amount > 1000 && !tx.isBinanceOutflow && tx.to;
        const outflow = tx.amount > 1000 && !tx.isBinanceInflow && tx.from;

        if (inflow) {
            walletPatterns.push({
                wallet: tx.to,
                token: tx.token,
                pattern: "pump_inflow",
                timestamp: tx.timestamp,
            });
        }

        if (outflow) {
            walletPatterns.push({
                wallet: tx.from,
                token: tx.token,
                pattern: "dump_outflow",
                timestamp: tx.timestamp,
            });
        }

        // Rule 2: Binance cycle — sends to Binance and later receives from Binance
        if (tx.isBinanceOutflow) {
            walletPatterns.push({
                wallet: tx.from,
                token: tx.token,
                pattern: "binance_outflow",
                timestamp: tx.timestamp,
            });
        }

        if (tx.isBinanceInflow) {
            walletPatterns.push({
                wallet: tx.to,
                token: tx.token,
                pattern: "binance_inflow",
                timestamp: tx.timestamp,
            });
        }
    }

   


    const patternMap: Record<string, RepeatedPatternResult> = {};

    for (const wp of walletPatterns) {
        const key = `${wp.wallet}-${wp.pattern}`;
        if (!patternMap[key]) {
            patternMap[key] = {
                wallet: wp.wallet,
                pattern: wp.pattern,
                tokens: [wp.token],
            };
        } else if (!patternMap[key].tokens.includes(wp.token)) {
            patternMap[key].tokens.push(wp.token);
        }
    }
    console.log("ALL WALLET PATTERNS", walletPatterns);
    console.log("ALL PATTERN MAP", Object.values(patternMap));


    // Only keep those that repeat across more than 1 token
    // return Object.values(patternMap).filter((entry) => entry.tokens.length > 1);
    return Object.values(patternMap);


}

