// src/lib/tokenResolver.ts


let tokenMap: Record<string, string> | null = null;

export async function resolveTokenSymbol(mint: string): Promise<string> {
    if (!mint) return "UNKNOWN";

    const normalizedMint = mint.trim();

    if (!tokenMap) {
        try {
            console.log("🔄 Fetching token list...");
            const res = await fetch("https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/src/tokens/solana.tokenlist.json") || await fetch("./src/data/solana.tokenlist.json") || await fetch('https://api.solana.fm/v0/tokens');
            // const res  = await fetch('https://api.solana.fm/v0/tokens');
            const data = await res.json();
            tokenMap = {};

            for (const token of data.tokens) {
                tokenMap[token.address] = token.symbol;
            }

            console.log("✅ Token list loaded:", Object.keys(tokenMap).length, "tokens");

        } catch (err) {
            console.error("❌ Token list fetch failed:", err);
            tokenMap = {}; // fail-safe fallback
        }
    }

    const found = tokenMap[normalizedMint];
    if (!found) {
        console.warn("⚠️ Unmatched token mint:", normalizedMint);
        // return normalizedMint.slice(0, 5) + "...";
        return normalizedMint;
    }

    return found;
}
