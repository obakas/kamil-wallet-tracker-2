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

    // 🔍 Extract unique tokens from the data
    const uniqueTokens = useMemo(() => {
        const tokens = Array.from(
            new Set(data.map((entry) => entry.token).filter(Boolean))
        );
        return tokens.sort((a, b) => a.localeCompare(b));
    }, [data]);

    // 🔬 Filter data by selected token
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
        });
        doc.save("flow_timeline.pdf");
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 text-black">
                <select
                    value={tokenFilter}
                    onChange={(e) => setTokenFilter(e.target.value)}
                    className="border px-3 py-2 rounded-md max-w-xs"
                >
                    <option value="">All Tokens</option>
                    {uniqueTokens.map((token) => (
                        <option key={token} value={token}>
                            {token}
                        </option>
                    ))}
                </select>
                <Button onClick={() => setTokenFilter("")}>Clear</Button>
                <div className="flex gap-2">
                    <button
                        onClick={exportCSV}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                        Export CSV
                    </button>
                    <button
                        onClick={exportPDF}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                        Export PDF
                    </button>
                </div>
            </div>

            <div className="overflow-auto border rounded-lg text-black">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 text-left">
                        <tr>
                            <th className="px-4 py-2">Step</th>
                            <th className="px-4 py-2">Sender</th>
                            <th className="px-4 py-2">Receiver</th>
                            <th className="px-4 py-2">Token</th>
                            <th className="px-4 py-2">Amount</th>
                            <th className="px-4 py-2">Timestamp</th>
                            <th className="px-4 py-2">Binance?</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.length > 0 ? (
                            filteredData.map((flow, idx) => (
                                <tr key={idx} className="border-t hover:bg-gray-50">
                                    <td className="px-4 py-2">{idx + 1}</td>
                                    <td className="px-4 py-2">{shorten(flow.from)}</td>
                                    <td className="px-4 py-2">{shorten(flow.to)}</td>
                                    <td className="px-4 py-2">{flow.token || "-"}</td>
                                    <td className="px-4 py-2">{flow.amount?.toFixed(2) ?? "-"}</td>
                                    <td className="px-4 py-2">{formatDate(flow.timestamp)}</td>
                                    <td className="px-4 py-2">
                                        {flow.isBinanceInflow && (
                                            <span className="text-green-600 font-semibold">
                                                Inflow ↘️
                                            </span>
                                        )}
                                        {flow.isBinanceOutflow && (
                                            <span className="text-red-600 font-semibold">
                                                Outflow ↗️
                                            </span>
                                        )}
                                        {!flow.isBinanceInflow &&
                                            !flow.isBinanceOutflow && (
                                                <span className="text-gray-400">-</span>
                                            )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="text-center py-6 text-gray-500">
                                    No matching transactions.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
