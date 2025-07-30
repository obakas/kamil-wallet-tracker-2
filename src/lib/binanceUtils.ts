// lib/binanceUtils.ts

const BINANCE_WALLETS = new Set([
    '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be',
    '0xd551234ae421e3bcba99a0da6d736074f22192ff',
    '0x564286362092d8e7936f0549571a803b203aaced',
    '0x0681d8db095565fe8a346fa0277bffde9c0edbbf',
    '0xfe9e8709d3215310075d67e3ed32a380ccf451c8',
    // Add more as you find them
]);

export function isBinanceAddress(address: string): boolean {
    return BINANCE_WALLETS.has(address);
}
