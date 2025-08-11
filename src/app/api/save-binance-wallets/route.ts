import { NextApiRequest, NextApiResponse } from "next";
import { addBinanceWallet, getBinanceWallets } from "@/lib/binanceUtils";
import { NextResponse } from "next/server";


export async function POST(req: Request) {
    try {
        const { walletAddress } = await req.json();

        // Validate the wallet address
        if (!walletAddress || typeof walletAddress !== 'string') {
            return NextResponse.json(
                { error: "Invalid wallet address format" },
                { status: 400 }
            );
        }

        // Add to persistent storage
        addBinanceWallet(walletAddress);

        // Get updated wallets list
        const currentWallets = getBinanceWallets();


        return NextResponse.json(
            {
                success: true,
                walletAddress,
                allWallets: currentWallets
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("Error in /api/add-binance:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function GET() {
    const wallets = getBinanceWallets();
    return NextResponse.json({ wallets }, { status: 200 });
}

// pages/api/save-binance-wallets.ts
// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method === 'POST') {
//     try {
//       const { wallets } = req.body;
      
//       // Validate input
//       if (!Array.isArray(wallets)) {
//         return res.status(400).json({ error: 'Invalid wallet list' });
//       }

//       // Save to database or storage
//       // await saveWalletsToDatabase(wallets);
//       wallets.forEach(walletAddress => addBinanceWallet(walletAddress));

//       // Get updated wallets list
//       getBinanceWallets();

//       return res.status(200).json({ success: true, count: wallets.length });
//     } catch (err) {
//       return res.status(500).json({ error: 'Server error' });
//     }
//   }
// }