// app/api/add-binance/route.ts
import { NextResponse } from "next/server";
import { addBinanceWallet, getBinanceWallets } from "@/lib/binanceUtils";
import { traceFlowEngine } from "@/lib/traceFlowEngine";

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

        // Optional: Run trace flow analysis
        const analysisResults = await traceFlowEngine([walletAddress]);

        return NextResponse.json(
            {
                success: true,
                walletAddress,
                allWallets: currentWallets,
                ...analysisResults
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