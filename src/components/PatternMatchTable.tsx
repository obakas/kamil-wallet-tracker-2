"use client";

import React, { useMemo, useState, useEffect } from "react";
import { saveAs } from "file-saver";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/Button";


export type PatternMatchResult = {
    wallet: string;
    pattern: string;
    tokens: string[];
    flags: string[];
    score: number;
};


type Props = {
    results: PatternMatchResult[];
    onAddressClick?: (address: string) => void;
};

export const PatternMatchTable: React.FC<Props> = ({ results, onAddressClick }: Props) => {
    const [minScore, setMinScore] = useState<number>(0);

    const [tokenFilter, setTokenFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;


    // 1. Combine filters into ONE memo
    const filteredData = useMemo(() => {
        return results.filter(r =>
            r.score >= minScore &&
            (tokenFilter.trim() === "" || r.tokens.some(token => token.includes(tokenFilter)))
        );
    }, [results, minScore, tokenFilter]);

    // 2. Paginate after filtering
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return filteredData.slice(start, end);
    }, [filteredData, currentPage]);

    // 3. Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [tokenFilter, minScore]);


    // const filteredEntries = results.filter(([wallet, { count }]) => {
    //     return (
    //         count >= minConnections &&
    //         wallet.toLowerCase().includes(searchWallet.toLowerCase())
    //     );
    // });

    const filteredResults = useMemo(
        () => results.filter(r => r.score >= minScore),
        [results, minScore]
    );


    if (!results.length) return null;



    const exportCSV = () => {
        const csv = Papa.unparse(
            filteredResults.map(({ wallet, tokens, flags, score }, idx) => ({
                SN: idx + 1,
                wallet,
                tokenCount: tokens.length,
                flags: flags.join("; "),
                score,
            }))
        );
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        saveAs(blob, "pattern_matches.csv");
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        autoTable(doc, {
            head: [["SN", "Wallet", "Tokens", "Flags", "Score"]],
            body: filteredResults.map((r, idx) => [
                (idx + 1).toString(),
                r.wallet,
                r.tokens.length.toString(),
                r.flags.join(", "),
                r.score.toString()
            ]),
        });
        doc.save("pattern_matches.pdf");
    };

    if (!filteredResults?.length) return <p className="text-gray-500">No patterns detected.</p>;

    console.log("Results in PatternMatchTable:", results);



    return (
        <div className="overflow-x-auto">
            <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700 shadow-lg mb-6 flex flex-col gap-4">
                {/* Export Buttons */}
                <div className="flex items-center gap-2 ml-2 mt-6 justify-end">
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
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-800">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                S/N
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Wallet
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Pattern
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Tokens
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Score
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-gray-900 divide-y divide-gray-700">
                        {paginatedData.map((r, i) => (
                            <tr
                                key={i}
                                className={r.score > 15 ? 'bg-red-900/20' : 'hover:bg-gray-800/50'}
                            >
                                {/* Serial Number */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="text-sm text-gray-300">{i + 1}</div>
                                </td>
                                {/* Wallet */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="text-sm font-mono text-blue-400">
                                            {r.wallet.slice(0, 6)}...{r.wallet.slice(-4)}
                                        </div>
                                    </div>
                                </td>
                                {/* Pattern */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex flex-wrap gap-1">
                                        {r.flags.map(flag => (
                                            <span
                                                key={flag}
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${flag.includes('pump')
                                                    ? 'bg-red-900 text-red-100'
                                                    : flag.includes('dump')
                                                        ? 'bg-purple-900 text-purple-100'
                                                        : 'bg-yellow-900 text-yellow-100'
                                                    }`}
                                            >
                                                {flag.replace(/_/g, ' ')}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                {/* Tokens */}
                                <td className="px-4 py-3">
                                    <div className="text-sm text-gray-300">
                                        {r.tokens.length} token{r.tokens.length !== 1 ? 's' : ''}
                                    </div>
                                </td>
                                {/* Score */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${r.score > 15
                                        ? 'bg-red-100 text-red-800'
                                        : r.score > 8
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-green-100 text-green-800'
                                        }`}>
                                        {r.score}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls (if applicable) */}
            {filteredResults.length > 10 && (
                <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg">
                    <div className="text-sm text-gray-400">
                        Showing{" "}
                        <span className="font-medium text-gray-300">
                            {(currentPage - 1) * itemsPerPage + 1}-
                            {Math.min(currentPage * itemsPerPage, filteredResults.length)}
                        </span>{" "}
                        of <span className="font-medium text-gray-300">{filteredResults.length}</span>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(1)}
                            className="text-gray-300 border-gray-600 hover:bg-gray-700/50 text-white"
                        >
                            First
                        </Button>
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
                            disabled={currentPage * itemsPerPage >= filteredResults.length}
                            onClick={() => setCurrentPage((prev) => prev + 1)}
                            className="text-gray-300 border-gray-600 hover:bg-gray-700/50 text-white"
                        >
                            Next
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage >= Math.ceil(filteredResults.length / itemsPerPage)}
                            onClick={() => setCurrentPage(Math.ceil(filteredResults.length / itemsPerPage))}
                            className="text-gray-300 border-gray-600 hover:bg-gray-700/50 text-white"
                        >
                            Last
                        </Button>

                    </div>
                </div>
            )}
        </div>
    );
};

