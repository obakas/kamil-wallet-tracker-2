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




