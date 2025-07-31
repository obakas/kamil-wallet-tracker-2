// app/components/TraceFlowUI.tsx
"use client";

import React, { useState } from "react";
import { FlowTimelineTable } from "@/components/FlowTimelineTable";
import { ClipboardCopyIcon } from "lucide-react";
import { TraceFlowItem } from "@/types/traceFlowItem";
import { FirstFunderMap } from "@/types/FirstFunderMap";
import { ConvergenceTable } from "./ConvergenceTable";



export default function TraceFlowUI() {
    const [walletInput, setWalletInput] = useState("");
    const [tokenInput, setTokenInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [flows, setFlows] = useState<TraceFlowItem[]>([]);
    const [error, setError] = useState("");
    const [firstFunders, setFirstFunders] = useState<FirstFunderMap>({});
    const [convergencePoints, setConvergencePoints] = useState<Record<string, { sources: string[]; count: number }>>({});
    const [activeTab, setActiveTab] = useState<'convergence' | 'flow'>('flow');

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
            setFirstFunders(data.firstFunders || {});
            setConvergencePoints(data.convergencePoints || {});

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
        <div className="max-w-4xl mx-auto p-3 bg-gray-900 rounded-xl shadow-2xl border border-gray-700">
            {/* Header Section */}
            <div className="flex items-center mb-8">
                <div className="bg-gradient-to-br from-blue-800 to-blue-600 p-3 rounded-xl mr-4 shadow-md">
                    <svg className="w-7 h-7 text-blue-100" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-blue-100">
                        Fund Trace Tool
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">Track cryptocurrency flows between wallets with precision</p>
                </div>
            </div>

            {/* Input Section */}
            <div className="space-y-5 mb-8">
                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 shadow-inner">
                    <div className="flex items-center justify-between mb-2">
                        <label htmlFor="walletInput" className="block text-sm font-medium text-gray-300">
                            Wallet Addresses
                        </label>
                        <button
                            onClick={() => setWalletInput('')}
                            className="text-xs text-gray-500 hover:text-blue-400 transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                    <textarea
                        id="walletInput"
                        className="w-full p-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-700/80 text-gray-100 placeholder-gray-500"
                        rows={3}
                        placeholder="Enter wallet addresses (comma, space, or newline separated)"
                        value={walletInput}
                        onChange={(e) => setWalletInput(e.target.value)}
                    />
                    <p className="mt-2 text-xs text-gray-500 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Supports multiple addresses in any format
                    </p>
                </div>

                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 shadow-inner">
                    <label htmlFor="tokenInput" className="block text-sm font-medium text-gray-300 mb-2">
                        Filter by Token
                    </label>
                    <div className="relative">
                        <input
                            id="tokenInput"
                            className="w-full p-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-700/80 text-gray-100 placeholder-gray-500"
                            type="text"
                            placeholder="e.g. USDT, ETH, BTC (leave empty for all tokens)"
                            value={tokenInput}
                            onChange={(e) => setTokenInput(e.target.value)}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <svg className="w-5 h-5 text-gray-500 hover:text-blue-400 transition-colors cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                    {tokenInput && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {tokenInput.split(',').map((token, i) => (
                                <span key={i} className="text-xs bg-blue-900/30 text-blue-300 px-2 py-1 rounded-full flex items-center">
                                    {token.trim()}
                                    <button
                                        onClick={() => setTokenInput(tokenInput.split(',').filter((_, idx) => idx !== i).join(','))}
                                        className="ml-1 text-gray-400 hover:text-white"
                                    >
                                        &times;
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Action Button */}
            <button
                className={`w-full py-3 px-4 rounded-xl font-medium text-white transition-all flex items-center justify-center mb-8
            ${loading ? 'bg-blue-800 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'}`}
                onClick={handleTrace}
                disabled={loading}
            >
                {loading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="font-semibold">Tracing Funds...</span>
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <span className="font-semibold">Trace Funds</span>
                    </>
                )}
            </button>

            {/* Insights Section */}
            {(Object.keys(firstFunders).length > 0 || Object.keys(convergencePoints).length > 0) && (
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Key Insights
                    </h3>

                    {/* 🟡 First Funder Summary */}
                    {Object.entries(firstFunders).length > 0 && (
                        <div className="bg-yellow-900/20 border-l-4 border-yellow-500 rounded-r-lg p-4 mb-4">
                            <h4 className="text-sm font-semibold text-yellow-300 mb-2 flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                First Funders
                            </h4>
                            {Object.entries(firstFunders).map(([recipient, { from, timestamp }]) => (
                                <div key={recipient} className="text-sm text-gray-300 flex justify-between items-center py-1.5">
                                    <div>
                                        <span className="font-mono text-yellow-300 hover:text-yellow-200 transition-colors cursor-pointer" onClick={() => setWalletInput(from)}>
                                            {from}
                                        </span>{" "}
                                        was the <strong>first to fund</strong>{" "}
                                        <span className="font-mono text-blue-300 hover:text-blue-200 transition-colors cursor-pointer" onClick={() => setWalletInput(recipient)}>
                                            {recipient}
                                        </span>{" "}
                                        at{" "}
                                        <span className="text-gray-400">
                                            {new Date(timestamp * 1000).toLocaleString()}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(recipient)}
                                        className="ml-3 text-gray-400 hover:text-gray-100 transition p-1 rounded hover:bg-gray-700/50"
                                        title="Copy recipient address"
                                    >
                                        <ClipboardCopyIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 🔵 Convergence Points Summary */}
                    {Object.entries(convergencePoints).length > 0 && (
                        <div className="bg-blue-900/20 border-l-4 border-blue-500 rounded-r-lg p-4">
                            <h4 className="text-sm font-semibold text-blue-300 mb-2 flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 16h1.5a2.5 2.5 0 100-5H18v-3.5a2.5 2.5 0 00-5 0V16h-4v-3.5a2.5 2.5 0 00-5 0V16H3.5a2.5 2.5 0 100 5H8v3.5a2.5 2.5 0 105 0V21h4v3.5a2.5 2.5 0 105 0V21h1.5a2.5 2.5 0 100-5H18z" />
                                </svg>
                                Convergence Hubs
                            </h4>
                            {Object.entries(convergencePoints)
                                .sort((a, b) => b[1].count - a[1].count)
                                .map(([wallet, data]) => (
                                    <div key={wallet} className="text-sm text-gray-300 flex justify-between items-center py-1.5">
                                        <div>
                                            <span
                                                className="font-mono text-green-300 hover:text-green-200 transition-colors cursor-pointer"
                                                onClick={() => setWalletInput(wallet)}
                                            >
                                                {wallet}
                                            </span>{" "}
                                            is a <strong>convergence hub</strong> with{" "}
                                            <span className="text-green-400 font-bold">{data.count}</span>{" "}
                                            incoming connections
                                        </div>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(wallet)}
                                            className="ml-3 text-gray-400 hover:text-gray-100 transition p-1 rounded hover:bg-gray-700/50"
                                            title="Copy wallet address"
                                        >
                                            <ClipboardCopyIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mt-4 p-4 bg-red-900/30 border-l-4 border-red-500 rounded-r-lg flex items-start mb-8">
                    <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <h4 className="font-medium text-red-100 mb-1">Error occurred</h4>
                        <p className="text-sm text-red-200">{error}</p>
                    </div>
                </div>
            )}

            {/* Results Section with Tabs */}
            {(Object.keys(convergencePoints).length > 0 || filteredFlows.length > 0) && (
                <div className="mt-6">
                    <div className="border-b border-gray-700">
                        <nav className="-mb-px flex space-x-8">
                            {Object.keys(convergencePoints).length > 0 && (
                                <button
                                    onClick={() => setActiveTab('convergence')}
                                    className={`py-3 px-4 border-b-2 font-medium text-sm ${activeTab === 'convergence' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'}`}
                                >
                                    <div className="flex items-center">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 16h1.5a2.5 2.5 0 100-5H18v-3.5a2.5 2.5 0 00-5 0V16h-4v-3.5a2.5 2.5 0 00-5 0V16H3.5a2.5 2.5 0 100 5H8v3.5a2.5 2.5 0 105 0V21h4v3.5a2.5 2.5 0 105 0V21h1.5a2.5 2.5 0 100-5H18z" />
                                        </svg>
                                        Convergence Hubs
                                        <span className="ml-2 bg-blue-900/50 text-blue-100 py-0.5 px-2 rounded-full text-xs">
                                            {Object.keys(convergencePoints).length}
                                        </span>
                                    </div>
                                </button>
                            )}
                            {filteredFlows.length > 0 && (
                                <button
                                    onClick={() => setActiveTab('flow')}
                                    className={`py-3 px-4 border-b-2 font-medium text-sm ${activeTab === 'flow' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'}`}
                                >
                                    <div className="flex items-center">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                        Transaction Flow
                                        <span className="ml-2 bg-blue-900/50 text-blue-100 py-0.5 px-2 rounded-full text-xs">
                                            {filteredFlows.length}
                                        </span>
                                    </div>
                                </button>
                            )}
                        </nav>
                    </div>

                    <div className="mt-4">
                        {/* Convergence Table */}
                        {activeTab === 'convergence' && Object.keys(convergencePoints).length > 0 && (
                            <div className="border border-gray-700 rounded-b-lg rounded-tr-lg overflow-hidden shadow-lg">
                                <ConvergenceTable ConvergencePoints={convergencePoints} />
                            </div>
                        )}

                        {/* Flow Timeline Table */}
                        {activeTab === 'flow' && filteredFlows.length > 0 && (
                            <div className="border border-gray-700 rounded-b-lg rounded-tr-lg overflow-hidden shadow-lg">
                                <FlowTimelineTable data={filteredFlows} />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
