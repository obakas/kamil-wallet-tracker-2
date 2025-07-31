import React, { useState } from "react";
import { Button } from "./ui/Button";
import { saveAs } from "file-saver";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { shorten, formatDate } from "@/lib/utils";


type ConvergenceTableProps = {
    ConvergencePoints: Record<string, { sources: string[]; count: number }>;
};

export const ConvergenceTable: React.FC<ConvergenceTableProps> = ({ ConvergencePoints }) => {
    const entries = Object.entries(ConvergencePoints || {}).sort(
        ([, a], [, b]) => b.count - a.count
    );
    const [minConnections, setMinConnections] = useState(1);
    const [searchWallet, setSearchWallet] = useState("");

    const filteredEntries = entries.filter(([wallet, { count }]) => {
        return (
            count >= minConnections &&
            wallet.toLowerCase().includes(searchWallet.toLowerCase())
        );
    });


    if (!entries.length) return null;

    const exportCSV = () => {
        const csv = Papa.unparse(
            filteredEntries.map(([wallet, { sources, count }], idx) => ({
                SN: idx + 1,
                Wallet: wallet,
                "Source Count": count,
                "Source Wallets": sources.join(" | "),
            }))
        );

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        saveAs(blob, `convergence_hubs_${Date.now()}.csv`);
    };


    const exportPDF = () => {
        const doc = new jsPDF();

        autoTable(doc, {
            head: [["SN", "Wallet", "Source Count", "Source Wallets"]],
            body: filteredEntries.map(([wallet, { sources, count }], idx) => [
                idx + 1,
                shorten(wallet),
                count,
                sources.slice(0, 5).map(shorten).join(", ") + (sources.length > 5 ? "..." : ""),
            ]),
            headStyles: {
                fillColor: [59, 130, 246], // blue-500
                textColor: 255,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [249, 250, 251] // gray-50
            },
            styles: {
                fontSize: 8,
                cellPadding: 2
            },
        });

        doc.save(`convergence_hubs_${Date.now()}.pdf`);
    };


    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 border-b border-gray-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="bg-indigo-900/50 p-2 rounded-lg mr-3">
                            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 16h1.5a2.5 2.5 0 100-5H18v-3.5a2.5 2.5 0 00-5 0V16h-4v-3.5a2.5 2.5 0 00-5 0V16H3.5a2.5 2.5 0 100 5H8v3.5a2.5 2.5 0 105 0V21h4v3.5a2.5 2.5 0 105 0V21h1.5a2.5 2.5 0 100-5H18z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-100">Convergence Hubs</h2>
                            <p className="text-sm text-gray-400 mt-1">Wallets receiving from multiple sources</p>
                        </div>
                    </div>
                    <span className="text-xs bg-gray-800 text-indigo-400 py-1 px-3 rounded-full font-medium border border-gray-700">
                        {entries.length} {entries.length === 1 ? 'hub' : 'hubs'} detected
                    </span>
                </div>
            </div>

            {/*  Controls for ConvergenceTable */}
            <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700 shadow-lg mb-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">

                        {/* Min Connections Filter */}
                        <div className="relative min-w-[180px]">
                            <label htmlFor="minConnections" className="block text-xs font-medium text-gray-400 mb-1">
                                Min Shared Sources
                            </label>
                            <input
                                id="minConnections"
                                type="number"
                                min={1}
                                value={minConnections}
                                onChange={(e) => setMinConnections(Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-700/80 text-gray-100"
                            />
                        </div>

                        {/* Wallet Search */}
                        <div className="relative min-w-[220px]">
                            <label htmlFor="searchWallet" className="block text-xs font-medium text-gray-400 mb-1">
                                Search Wallet
                            </label>
                            <input
                                id="searchWallet"
                                type="text"
                                value={searchWallet}
                                onChange={(e) => setSearchWallet(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700/80 text-gray-100 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Enter wallet address"
                            />
                        </div>

                        {/* Clear Filters */}
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setMinConnections(1);
                                setSearchWallet("");
                            }}
                            className="mt-6 text-gray-300 hover:bg-gray-700/50 border border-gray-600"
                        >
                            Clear Filters
                        </Button>

                        {/* Export Buttons */}
                        <div className="flex items-center gap-2 ml-2 mt-6">
                            <Button
                                onClick={exportCSV}
                                size="sm"
                                className="gap-2 bg-green-800/80 hover:bg-green-700/80 border border-green-700/50 text-green-100"
                            >
                                Export CSV
                            </Button>
                            <Button
                                onClick={exportPDF}
                                size="sm"
                                className="gap-2 bg-red-800/80 hover:bg-red-700/80 border border-red-700/50 text-red-100"
                            >
                                Export PDF
                            </Button>
                        </div>
                    </div>

                    {/* Result Count */}
                    <div className="mt-6">
                        <span className="text-sm bg-indigo-900/50 text-indigo-100 py-1.5 px-4 rounded-full font-medium border border-indigo-800">
                            {filteredEntries.length} {filteredEntries.length === 1 ? "hub" : "hubs"} shown
                        </span>
                    </div>
                </div>
            </div>


            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-800/50">
                        <tr className="text-left text-sm font-medium text-gray-400">
                            <th className="px-6 py-3">Wallet</th>
                            <th className="px-6 py-3 text-right">Incoming</th>
                            <th className="px-6 py-3">Source Wallets</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {entries.map(([wallet, { count, sources }]) => (
                            <tr key={wallet} className="hover:bg-gray-800/30 transition-colors group">
                                {/* Wallet Address */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-9 w-9 rounded-full bg-gray-800 flex items-center justify-center mr-3 border border-gray-700 group-hover:border-indigo-500 transition-colors">
                                            <svg className="h-4 w-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <a
                                                href={`https://solscan.io/account/${wallet}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm font-mono font-medium text-gray-100 hover:text-indigo-400 transition-colors"
                                            >
                                                {wallet.slice(0, 6)}...{wallet.slice(-4)}
                                            </a>
                                            <div className="flex items-center mt-1">
                                                <span className="text-xs text-gray-500">Solana</span>
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(wallet)}
                                                    className="ml-2 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-300 transition-opacity"
                                                    title="Copy address"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                {/* Connection Count */}
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-900/30 text-indigo-400 border border-indigo-800/50">
                                        {count}
                                        <svg className="ml-1 w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                    </span>
                                </td>

                                {/* Source Wallets */}
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1.5">
                                        {sources.slice(0, 4).map((src) => (
                                            <a
                                                key={src}
                                                href={`https://solscan.io/account/${src}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors border border-gray-700"
                                                title={src}
                                            >
                                                {src.slice(0, 4)}...{src.slice(-4)}
                                            </a>
                                        ))}
                                        {sources.length > 4 && (
                                            <span
                                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-800/50 text-gray-500 cursor-help border border-gray-700"
                                                title={`${sources.length - 4} more sources`}
                                            >
                                                +{sources.length - 4}
                                            </span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Empty State */}
            {entries.length === 0 && (
                <div className="p-8 text-center border-t border-gray-800">
                    <div className="mx-auto w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mb-3">
                        <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-sm font-medium text-gray-300">No convergence detected</h3>
                    <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">These wallets don't show multiple funding sources in the analyzed transactions.</p>
                </div>
            )}

            {/* Footer */}
            <div className="bg-gray-900/50 px-6 py-3 border-t border-gray-800 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                    Showing <span className="font-medium text-gray-400">1-{entries.length}</span> of <span className="font-medium text-gray-400">{entries.length}</span>
                </p>
                <div className="flex space-x-2">
                    <button className="px-2.5 py-1 rounded-md text-xs font-medium text-gray-400 bg-gray-800 border border-gray-700 hover:bg-gray-700/50 hover:text-gray-300 transition-colors disabled:opacity-50">
                        <svg className="w-3.5 h-3.5 mr-1 -ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Previous
                    </button>
                    <button className="px-2.5 py-1 rounded-md text-xs font-medium text-gray-400 bg-gray-800 border border-gray-700 hover:bg-gray-700/50 hover:text-gray-300 transition-colors">
                        Next
                        <svg className="w-3.5 h-3.5 ml-1 -mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

