"use client";

import React, { useMemo, useState } from "react";
import { saveAs } from "file-saver";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// export type PatternMatchResult = {
//     wallet: string;
//     tokens: string[];
//     flags: string[];
//     score: number;
// };

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

    const filteredResults = useMemo(
        () => results.filter(r => r.score >= minScore),
        [results, minScore]
    );

    const exportCSV = () => {
        const csv = Papa.unparse(
            filteredResults.map(({ wallet, tokens, flags, score }) => ({
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
            head: [["Wallet", "Tokens", "Flags", "Score"]],
            body: filteredResults.map(r => [
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
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-800">
                        <tr>
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
                        {filteredResults.map((r, i) => (
                            <tr
                                key={i}
                                className={r.score > 15 ? 'bg-red-900/20' : 'hover:bg-gray-800/50'}
                            >
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="text-sm font-mono text-blue-400">
                                            {r.wallet.slice(0, 6)}...{r.wallet.slice(-4)}
                                        </div>
                                    </div>
                                </td>
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
                                <td className="px-4 py-3">
                                    <div className="text-sm text-gray-300">
                                        {r.tokens.length} token{r.tokens.length !== 1 ? 's' : ''}
                                    </div>
                                </td>
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
        );
    };
    // return (
    //     <div className="overflow-x-auto p-4">
    //         <div className="mb-2 flex items-center gap-4">
    //             <label className="text-sm">Min Score Filter:</label>
    //             <input
    //                 type="number"
    //                 value={minScore}
    //                 onChange={e => setMinScore(Number(e.target.value))}
    //                 className="border px-2 py-1 rounded text-sm w-20"
    //             />
    //             <button
    //                 onClick={exportCSV}
    //                 className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
    //             >
    //                 Export CSV
    //             </button>
    //             <button
    //                 onClick={exportPDF}
    //                 className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
    //             >
    //                 Export PDF
    //             </button>
    //         </div>

    //         <table className="min-w-full bg-white border border-gray-300 rounded-xl">
    //             <thead className="bg-gray-100">
    //                 <tr>
    //                     <th className="px-4 py-2 text-left">Wallet</th>
    //                     <th className="px-4 py-2">Tokens</th>
    //                     <th className="px-4 py-2">Flags</th>
    //                     <th className="px-4 py-2">Score</th>
    //                 </tr>
    //             </thead>
    //             <tbody>
    //                 {filteredResults.map((r, i) => (
    //                     <tr
    //                         key={i}
    //                         className={`border-t ${r.score > 15 ? "bg-red-100 text-red-700" : ""}`}
    //                     >
    //                         <td className="px-4 py-2 font-mono text-xs">{r.wallet}</td>
    //                         <td className="px-4 py-2">{r.tokens.length}</td>
    //                         <td className="px-4 py-2">
    //                             {r.flags.map(flag => (
    //                                 <span
    //                                     key={flag}
    //                                     className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 mr-1 rounded"
    //                                 >
    //                                     {flag}
    //                                 </span>
    //                             ))}
    //                         </td>
    //                         <td className="px-4 py-2 font-bold">{r.score}</td>
    //                     </tr>
    //                 ))}
    //             </tbody>
    //         </table>
    //     </div>
    // );
// };
