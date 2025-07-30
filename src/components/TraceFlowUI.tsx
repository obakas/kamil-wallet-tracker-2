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
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100">
            {/* Header Section */}
            <div className="flex items-center mb-6">
                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Fund Trace Tool</h2>
                    <p className="text-sm text-gray-500">Track cryptocurrency flows between wallets</p>
                </div>
            </div>

            {/* Input Section */}
            <div className="space-y-4 mb-6">
                <div>
                    <label htmlFor="walletInput" className="block text-sm font-medium text-gray-700 mb-1">
                        Wallet Addresses
                    </label>
                    <textarea
                        id="walletInput"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-black"
                        rows={3}
                        placeholder="Enter wallet addresses (comma, space, or newline separated)"
                        value={walletInput}
                        onChange={(e) => setWalletInput(e.target.value)}
                    />
                    <p className="mt-1 text-xs text-gray-500">Supports multiple addresses in any format</p>
                </div>

                <div>
                    <label htmlFor="tokenInput" className="block text-sm font-medium text-gray-700 mb-1">
                        Filter by Token
                    </label>
                    <div className="relative">
                        <input
                            id="tokenInput"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-black"
                            type="text"
                            placeholder="e.g. USDT, ETH, BTC"
                            value={tokenInput}
                            onChange={(e) => setTokenInput(e.target.value)}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Button */}
            <button
                className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all flex items-center justify-center
                ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'}`}
                onClick={handleTrace}
                disabled={loading}
            >
                {loading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Tracing Funds...
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        Trace Funds
                    </>
                )}
            </button>

            {/* Error Message */}
            {error && (
                <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r text-red-700">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {/* Results Section */}
            {!loading && filteredFlows.length > 0 && (
                <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Transaction Flow</h3>
                        <span className="text-sm bg-blue-100 text-blue-800 py-1 px-3 rounded-full">
                            {filteredFlows.length} {filteredFlows.length === 1 ? 'result' : 'results'}
                        </span>
                    </div>
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <FlowTimelineTable data={filteredFlows} />
                    </div>
                </div>
            )}
        </div>
    );
}
