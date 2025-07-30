import { Connection } from '@solana/web3.js';



const RPC_ENDPOINT = process.env.NEXT_PUBLIC_ALCHEMY_M_API!;
export const solanaConnection = new Connection(RPC_ENDPOINT);





// const ALCHEMY_URL = `https://solana-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY`;
const ALCHEMY_URL = process.env.NEXT_PUBLIC_ALCHEMY_M_API!;

type Transfer = {
    from: string;
    to: string;
    token: string;
    amount: number;
    timestamp: number;
};

export async function getTransactionsForWalletForAlchemy(wallet: string): Promise<Transfer[]> {
    try {
        const res = await fetch(`${ALCHEMY_URL}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "alchemy_getTokenTransfers",
                params: [
                    {
                        address: wallet,
                        category: ["transfer"],
                        maxCount: 1000,
                    },
                ],
            }),
        });

        const { result } = await res.json();

        if (!result?.transfers) return [];

        return result.transfers.map((tx: any) => ({
            from: tx.fromAddress,
            to: tx.toAddress,
            token: tx.tokenSymbol || tx.tokenAddress,
            amount: Number(tx.rawAmount) / 10 ** tx.decimals,
            timestamp: tx.metadata?.blockTimestamp || 0,
        }));
    } catch (err) {
        console.error("Error fetching txs:", err);
        return [];
    }
}




export async function getTransactionsForWalletForHelius(wallet: string): Promise<Transfer[]> {
    const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API;
    const url = `https://api.helius.xyz/v0/addresses/${wallet}/transactions?api-key=${HELIUS_API_KEY}&limit=100`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (!Array.isArray(data)) return [];

        const transfers: Transfer[] = [];

        for (const tx of data) {
            const timestamp = tx.timestamp || 0;

            // Helius handles all transfers under "tokenTransfers"
            if (tx.tokenTransfers && tx.tokenTransfers.length > 0) {
                for (const t of tx.tokenTransfers) {
                    transfers.push({
                        from: t.fromUserAccount,
                        to: t.toUserAccount,
                        token: t.tokenSymbol || t.mint,
                        amount: Number(t.amount),
                        timestamp,
                    });
                }
            }

            // Optional: handle SOL transfers
            if (tx.nativeTransfers && tx.nativeTransfers.length > 0) {
                for (const t of tx.nativeTransfers) {
                    transfers.push({
                        from: t.fromUserAccount,
                        to: t.toUserAccount,
                        token: "SOL",
                        amount: Number(t.amount) / 1e9,
                        timestamp,
                    });
                }
            }
        }

        return transfers;
    } catch (err) {
        console.error("Helius fetch failed:", err);
        return [];
    }
}


// export async function getTransactionsForWalletForQuickNode(wallet: string): Promise<Transfer[]> {
// //   const QUICKNODE_URL = "https://solana-mainnet.rpc.quicknode.com/YOUR_API_KEY";
//   const QUICKNODE_URL = process.env.NEXT_PUBLIC_QUIKNODE_RPC!;

//   try {
//     const res = await fetch(QUICKNODE_URL, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         jsonrpc: "2.0",
//         id: 1,
//         method: "getSignaturesForAddress",
//         params: [wallet, { limit: 50 }],
//       }),
//     });

//     const { result } = await res.json();
//     if (!Array.isArray(result)) return [];

//     const signatures = result.map((tx: any) => tx.signature);
//     const transfers: Transfer[] = [];

//     for (const sig of signatures) {
//       const txRes = await fetch(QUICKNODE_URL, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           jsonrpc: "2.0",
//           id: 1,
//           method: "getParsedTransaction",
//           params: [sig, "jsonParsed"],
//         }),
//       });

//       const txData = await txRes.json();
//       const parsedTx = txData.result;
//       if (!parsedTx?.meta) continue;

//       const timestamp = parsedTx.blockTime || 0;

//       const preTokenBalances = parsedTx.meta.preTokenBalances || [];
//       const postTokenBalances = parsedTx.meta.postTokenBalances || [];

//       // Basic token movement deduction (not perfect)
//       if (preTokenBalances.length && postTokenBalances.length) {
//         for (let i = 0; i < preTokenBalances.length; i++) {
//           const pre = preTokenBalances[i];
//           const post = postTokenBalances.find(b => b.accountIndex === pre.accountIndex);

//           if (post && pre.uiTokenAmount.uiAmount !== post.uiTokenAmount.uiAmount) {
//             const amount = (post.uiTokenAmount.uiAmount || 0) - (pre.uiTokenAmount.uiAmount || 0);

//             transfers.push({
//               from: pre.owner,
//               to: post.owner,
//               token: post.mint,
//               amount: Math.abs(amount),
//               timestamp,
//             });
//           }
//         }
//       }
//     }

//     return transfers;
//   } catch (err) {
//     console.error("QuickNode fetch failed:", err);
//     return [];
//   }
// }



// export async function getTokenBalances(address: string) {
//     const pubKey = new PublicKey(address);
//     const solBalance = await solanaConnection.getBalance(pubKey);

//     const tokenAccounts = await solanaConnection.getParsedTokenAccountsByOwner(pubKey, {
//         programId: TOKEN_PROGRAM_ID
//     });

//     const splTokens = tokenAccounts.value.map((account) => {
//         const info = account.account.data.parsed.info;
//         return {
//             name: info.tokenAmount.name,
//             mint: info.mint,
//             amount: info.tokenAmount.uiAmount,
//             symbol: info.tokenAmount.symbol || '',
//             decimals: info.tokenAmount.decimals
//         };
//     });

//     return {
//         nativeBalance: solBalance / 1e9,
//         tokenAccounts: splTokens
//     };
// }


// export async function detectMemecoins(address: string) {
//     const pubKey = new PublicKey(address);
//     const tokenAccounts = await solanaConnection.getParsedTokenAccountsByOwner(pubKey, {
//         programId: TOKEN_PROGRAM_ID,
//     });

//     let output = `Scanning for memecoins in wallet: ${address}`;
//     let memecoinCount = 0;

//     for (const account of tokenAccounts.value) {
//         const parsed = account.account.data.parsed.info;
//         const mint = parsed.mint;
//         const amount = parsed.tokenAmount.uiAmount;
//         const symbol = parsed.tokenAmount.symbol?.toLowerCase?.() || '';
//         const name = parsed.tokenAmount.name?.toLowerCase?.() || '';

//         const isMemecoin = MEMECOIN_KEYWORDS.some(keyword =>
//             symbol.includes(keyword) || name.includes(keyword)
//         );

//         if (isMemecoin) {
//             memecoinCount++;
//             output += `🚀 Memecoin Detected!\n- Mint Address: ${mint}\n- Symbol: ${symbol.toUpperCase()}\n- Name: ${name}\n- Amount: ${amount}\n\n`;
//         }
//     }

//     output += memecoinCount === 0
//         ? `\nNo memecoins found in this wallet.`
//         : `\n✅ Found ${memecoinCount} memecoin(s).`;

//     return output;
// }

// export async function getTransactions(address: string, numTx: number) {
//     const pubKey = new PublicKey(address);
//     const txList = await solanaConnection.getSignaturesForAddress(pubKey, { limit: numTx });
//     const signatures = txList.map(tx => tx.signature);
//     const txDetails = await solanaConnection.getParsedTransactions(signatures, {
//         maxSupportedTransactionVersion: 0,
//     });

//     const result = txList.map((tx, i) => {
//         const txDetail = txDetails[i];
//         const instructions = txDetail?.transaction.message.instructions.map((ix: any) => ({
//             program: ix.program,
//             programId: ix.programId.toString(),
//             info: ix.parsed?.info || {},
//         })) || [];

//         return {
//             signature: tx.signature,
//             date: new Date((tx.blockTime ?? 0) * 1000).toISOString(),
//             status: tx.confirmationStatus,
//             instructions,
//         };
//     });

//     return result;
// }



// export async function traceTokenTransfers(startAddress: string, depth = 1) {
//     const visited = new Set<string>();
//     const traceResult: {
//         id: string;
//         from: string;
//         to: string;
//         token: string;
//         amount: number;
//         date: string;
//     }[] = [];

//     async function trace(address: string, level: number) {
//         if (level > depth) return;

//         const pubKey = new PublicKey(address);
//         const txList = await solanaConnection.getSignaturesForAddress(pubKey, { limit: 10 });
//         const signatures = txList.map(tx => tx.signature);
//         const txDetails = await solanaConnection.getParsedTransactions(signatures);

//         for (let i = 0; i < txDetails.length; i++) {
//             const tx = txDetails[i];
//             const instructions = tx?.transaction.message.instructions || [];
//             const blockTime = tx?.blockTime ?? 0;
//             const date = new Date(blockTime * 1000).toISOString();
//             const txSig = tx?.transaction.signatures[0];

//             for (const ix of instructions) {
//                 if ('parsed' in ix && ix.parsed) {
//                     const parsed = ix.parsed;
//                     const type = parsed?.type;
//                     const info = parsed?.info;

//                     if (
//                         type === "transfer" &&
//                         info?.destination &&
//                         info?.source === address
//                     ) {
//                         const from = info.source;
//                         const to = info.destination;
//                         const token = ix.programId.toBase58() === "11111111111111111111111111111111" ? "SOL" : info.mint || "UNKNOWN";
//                         const amount = Number(info.amount || 0) / 10 ** (info.decimals || 9);
//                         const key = `${from}->${to}->${token}->${txSig}`;

//                         if (visited.has(key)) continue;
//                         visited.add(key);

//                         traceResult.push({
//                             id: key,
//                             from,
//                             to,
//                             token,
//                             amount,
//                             date
//                         });

//                         await trace(to, level + 1);
//                     }
//                 }
//             }
//         }
//     }

//     await trace(startAddress, 0); // start from level 0
//     return traceResult;
// }





// export async function detectBinanceActivity(address: string) {
//     const pubKey = new PublicKey(address);
//     const txs = await solanaConnection.getSignaturesForAddress(pubKey, { limit: 10 });
//     const signatures = txs.map(tx => tx.signature);
//     const txDetails = await solanaConnection.getParsedTransactions(signatures);

//     let receivedFromBinance = [];
//     let sentToBinance = [];

//     for (const tx of txDetails) {
//         if (!tx) continue;
//         const instructions = tx.transaction.message.instructions;

//         for (const ix of instructions) {
//             const parsed = (ix as any).parsed?.info;
//             if (!parsed) continue;

//             const source = parsed.source || '';
//             const destination = parsed.destination || '';

//             if (BINANCE_WALLETS.includes(source)) {
//                 receivedFromBinance.push({
//                     txSig: tx.transaction.signatures[0],
//                     source,
//                     destination,
//                     time: new Date((tx.blockTime ?? 0) * 1000).toISOString(),
//                 });
//             }

//             if (BINANCE_WALLETS.includes(destination)) {
//                 sentToBinance.push({
//                     txSig: tx.transaction.signatures[0],
//                     source,
//                     destination,
//                     time: new Date((tx.blockTime ?? 0) * 1000).toISOString(),
//                 });
//             }
//         }
//     }

//     return {
//         receivedFromBinance,
//         sentToBinance,
//         totalInteractions: receivedFromBinance.length + sentToBinance.length,
//     };
// }



