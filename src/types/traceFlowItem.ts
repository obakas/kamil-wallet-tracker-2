export type TraceFlowItem = {
    from: string;
    to: string;
    token: string;
    amount: number;
    timestamp: number;
    isBinanceInflow: boolean;
    isBinanceOutflow: boolean;
    isFirstFunder?: boolean;
};