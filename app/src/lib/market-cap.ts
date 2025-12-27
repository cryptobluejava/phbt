/**
 * Unified Market Cap Calculation
 * Uses the same formula everywhere: price = solReserve / tokenReserve
 * Market Cap = price * totalSupply * solPriceUSD
 */

import { getSolPrice } from "./sol-price"

// Default total supply for PHBT tokens (1 billion)
export const DEFAULT_TOTAL_SUPPLY = 1_000_000_000

// Token decimals
export const TOKEN_DECIMALS = 6

// Cache for SOL price to avoid excessive API calls
let cachedSolPrice = { price: 0, timestamp: 0 }
const CACHE_MS = 60000 // 1 minute

export async function getCachedSolPrice(): Promise<number> {
    if (Date.now() - cachedSolPrice.timestamp < CACHE_MS && cachedSolPrice.price > 0) {
        return cachedSolPrice.price
    }
    const price = await getSolPrice()
    if (price > 0) {
        cachedSolPrice = { price, timestamp: Date.now() }
    }
    return price || 180 // Fallback
}

/**
 * Calculate market cap from pool reserves
 * @param solReserveLamports - SOL reserve in lamports
 * @param tokenReserveAtomic - Token reserve in atomic units (with decimals)
 * @param solPriceUsd - Current SOL price in USD
 * @param totalSupply - Total token supply (default 1B)
 * @returns Market cap in USD
 */
export function calculateMarketCapUsd(
    solReserveLamports: number,
    tokenReserveAtomic: number,
    solPriceUsd: number,
    totalSupply: number = DEFAULT_TOTAL_SUPPLY
): number {
    const LAMPORTS_PER_SOL = 1_000_000_000
    
    // Convert to human-readable units
    const solReserve = solReserveLamports / LAMPORTS_PER_SOL
    const tokenReserve = tokenReserveAtomic / Math.pow(10, TOKEN_DECIMALS)
    
    // Price per token in SOL
    if (tokenReserve <= 0) return 0
    const pricePerTokenSol = solReserve / tokenReserve
    
    // Market cap = price * supply * sol price
    return pricePerTokenSol * totalSupply * solPriceUsd
}

/**
 * Format USD market cap for display
 */
export function formatMarketCap(marketCapUsd: number): string {
    if (marketCapUsd >= 1_000_000_000) {
        return `$${(marketCapUsd / 1_000_000_000).toFixed(2)}B`
    }
    if (marketCapUsd >= 1_000_000) {
        return `$${(marketCapUsd / 1_000_000).toFixed(2)}M`
    }
    if (marketCapUsd >= 1_000) {
        return `$${(marketCapUsd / 1_000).toFixed(1)}K`
    }
    if (marketCapUsd >= 1) {
        return `$${marketCapUsd.toFixed(0)}`
    }
    return `$${marketCapUsd.toFixed(2)}`
}

/**
 * Format market cap with SOL equivalent
 */
export function formatMarketCapWithSol(marketCapUsd: number, solPriceUsd: number): { usd: string; sol: string } {
    const solValue = solPriceUsd > 0 ? marketCapUsd / solPriceUsd : 0
    return {
        usd: formatMarketCap(marketCapUsd),
        sol: solValue >= 1000 
            ? `${(solValue / 1000).toFixed(1)}K SOL`
            : solValue >= 1 
                ? `${solValue.toFixed(1)} SOL`
                : `${solValue.toFixed(3)} SOL`
    }
}

