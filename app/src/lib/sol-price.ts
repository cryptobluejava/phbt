/**
 * Fetch the current SOL/USD price from CoinGecko
 * Caches the result for 60 seconds to avoid rate limiting
 */

let cachedPrice: { price: number; timestamp: number } | null = null;
const CACHE_DURATION_MS = 60 * 1000; // 1 minute cache

export async function getSolPrice(): Promise<number> {
    // Return cached price if still valid
    if (cachedPrice && Date.now() - cachedPrice.timestamp < CACHE_DURATION_MS) {
        return cachedPrice.price;
    }

    try {
        const response = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
            { next: { revalidate: 60 } } // Next.js cache for 60 seconds
        );

        if (!response.ok) {
            throw new Error(`CoinGecko API error: ${response.status}`);
        }

        const data = await response.json();
        const price = data.solana?.usd || 0;

        // Update cache
        cachedPrice = { price, timestamp: Date.now() };

        return price;
    } catch (error) {
        console.error("Failed to fetch SOL price:", error);
        // Return last cached price if available, otherwise default to 0
        return cachedPrice?.price || 0;
    }
}

/**
 * Format USD value with appropriate suffixes
 */
export function formatUSD(value: number): string {
    if (value >= 1_000_000_000) {
        return `$${(value / 1_000_000_000).toFixed(2)}B`;
    }
    if (value >= 1_000_000) {
        return `$${(value / 1_000_000).toFixed(2)}M`;
    }
    if (value >= 1_000) {
        return `$${(value / 1_000).toFixed(2)}K`;
    }
    if (value >= 1) {
        return `$${value.toFixed(2)}`;
    }
    return `$${value.toFixed(4)}`;
}
