
export async function traceFlowEngine(wallets: string[]) {
    const QUICKNODE_RPC = process.env.NEXT_PUBLIC_QUIKNODE_M_RPC!;
    const BINANCE_WALLETS = new Set([
    '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be',
    '0xd551234ae421e3bcba99a0da6d736074f22192ff',
    '0x564286362092d8e7936f0549571a803b203aaced',
    '0x0681d8db095565fe8a346fa0277bffde9c0edbbf',
    '0xfe9e8709d3215310075d67e3ed32a380ccf451c8',
    // Add more as you find them
]);

    const allTransfers: any[] = [];

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

    return { trace: allTransfers };
}
