"use client";
import { useState, useMemo, useEffect } from "react";
import { shorten, formatDate, wrapAddress } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { saveAs } from "file-saver";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
// import { TraceFlowItem } from "@/types/traceFlowItem";
import { ClipboardCopyIcon } from "lucide-react";

type FlowTimelineTableProps = {
  data: any[]; // Replace with your actual data type
  onAddressClick?: (address: string) => void;
};


export const FlowTimelineTable = ({ data, onAddressClick }: FlowTimelineTableProps) => {
    const [tokenFilter, setTokenFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // 1. Filter data first
    const filteredData = useMemo(() => {
        if (!tokenFilter.trim()) return data;
        return data.filter(
            (flow) =>
                flow.token?.toLowerCase() === tokenFilter.toLowerCase()
        );
    }, [tokenFilter, data]);

    // 2. Then paginate it
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return filteredData.slice(start, end);
    }, [filteredData, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [tokenFilter]);



    // Extract unique tokens from the data
    const uniqueTokens = useMemo(() => {
        const tokens = Array.from(
            new Set(data.map((entry) => entry.token).filter(Boolean))
        );
        return tokens.sort((a, b) => a.localeCompare(b));
    }, [data]);

    // Filter data by selected token
    // const filteredData = useMemo(() => {
    //     if (!tokenFilter.trim()) return data;
    //     return data.filter(
    //         (flow) =>
    //             flow.token?.toLowerCase() === tokenFilter.toLowerCase()
    //     );
    // }, [tokenFilter, data]);

    const exportCSV = () => {
        const csv = Papa.unparse(
            data.map((entry, idx) => ({
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
            body: data.map((entry, idx) => [
                idx + 1,
                // entry.from,
                wrapAddress(entry.from),
                // entry.to,
                wrapAddress(entry.to),
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
            <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Token Filter */}
                        <div className="relative min-w-[180px]">
                            <label htmlFor="tokenFilter" className="block text-xs font-medium text-gray-400 mb-1">
                                Filter by Token
                            </label>
                            <div className="relative">
                                <select
                                    id="tokenFilter"
                                    value={tokenFilter}
                                    onChange={(e) => setTokenFilter(e.target.value)}
                                    className="w-full pl-3 pr-8 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-700/80 text-gray-100 appearance-none"
                                >
                                    <option value="">All Tokens</option>
                                    {uniqueTokens.map((token) => (
                                        <option key={token} value={token}>
                                            {token}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none top-6">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Clear Filter Button */}
                        <Button
                            variant="ghost"
                            onClick={() => setTokenFilter("")}
                            disabled={!tokenFilter}
                            className="mt-6 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300 hover:bg-gray-700/50 hover:text-white border border-gray-600"
                        >
                            Clear Filter
                        </Button>

                        {/* Export Buttons */}
                        <div className="flex items-center gap-2 ml-2 mt-6">
                            <Button
                                onClick={exportCSV}
                                size="sm"
                                className="gap-2 bg-green-800/80 hover:bg-green-700/80 border border-green-700/50 text-green-100"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Export CSV
                            </Button>

                            <Button
                                onClick={exportPDF}
                                size="sm"
                                className="gap-2 bg-red-800/80 hover:bg-red-700/80 border border-red-700/50 text-red-100"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Export PDF
                            </Button>
                        </div>
                    </div>

                    {/* Results Count */}
                    <div className="mt-6">
                        <span className="text-sm bg-blue-900/50 text-blue-100 py-1.5 px-4 rounded-full font-medium border border-blue-800">
                            {filteredData.length} {filteredData.length === 1 ? 'transaction' : 'transactions'} found
                        </span>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="overflow-x-auto">
                <div className="overflow-hidden border border-gray-700 rounded-xl shadow-lg">
                    <table className="min-w-full divide-y divide-gray-700/50">
                        <thead className="bg-gray-800">
                            <tr>
                                {['Step', 'Sender', 'Receiver', 'Token', 'Amount', 'Timestamp', 'Binance?'].map((header) => (
                                    <th
                                        key={header}
                                        scope="col"
                                        className="px-2 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                                    >
                                        <div className="flex items-center gap-0 text-wrap">
                                            {header}
                                            {header === 'Amount' && (
                                                <span className="text-xs text-gray-500 font-normal">(USD)</span>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800/50 divide-y divide-gray-700/30">
                            {filteredData.length > 0 ? (
                                paginatedData.map((flow, idx) => (
                                    <tr
                                        key={idx}
                                        className="hover:bg-gray-750/50 transition-colors group"
                                        onClick={() => {/* Add click handler if needed */ }}
                                    >
                                        {/* Step */}
                                        <td className="px-2 py-4 whitespace-nowrap text-sm font-medium text-gray-100">
                                            <div className="flex items-center gap-3">
                                                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-700/80 text-gray-300 group-hover:bg-gray-700">
                                                    {/* {idx + 1} */}
                                                    {(currentPage - 1) * itemsPerPage + idx + 1}

                                                </span>
                                            </div>
                                        </td>

                                        {/* Sender */}
                                        <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                                            <div className="flex items-center gap-2">
                                                <span className="hover:text-blue-300 transition-colors cursor-pointer">
                                                    {shorten(flow.from)}
                                                </span>
                                                {flow.isFirstFunder && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-900/50 text-yellow-200 border border-yellow-800/50">
                                                        First
                                                    </span>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigator.clipboard.writeText(flow.from);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-200 transition-opacity"
                                                    title="Copy address"
                                                >
                                                    <ClipboardCopyIcon className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>

                                        {/* Receiver */}
                                        <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                                            <div className="flex items-center gap-2">
                                                <span className="hover:text-blue-300 transition-colors cursor-pointer">
                                                    {shorten(flow.to)}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigator.clipboard.writeText(flow.to);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-200 transition-opacity"
                                                    title="Copy address"
                                                >
                                                    <ClipboardCopyIcon className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>

                                        {/* Token */}
                                        <td className="px-2 py-4 whitespace-nowrap">
                                            {flow.token ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-200">
                                                    {flow.token}
                                                </span>
                                            ) : (
                                                <span className="text-gray-500">-</span>
                                            )}
                                        </td>

                                        {/* Amount */}
                                        <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {flow.amount ? (
                                                <span className="font-medium">
                                                    ${flow.amount.toFixed(2)}
                                                </span>
                                            ) : (
                                                <span className="text-gray-500">-</span>
                                            )}
                                        </td>

                                        {/* Timestamp */}
                                        <td className="px-0 py-4 whitespace-nowrap text-sm text-gray-400">
                                            {formatDate(flow.timestamp)}
                                        </td>

                                        {/* Exchange */}
                                        <td className="px-2 py-4 whitespace-nowrap">
                                            {flow.isBinanceInflow ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/50 text-green-100 border border-green-800/50">
                                                    <svg className="mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
                                                        <circle cx="4" cy="4" r="3" />
                                                    </svg>
                                                    Binance In
                                                </span>
                                            ) : flow.isBinanceOutflow ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/50 text-red-100 border border-red-800/50">
                                                    <svg className="mr-1.5 h-2 w-2 text-red-400" fill="currentColor" viewBox="0 0 8 8">
                                                        <circle cx="4" cy="4" r="3" />
                                                    </svg>
                                                    Binance Out
                                                </span>
                                            ) : (
                                                <span className="text-gray-500">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-500">
                                            <svg className="w-14 h-14 mb-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <p className="text-lg font-medium text-gray-400 mb-1">No transactions found</p>
                                            <p className="text-sm max-w-md mx-auto">
                                                {tokenFilter ?
                                                    `No transactions found for ${tokenFilter}. Try clearing filters.` :
                                                    "No transaction data available for the selected criteria."}
                                            </p>
                                            {tokenFilter && (
                                                <Button
                                                    onClick={() => setTokenFilter("")}
                                                    size="sm"
                                                    variant="ghost"
                                                    className="mt-3 text-blue-400 hover:text-blue-300"
                                                >
                                                    Clear Filters
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>


            {/* Pagination Controls (if applicable) */}
            {filteredData.length > 10 && (
                <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg">
                    <div className="text-sm text-gray-400">
                        Showing{" "}
                        <span className="font-medium text-gray-300">
                            {(currentPage - 1) * itemsPerPage + 1}-
                            {Math.min(currentPage * itemsPerPage, filteredData.length)}
                        </span>{" "}
                        of <span className="font-medium text-gray-300">{filteredData.length}</span>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            className="text-gray-300 border-gray-600 hover:bg-gray-700/50 text-white"
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage * itemsPerPage >= filteredData.length}
                            onClick={() => setCurrentPage((prev) => prev + 1)}
                            className="text-gray-300 border-gray-600 hover:bg-gray-700/50 text-white"
                        >
                            Next
                        </Button>

                    </div>
                </div>
            )}
        </div>
    );
};
