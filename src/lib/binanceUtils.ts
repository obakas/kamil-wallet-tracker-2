// import fs from 'fs';
// import path from 'path';
// // import fs from 'fs/promises';

// const WALLETS_FILE = path.join(process.cwd(), 'data', 'wallets.json');

// // Initialize data directory if it doesn't exist
// const dataDir = path.join(process.cwd(), 'data');
// if (!fs.existsSync(dataDir)) {
//     fs.mkdirSync(dataDir);
// }

// // Initialize wallets file if it doesn't exist
// if (!fs.existsSync(WALLETS_FILE)) {
//     fs.writeFileSync(WALLETS_FILE, JSON.stringify([], null, 2));
// }

// Hardcoded Binance wallets
export const HARDCODED_BINANCE_WALLETS = new Set([
    '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be',
    '0xd551234ae421e3bcba99a0da6d736074f22192ff',
    '0x564286362092d8e7936f0549571a803b203aaced',
    '0x0681d8db095565fe8a346fa0277bffde9c0edbbf',
    '0xfe9e8709d3215310075d67e3ed32a380ccf451c8',
    'GiN7MRETkJduFrmZkxMHEbqd9u2qHRtpWDsUiCmodC1p'
]);

// Get all wallets from file
// export function getBinanceWallets(): string[] {
//     try {
//         const data = fs.readFileSync(WALLETS_FILE, 'utf8');
//         return JSON.parse(data);
//     } catch (error) {
//         console.error('Error reading wallets file:', error);
//         return [];
//     }
// }

// // Get combined set of all Binance wallets (hardcoded + stored)
// export function getAllBinanceWallets(): Set<string> {
//     const storedWallets = getBinanceWallets();
//     const combined = new Set(HARDCODED_BINANCE_WALLETS);
//     storedWallets.forEach(wallet => combined.add(wallet));
//     return combined;
// }

// // Add a new wallet to persistent storage
// export function addBinanceWallet(wallet: string): void {
//     try {
//         const wallets = getBinanceWallets();
//         if (!wallets.includes(wallet)) {
//             wallets.push(wallet);
//             fs.writeFileSync(WALLETS_FILE, JSON.stringify(wallets, null, 2));
//         }
//     } catch (error) {
//         console.error('Error adding wallet:', error);
//         throw error;
//     }
// }

// // Export the combined set by default
// export const BINANCE_WALLETS = getAllBinanceWallets();