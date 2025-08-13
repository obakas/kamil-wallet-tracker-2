import {detectRepeatedPatterns} from "@/lib/patternDetectionEngine";

export type TraceFlowItem = {
    from: string;
    to: string;
    token: string;
    amount: number;
    timestamp: number;
    isBinanceInflow: boolean;
    isBinanceOutflow: boolean;
    isFirstFunder?: boolean;
    onAddressClick?: (address: string) => void;
};

export type ConvergencePoint = {
  // wallet: string;
  sources: string[];
  count: number;
};

export type ConvergencePoints = Record<string, ConvergencePoint>;

export type FirstFunderMap = Record<string, { from: string; timestamp: number }>;

export type TraceFlowItem1 = {
    wallet: string;
    flow: {
        from: string;
        to: string;
        token: string;
        amount: number;
        timestamp: number;
        isBinanceInflow: boolean;
        isBinanceOutflow: boolean;
    }[];
};

export type WalletPattern = {
    wallet: string;
    token: string;
    pattern: string; // e.g., "pump_dump", "binance_cycle"
    timestamp: number;
};

export type RepeatedPatternResult = {
    wallet: string;
    pattern: string;
    tokens: string[];
};


export type PatternMatchResult = {
    wallet: string;
    pattern: string;
    tokens: string[];
    flags: string[];
    score: number;
};


export type PatternMatchProps = {
    results: PatternMatchResult[];
    onAddressClick?: (address: string) => void;
};

export type FlowTimelineTableProps = {
    data: any[]; // Replace with your actual data type
    onAddressClick?: (address: string) => void;
};


export type ConvergenceTableProps = {
    ConvergencePoints: Record<string, { sources: string[]; count: number }>;
    onAddressClick?: (address: string) => void;//
};

export type ConvergenceMap = Record<string, ConvergencePoint>;

export type TraceFlowEngineResult = {
    trace: TraceFlowItem[];
    firstFunders: FirstFunderMap;
    convergencePoints: ConvergenceMap;
    repeatedPatterns: ReturnType<typeof detectRepeatedPatterns>;
};