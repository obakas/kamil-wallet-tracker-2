// components/AddWalletForm.tsx
"use client";

import { useState } from 'react';

export default function AddWalletForm() {
    const [walletAddress, setWalletAddress] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');

    const handleSaveWallet = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setResult(null);

        try {
            const response = await fetch('/api/add-binance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ walletAddress }),
            });

            const data = await response.json();

            console.log("Response data:", data);

            if (!response.ok) {
                throw new Error(data.error || 'Failed to add wallet');
            }

            setResult(data);
            setWalletAddress('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold">Add Binance Wallet</h2>
            <form onSubmit={handleSaveWallet} className="space-y-3">
                <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="Enter Binance wallet address"
                    className="w-full p-2 border rounded"
                    required
                />
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                    {isLoading ? 'Adding...' : 'Add Wallet'}
                </button>
            </form>

            {error && <div className="text-red-500">{error}</div>}

            {result && (
                <div className="mt-4 p-4 bg-gray-100 rounded">
                    <h3 className="font-semibold text-black">Success!</h3>
                    <p>Added wallet: {result.walletAddress}</p>
                    {/* Display trace results if needed */}
                </div>
            )}
        </div>
    );
}