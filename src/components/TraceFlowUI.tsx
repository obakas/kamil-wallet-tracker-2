// app/components/TraceFlowUI.tsx
"use client";

import React, { useState } from "react";
import { FlowTimelineTable } from "@/components/FlowTimelineTable";

type FlowEntry = {
    from: string;
    to: string;
    token: string;
    amount: number;
    timestamp: number;
    isBinanceInflow: boolean;
    isBinanceOutflow: boolean;
};

export default function TraceFlowUI() {
    const [walletInput, setWalletInput] = useState("");
    const [tokenInput, setTokenInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [flows, setFlows] = useState<FlowEntry[]>([]);
    const [error, setError] = useState("");

    const handleTrace = async () => {
        setLoading(true);
        setError("");
        setFlows([]);

        try {
            const res = await fetch("/api/trace-flow", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    wallets: walletInput
                        .split(",")
                        .map((w) => w.trim())
                        .filter(Boolean),
                    token: tokenInput.trim() || null,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "API call failed");
            }

            const data = await res.json();
            console.log("Trace data:", data);

            if (!Array.isArray(data.trace)) {
                throw new Error("Invalid trace format received.");
            }

            setFlows(data.trace);
        } catch (err: any) {
            console.error("Error tracing flow:", err);
            setError(err.message || "Unexpected error");
        } finally {
            setLoading(false);
        }
    };

    // 🧠 Filtering before rendering
    const filteredFlows = tokenInput.trim()
        ? flows.filter((entry) =>
            entry.token.toLowerCase().includes(tokenInput.trim().toLowerCase())
        )
        : flows;

    return (
        <div className="p-4 bg-white rounded-xl shadow-md">
            <h2 className="text-lg font-bold mb-2 text-black">🔎 Fund Trace Tool</h2>

            <textarea
                className="w-full p-2 border border-gray-300 rounded mb-2 text-black"
                rows={3}
                placeholder="Enter wallet addresses, comma-separated"
                value={walletInput}
                onChange={(e) => setWalletInput(e.target.value)}
            />

            <input
                className="w-full p-2 border border-gray-300 rounded mb-2 text-black"
                type="text"
                placeholder="Filter by token"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
            />

            <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={handleTrace}
                disabled={loading}
            >
                {loading ? "Tracing..." : "Trace Funds"}
            </button>

            {error && <p className="text-red-500 mt-2">{error}</p>}

            {!loading && filteredFlows.length > 0 && (
                <div className="mt-6">
                    <FlowTimelineTable data={filteredFlows} />
                </div>
            )}
        </div>
    );
}
