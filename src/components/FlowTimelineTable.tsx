"use client";
import React, { useState, useMemo } from "react";
import { shorten, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { saveAs } from "file-saver";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type FlowItem = {
    from: string;
    to: string;
    token: string;
    amount: number;
    timestamp: number;
    isBinanceInflow: boolean;
    isBinanceOutflow: boolean;
};

export const FlowTimelineTable = ({ data }: { data: FlowItem[] }) => {
    const [tokenFilter, setTokenFilter] = useState("");

    // Extract unique tokens from the data
    const uniqueTokens = useMemo(() => {
        const tokens = Array.from(
            new Set(data.map((entry) => entry.token).filter(Boolean))
        );
        return tokens.sort((a, b) => a.localeCompare(b));
    }, [data]);

    // Filter data by selected token
    const filteredData = useMemo(() => {
        if (!tokenFilter.trim()) return data;
        return data.filter(
            (flow) =>
                flow.token?.toLowerCase() === tokenFilter.toLowerCase()
        );
    }, [tokenFilter, data]);

    const exportCSV = () => {
        const csv = Papa.unparse(
            filteredData.map((entry, idx) => ({
                SN: idx + 1,
                From: entry.from,
                To: entry.to,
                Token: entry.token,
                Amount: entry.amount,
                Timestamp: formatDate(entry.timestamp),
                BinanceInflow: entry.isBinanceInflow ? "Yes" : "No",
                BinanceOutflow: entry.isBinanceOutflow ? "Yes" : "No",
            }))
        );
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        saveAs(blob, "flow_timeline.csv");
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        autoTable(doc, {
            head: [["Step", "Sender", "Receiver", "Token", "Amount", "Timestamp", "Inflow", "Outflow"]],
            body: filteredData.map((entry, idx) => [
                idx + 1,
                shorten(entry.from),
                shorten(entry.to),
                entry.token,
                entry.amount.toFixed(2),
                formatDate(entry.timestamp),
                entry.isBinanceInflow ? "Yes" : "-",
                entry.isBinanceOutflow ? "Yes" : "-",
            ]),
            headStyles: {
                fillColor: [59, 130, 246], // blue-500
                textColor: 255,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [249, 250, 251] // gray-50
            }
        });
        doc.save("flow_timeline.pdf");
    };

    return (
    <div className="space-y-6">
        {/* Controls Section */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                    <select
                        value={tokenFilter}
                        onChange={(e) => setTokenFilter(e.target.value)}
                        className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-black"
                    >
                        <option value="">All Tokens</option>
                        {uniqueTokens.map((token) => (
                            <option key={token} value={token}>
                                {token}
                            </option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>

                <Button
                    variant="outline"
                    onClick={() => setTokenFilter("")}
                    disabled={!tokenFilter}
                    className="disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Clear
                </Button>

                <Button
                    onClick={exportCSV}
                    size="sm"
                    className="gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    CSV
                </Button>

                <Button
                    onClick={exportPDF}
                    size="sm"
                    variant="danger"
                    className="gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    PDF
                </Button>
            </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-800">
                Transaction Flow
            </h3>
            <span className="text-sm bg-blue-100 text-blue-800 py-1 px-3 rounded-full font-medium">
                {filteredData.length} {filteredData.length === 1 ? 'transaction' : 'transactions'}
            </span>
        </div>

        {/* Table */}
        <div className="overflow-hidden border border-gray-200 rounded-xl shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Step
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sender
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Receiver
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Token
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Timestamp
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Binance
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.length > 0 ? (
                        filteredData.map((flow, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {idx + 1}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                    {shorten(flow.from)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                    {shorten(flow.to)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {flow.token || "-"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {flow.amount?.toFixed(2) ?? "-"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(flow.timestamp)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {flow.isBinanceInflow ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
                                                <circle cx="4" cy="4" r="3" />
                                            </svg>
                                            Inflow
                                        </span>
                                    ) : flow.isBinanceOutflow ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-red-400" fill="currentColor" viewBox="0 0 8 8">
                                                <circle cx="4" cy="4" r="3" />
                                            </svg>
                                            Outflow
                                        </span>
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={7} className="px-6 py-12 text-center">
                                <div className="flex flex-col items-center justify-center text-gray-400">
                                    <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-lg font-medium">No transactions found</p>
                                    <p className="text-sm">Try adjusting your filters</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);
};
