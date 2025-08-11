// app/components/TraceFlowUI.tsx
"use client";

import { useState, useEffect } from "react";
import { FlowTimelineTable } from "@/components/FlowTimelineTable";
import { ClipboardCopyIcon, ClipboardPasteIcon, XIcon, Info, Zap, ArrowRightIcon, ShareIcon, AlertCircle, Box, Download, CheckIcon, EditIcon } from "lucide-react";
import { TraceFlowItem } from "@/types/traceFlowItem";
import { FirstFunderMap } from "@/types/FirstFunderMap";
import { ConvergenceTable } from "./ConvergenceTable";
import { PatternMatchTable, PatternMatchResult } from "@/components/PatternMatchTable";
import { HARDCODED_BINANCE_WALLETS } from "@/lib/binanceUtils";



export default function TraceFlowUI() {
    const [walletInput, setWalletInput] = useState("");
    const [tokenInput, setTokenInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [flows, setFlows] = useState<TraceFlowItem[]>([]);
    const [error, setError] = useState("");
    const [firstFunders, setFirstFunders] = useState<FirstFunderMap>({});
    const [convergencePoints, setConvergencePoints] = useState<Record<string, { sources: string[]; count: number }>>({});
    const [activeTab, setActiveTab] = useState<'convergence' | 'flow' | 'patterns'>('flow');
    const [repeatedPatterns, setRepeatedPatterns] = useState<PatternMatchResult[]>([]);
    const [binanceWallets, setBinanceWallets] = useState<string[]>(Array.from(HARDCODED_BINANCE_WALLETS));
    const [isEditingWallets, setIsEditingWallets] = useState(false);
    const [newWalletInput, setNewWalletInput] = useState("");

    // const [walletAddress, setWalletAddress] = useState('');
    // const [isLoading, setIsLoading] = useState(false);
    // const [result, setResult] = useState<any>(null);

    // const handleSaveWallets = async () => {
    //     setIsLoading(true);
    //     setError("");

    //     try {
    //         const updatedWallets = newWalletInput
    //             .split("\n")
    //             .filter(w => w.trim());

    //         const response = await fetch('/api/binance/wallets', {
    //             method: 'PUT',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify({ wallets: updatedWallets }),
    //         });

    //         if (!response.ok) {
    //             const errorData = await response.json();
    //             throw new Error(errorData.message || 'Failed to save wallets');
    //         }

    //         const data = await response.json();
    //         setBinanceWallets(data.wallets); // Use the validated wallets from server
    //         setIsEditingWallets(false);
    //         setNewWalletInput("");
    //         setResult({ success: true, count: data.wallets.length });

    //     } catch (err) {
    //         setError(err instanceof Error ? err.message : 'Save failed');
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

    // const handleSaveWallet = async (e: React.FormEvent) => {
    //     e.preventDefault();
    //     setIsLoading(true);
    //     setResult(null);
    //     setResult(null);

    //     try {
    //         const response = await fetch('/api/add-binance', {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify({ walletAddress }),
    //         });

    //         const data = await response.json();

    //         console.log("Response data:", data);

    //         if (!response.ok) {
    //             throw new Error(data.error || 'Failed to add wallet');
    //         }

    //         setResult(data);
    //         setWalletAddress('');
    //     } catch (err) {
    //         setError(err instanceof Error ? err.message : 'Unknown error occurred');
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };


    // console.log("Initial Binance Wallets:", BINANCE_WALLETS);




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
            // setRepeatedPatterns(data.repeatedPatterns || []);

            // 👇 Transform raw pattern results into full table-compatible objects
            const patternResults: PatternMatchResult[] = (data.repeatedPatterns || []).map((p: any) => ({
                wallet: p.wallet,
                pattern: p.pattern,
                tokens: p.tokens,
                flags: [p.pattern], // You can refine this later
                score: p.tokens.length * 5 // Scoring logic can be smarter, but this works
            }));

            setRepeatedPatterns(patternResults);

            console.log("Transformed Pattern Results:", patternResults);




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


    console.log("State set - repeatedPatterns:", repeatedPatterns); // Might show stale state

    // Better: Use a useEffect to log when state updates
    useEffect(() => {
        console.log("Updated repeatedPatterns:", repeatedPatterns);
    }, [repeatedPatterns]);



    // Utility function to truncate wallet addresses
    const truncateAddress = (address: string, startLength = 6, endLength = 4) => {
        if (!address) return '';
        if (address.length <= startLength + endLength) return address;
        return `${address.substring(0, startLength)}...${address.substring(address.length - endLength)}`;
    };


    // Load saved wallets on init
    useEffect(() => {
        const savedWallets = localStorage.getItem("binanceWallets");
        if (savedWallets) setBinanceWallets(JSON.parse(savedWallets));
    }, []);

    // Save on update
    const updateWallets = (wallets: string[]) => {
        setBinanceWallets(wallets);
        localStorage.setItem("binanceWallets", JSON.stringify(wallets));
    };

    // In table rendering logic:
    const isBinanceWallet = (address: string) =>
        binanceWallets.some(w => w.toLowerCase() === address.toLowerCase());



    return (
        <div className="max-w-5xl mx-auto p-4 bg-gray-900 rounded-xl shadow-2xl border border-gray-700/50 backdrop-blur-sm">
            {/* Header Section */}
            <div className="flex items-center mb-8">
                <div className="bg-gradient-to-br from-blue-700 to-blue-500 p-3 rounded-xl mr-4 shadow-lg ring-2 ring-blue-500/30">
                    <svg className="w-8 h-8 text-blue-100" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-blue-100 tracking-tight">
                        Fund Trace Tool
                    </h1>
                    <p className="text-sm text-gray-400 mt-1.5">Track cryptocurrency flows between wallets with precision</p>
                </div>
            </div>

            {/* Input Section */}
            <div className="space-y-6 mb-8">
                {/* Wallet Addresses Input */}
                <div className="bg-gray-800/40 p-5 rounded-xl border border-gray-700/50 shadow-lg hover:shadow-blue-900/10 transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <label htmlFor="walletInput" className="block text-sm font-medium text-gray-300 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Wallet Addresses
                        </label>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => navigator.clipboard.readText().then(text => setWalletInput(text))}
                                className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                                title="Paste from clipboard"
                            >
                                <ClipboardPasteIcon className="w-3 h-3" />
                                Paste
                            </button>
                            <button
                                onClick={() => setWalletInput('')}
                                className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                            >
                                <XIcon className="w-3 h-3" />
                                Clear
                            </button>
                        </div>
                    </div>
                    <textarea
                        id="walletInput"
                        className="w-full p-3 border border-gray-600/50 rounded-lg focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500 transition-all bg-gray-700/30 text-gray-100 placeholder-gray-500 font-mono text-sm"
                        rows={4}
                        placeholder="Enter wallet addresses (comma, space, or newline separated)"
                        value={walletInput}
                        onChange={(e) => setWalletInput(e.target.value)}
                    />
                    <div className="mt-2 flex items-start text-xs text-gray-500">
                        <Info className="w-3.5 h-3.5 mr-1.5 mt-0.5 flex-shrink-0" />
                        <span>Supports multiple addresses in any format. You can paste a list directly from Excel or other sources.</span>
                    </div>
                </div>

                {/* Token Filter Input */}
                <div className="bg-gray-800/40 p-5 rounded-xl border border-gray-700/50 shadow-lg hover:shadow-blue-900/10 transition-shadow">
                    <label htmlFor="tokenInput" className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                        Filter by Token
                    </label>
                    <div className="relative">
                        <input
                            id="tokenInput"
                            className="w-full p-3 border border-gray-600/50 rounded-lg focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500 transition-all bg-gray-700/30 text-gray-100 placeholder-gray-500 font-mono text-sm"
                            type="text"
                            placeholder="e.g. USDT, ETH, BTC (leave empty for all tokens)"
                            value={tokenInput}
                            onChange={(e) => setTokenInput(e.target.value)}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <button
                                onClick={() => setTokenInput('')}
                                className="text-gray-500 hover:text-blue-400 transition-colors p-1"
                            >
                                <XIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    {tokenInput && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {tokenInput.split(',').filter(t => t.trim()).map((token, i) => (
                                <span key={i} className="text-xs bg-blue-900/40 text-blue-200 px-2.5 py-1 rounded-full flex items-center border border-blue-800/50">
                                    {token.trim().toUpperCase()}
                                    <button
                                        onClick={() => setTokenInput(tokenInput.split(',').filter((_, idx) => idx !== i).join(','))}
                                        className="ml-1.5 text-gray-400 hover:text-white transition-colors"
                                    >
                                        &times;
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                    <div className="mt-2 flex items-start text-xs text-gray-500">
                        <Info className="w-3.5 h-3.5 mr-1.5 mt-0.5 flex-shrink-0" />
                        <span>Enter token symbols separated by commas. Common tokens will show additional analytics.</span>
                    </div>
                </div>
            </div>


            {/* Binance Wallets Section */}
            <div className="bg-gray-800/40 p-5 rounded-xl border border-gray-700/50 mb-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-300 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        Binance Wallets ({binanceWallets.length})
                    </h3>
                    <button
                        onClick={() => setIsEditingWallets(!isEditingWallets)}
                        className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                    >
                        {isEditingWallets ? <CheckIcon className="w-3 h-3" /> : <EditIcon className="w-3 h-3" />}
                        {isEditingWallets ? "Done" : "Edit"}
                    </button>
                </div>

                {isEditingWallets ? (
                    <div className="space-y-3">
                        <textarea
                            className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700/30 text-gray-100 font-mono text-sm"
                            value={newWalletInput || binanceWallets.join("\n")}
                            onChange={(e) => setNewWalletInput(e.target.value)}
                            placeholder="One wallet per line"
                            rows={5}
                        />
                        <div className="flex gap-2">
                            {/* <button
                                onClick={async () => {
                                    const updatedWallets = newWalletInput
                                        .split("\n")
                                        .filter(w => w.trim());

                                    // Update local state first
                                    setBinanceWallets(updatedWallets);
                                    setIsEditingWallets(false);

                                    // Save to API
                                    try {
                                        setIsLoading(true);
                                        const response = await fetch('/api/save-binance-wallets', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                            },
                                            body: JSON.stringify({ wallets: updatedWallets }),
                                        });

                                        if (!response.ok) {
                                            throw new Error('Failed to save wallets');
                                        }

                                        // Optional: Refresh from API if needed
                                        const data = await response.json();
                                        setResult(data);
                                    } catch (err) {
                                        setError(err instanceof Error ? err.message : 'Save failed');
                                    } finally {
                                        setIsLoading(false);
                                    }
                                }}
                                disabled={isLoading}
                                className="text-xs bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded disabled:opacity-50"
                            >
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </button> */}
                
                                <button
                                onClick={() => {
                                    const updatedWallets = newWalletInput.split("\n").filter(w => w.trim());
                                    setBinanceWallets(updatedWallets);
                                    setIsEditingWallets(false);
                                }}
                                className="text-xs bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded"
                            >
                                Save Changes
                            </button>
                            <button
                                onClick={() => {
                                    setIsEditingWallets(false);
                                    setNewWalletInput("");
                                }}
                                className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {binanceWallets.map((wallet, i) => (
                            <div key={i} className="flex items-center justify-between p-2 bg-gray-700/20 rounded hover:bg-gray-700/40">
                                <span className="font-mono text-sm text-gray-300">
                                    {truncateAddress(wallet, 8, 6)}
                                </span>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => navigator.clipboard.writeText(wallet)}
                                        className="text-gray-400 hover:text-blue-400 transition-colors p-1"
                                        title="Copy"
                                    >
                                        <ClipboardCopyIcon className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {/* <div className="bg-gray-800/40 p-5 rounded-xl border border-gray-700/50 mb-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-300 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        Binance Wallets
                    </h3>
                    <button
                        onClick={() => setIsEditingWallets(!isEditingWallets)}
                        className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                    >
                        {isEditingWallets ? <CheckIcon className="w-3 h-3" /> : <EditIcon className="w-3 h-3" />}
                        {isEditingWallets ? "Save" : "Edit"}
                    </button>
                </div>

                {isEditingWallets ? (
                    <div className="space-y-3">
                        <textarea
                            className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700/30 text-gray-100 font-mono text-sm"
                            value={newWalletInput}
                            onChange={(e) => setNewWalletInput(e.target.value)}
                            placeholder="Add wallets (one per line)"
                            rows={4}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    const wallets = newWalletInput.split('\n').filter(w => w.trim());
                                    setBinanceWallets(wallets);
                                    setIsEditingWallets(false);
                                }}
                                className="text-xs bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded"
                            >
                                Confirm
                            </button>
                            <button
                                onClick={() => setIsEditingWallets(false)}
                                className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {binanceWallets.length > 0 ? (
                            binanceWallets.map((wallet, i) => (
                                <div key={i} className="flex items-center justify-between p-2 bg-gray-700/20 rounded">
                                    <span className="font-mono text-sm text-gray-300">{truncateAddress(wallet, 8, 6)}</span>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(wallet)}
                                        className="text-gray-400 hover:text-blue-400 transition-colors p-1"
                                        title="Copy"
                                    >
                                        <ClipboardCopyIcon className="w-3 h-3" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-gray-500">No Binance wallets configured.</p>
                        )}
                    </div>
                )}
            </div> */}

            {/* Action Button */}
            <button
                className={`w-full py-4 px-6 rounded-xl font-medium text-white transition-all flex items-center justify-center mb-8 shadow-lg
                ${loading
                        ? 'bg-blue-800/80 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 hover:shadow-xl hover:scale-[1.01] active:scale-95'
                    }`}
                onClick={handleTrace}
                disabled={loading}
            >
                {loading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="font-semibold tracking-wide">Tracing Funds...</span>
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <span className="font-semibold tracking-wide">Trace Funds</span>
                    </>
                )}
            </button>

            {/* Insights Section */}
            {(Object.keys(firstFunders).length > 0 || Object.keys(convergencePoints).length > 0) && (
                <div className="mb-8 space-y-4">
                    <h3 className="text-xl font-semibold text-gray-100 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Key Insights
                    </h3>

                    {/* First Funder Summary */}
                    {Object.entries(firstFunders).length > 0 && (
                        <div className="bg-yellow-900/10 border border-yellow-800/50 rounded-xl p-5 shadow-lg">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-yellow-300 flex items-center">
                                    <Zap className="w-4 h-4 mr-2" />
                                    First Funders
                                </h4>
                                <span className="text-xs bg-yellow-900/30 text-yellow-200 px-2 py-1 rounded-full">
                                    {Object.keys(firstFunders).length} found
                                </span>
                            </div>
                            <div className="space-y-3">
                                {Object.entries(firstFunders).map(([recipient, { from, timestamp }]) => (
                                    <div key={recipient} className="text-sm text-gray-300 p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center">
                                                    <span
                                                        className="font-mono text-yellow-300 hover:text-yellow-200 transition-colors cursor-pointer text-xs"
                                                        onClick={() => setWalletInput(from)}
                                                    >
                                                        {truncateAddress(from)}
                                                    </span>
                                                    <ArrowRightIcon className="w-3 h-3 mx-2 text-gray-500" />
                                                    <span
                                                        className="font-mono text-blue-300 hover:text-blue-200 transition-colors cursor-pointer text-xs"
                                                        onClick={() => setWalletInput(recipient)}
                                                    >
                                                        {truncateAddress(recipient)}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    First transaction at {new Date(timestamp * 1000).toLocaleString()}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => navigator.clipboard.writeText(recipient)}
                                                className="text-gray-400 hover:text-gray-100 transition p-1 rounded hover:bg-gray-700/50"
                                                title="Copy address"
                                            >
                                                <ClipboardCopyIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Convergence Points Summary */}
                    {Object.entries(convergencePoints).length > 0 && (
                        <div className="bg-blue-900/10 border border-blue-800/50 rounded-xl p-5 shadow-lg">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-blue-300 flex items-center">
                                    <ShareIcon className="w-4 h-4 mr-2" />
                                    Convergence Hubs
                                </h4>
                                <span className="text-xs bg-blue-900/30 text-blue-200 px-2 py-1 rounded-full">
                                    {Object.keys(convergencePoints).length} found
                                </span>
                            </div>
                            <div className="space-y-3">
                                {Object.entries(convergencePoints)
                                    .sort((a, b) => b[1].count - a[1].count)
                                    .map(([wallet, data]) => (
                                        <div key={wallet} className="text-sm text-gray-300 p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <div className="font-mono text-green-300 hover:text-green-200 transition-colors cursor-pointer text-xs"
                                                        onClick={() => setWalletInput(wallet)}
                                                    >
                                                        {truncateAddress(wallet)}
                                                    </div>
                                                    <div className="flex items-center mt-1">
                                                        <span className="text-xs bg-green-900/30 text-green-300 px-2 py-0.5 rounded-full">
                                                            {data.count} incoming connections
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(wallet)}
                                                    className="text-gray-400 hover:text-gray-100 transition p-1 rounded hover:bg-gray-700/50"
                                                    title="Copy address"
                                                >
                                                    <ClipboardCopyIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mt-4 p-4 bg-red-900/20 border border-red-800/50 rounded-xl flex items-start mb-8 animate-fade-in">
                    <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-red-400" />
                    <div>
                        <h4 className="font-medium text-red-100 mb-1">Error occurred</h4>
                        <p className="text-sm text-red-200">{error}</p>
                    </div>
                </div>
            )}

            {/* Results Section with Tabs */}
            {(Object.keys(convergencePoints).length > 0 || filteredFlows.length > 0 || repeatedPatterns.length > 0) && (
                <div className="mt-6">
                    <div className="border-b border-gray-700">
                        <nav className="-mb-px flex space-x-8 overflow-x-auto pb-1">
                            {Object.keys(convergencePoints).length > 0 && (
                                <button
                                    onClick={() => setActiveTab('convergence')}
                                    className={`py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'convergence'
                                        ? 'border-blue-500 text-blue-400'
                                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'
                                        }`}
                                >
                                    <div className="flex items-center">
                                        <ShareIcon className="w-4 h-4 mr-2" />
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
                                    className={`py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'flow'
                                        ? 'border-blue-500 text-blue-400'
                                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'
                                        }`}
                                >
                                    <div className="flex items-center">
                                        <ArrowRightIcon className="w-4 h-4 mr-2" />
                                        Transaction Flow
                                        <span className="ml-2 bg-blue-900/50 text-blue-100 py-0.5 px-2 rounded-full text-xs">
                                            {filteredFlows.length}
                                        </span>
                                    </div>
                                </button>
                            )}
                            {repeatedPatterns.length > 0 && (
                                <button
                                    onClick={() => setActiveTab('patterns')}
                                    className={`py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'patterns'
                                        ? 'border-purple-500 text-purple-400'
                                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'
                                        }`}
                                >
                                    <div className="flex items-center">
                                        <Box className="w-4 h-4 mr-2" />
                                        Pattern Detection
                                        <span className="ml-2 bg-purple-900/50 text-purple-100 py-0.5 px-2 rounded-full text-xs">
                                            {repeatedPatterns.length}
                                        </span>
                                    </div>
                                </button>
                            )}
                        </nav>
                    </div>

                    <div className="mt-4">
                        {/* Convergence Table */}
                        {activeTab === 'convergence' && Object.keys(convergencePoints).length > 0 && (
                            <div className="border border-gray-700/50 rounded-lg overflow-hidden shadow-lg">
                                <ConvergenceTable
                                    ConvergencePoints={convergencePoints}
                                    onAddressClick={(address: string) => setWalletInput(prev => prev ? `${prev}, ${address}` : address)}
                                />
                            </div>
                        )}

                        {/* Flow Timeline Table */}
                        {activeTab === 'flow' && filteredFlows.length > 0 && (
                            <div className="border border-gray-700/50 rounded-lg overflow-hidden shadow-lg">
                                <FlowTimelineTable
                                    data={filteredFlows}
                                    onAddressClick={(address: string) => setWalletInput(prev => prev ? `${prev}, ${address}` : address)}
                                />
                            </div>
                        )}

                        {/* Pattern Detection */}
                        {activeTab === 'patterns' && repeatedPatterns.length > 0 && (
                            <div className="border border-gray-700/50 rounded-lg overflow-hidden shadow-lg">
                                <div className="p-5 bg-gray-800/30">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                                        <h2 className="text-lg font-semibold flex items-center">
                                            <Box className="w-5 h-5 mr-2 text-purple-400" />
                                            Suspicious Activity Patterns
                                        </h2>
                                    </div>
                                    <PatternMatchTable
                                        results={repeatedPatterns}
                                        onAddressClick={(address: string) => setWalletInput(prev => prev ? `${prev}, ${address}` : address)}
                                    />
                                    <div className="mt-4 text-sm text-gray-400 flex items-start">
                                        <Info className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                                        <span>Patterns are detected based on transaction behaviors across multiple tokens. Higher scores indicate stronger patterns.</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div> 
                </div>
            )}
        </div>
    );
}
