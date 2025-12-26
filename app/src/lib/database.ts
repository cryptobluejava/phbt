/**
 * Database API Integration
 * Handles watchlist, achievements, and profile data
 * 
 * Set NEXT_PUBLIC_DATABASE_API_URL in your environment variables
 */

import { DATABASE_API_URL, DATABASE_API_KEY } from "./constants"

// Types
export interface UserProfile {
    wallet: string
    watchlist: string[]
    achievements: Achievement[]
    stats: UserStats
    createdAt: string
    updatedAt: string
}

export interface Achievement {
    id: string
    name: string
    description: string
    emoji: string
    unlockedAt: string | null
    progress?: number
    target?: number
}

export interface UserStats {
    totalTrades: number
    totalBuys: number
    totalSells: number
    totalVolumeSol: number
    tokensCreated: number
    profitableTrades: number
    paperHandTaxPaid: number
    diamondHandHolds: number
    firstTradeAt: string | null
}

// Achievement definitions
export const ACHIEVEMENTS: Omit<Achievement, 'unlockedAt' | 'progress'>[] = [
    // Trading achievements
    { id: 'first_buy', name: 'First Blood', description: 'Make your first buy', emoji: '🩸', target: 1 },
    { id: 'first_sell', name: 'Paper or Diamond?', description: 'Make your first sell', emoji: '📄', target: 1 },
    { id: 'trades_10', name: 'Getting Started', description: 'Complete 10 trades', emoji: '🚀', target: 10 },
    { id: 'trades_50', name: 'Active Trader', description: 'Complete 50 trades', emoji: '📈', target: 50 },
    { id: 'trades_100', name: 'Trading Machine', description: 'Complete 100 trades', emoji: '🤖', target: 100 },
    { id: 'trades_500', name: 'Degen Legend', description: 'Complete 500 trades', emoji: '👑', target: 500 },
    
    // Volume achievements
    { id: 'volume_1', name: 'Small Fish', description: 'Trade 1 SOL total volume', emoji: '🐟', target: 1 },
    { id: 'volume_10', name: 'Medium Fish', description: 'Trade 10 SOL total volume', emoji: '🐠', target: 10 },
    { id: 'volume_100', name: 'Big Fish', description: 'Trade 100 SOL total volume', emoji: '🐋', target: 100 },
    { id: 'volume_1000', name: 'Whale', description: 'Trade 1000 SOL total volume', emoji: '🐳', target: 1000 },
    
    // Creator achievements
    { id: 'first_token', name: 'Creator', description: 'Launch your first token', emoji: '✨', target: 1 },
    { id: 'tokens_5', name: 'Serial Creator', description: 'Launch 5 tokens', emoji: '🏭', target: 5 },
    { id: 'tokens_10', name: 'Token Factory', description: 'Launch 10 tokens', emoji: '🏰', target: 10 },
    
    // Diamond hands achievements
    { id: 'diamond_1', name: 'Diamond Hands', description: 'Hold through a 50% dip', emoji: '💎', target: 1 },
    { id: 'diamond_5', name: 'Unshakeable', description: 'Hold through 5 major dips', emoji: '🗿', target: 5 },
    { id: 'profit_streak_3', name: 'Hot Streak', description: '3 profitable trades in a row', emoji: '🔥', target: 3 },
    { id: 'profit_streak_10', name: 'On Fire', description: '10 profitable trades in a row', emoji: '🌋', target: 10 },
    
    // Paper hand achievements (shame badges)
    { id: 'paper_1', name: 'Paper Hands', description: 'Sell at a loss once', emoji: '🧻', target: 1 },
    { id: 'paper_5', name: 'Tissue Paper', description: 'Sell at a loss 5 times', emoji: '😢', target: 5 },
    { id: 'paper_tax_1', name: 'Tax Contributor', description: 'Pay 1 SOL in paper hand tax', emoji: '💸', target: 1 },
    { id: 'paper_tax_10', name: 'Treasury Filler', description: 'Pay 10 SOL in paper hand tax', emoji: '🏦', target: 10 },
    
    // Social/engagement achievements
    { id: 'watchlist_5', name: 'Watcher', description: 'Add 5 tokens to watchlist', emoji: '👀', target: 5 },
    { id: 'watchlist_20', name: 'Market Observer', description: 'Add 20 tokens to watchlist', emoji: '🔭', target: 20 },
    
    // Special achievements
    { id: 'early_adopter', name: 'Early Adopter', description: 'Joined in the first week', emoji: '🌅' },
    { id: 'og_trader', name: 'OG Trader', description: 'One of the first 100 traders', emoji: '🏆' },
]

// Check if database API is configured
export function isDatabaseConfigured(): boolean {
    return !!DATABASE_API_URL && DATABASE_API_URL.length > 0
}

// Fetch user profile from database
export async function fetchUserProfile(wallet: string): Promise<UserProfile | null> {
    if (!isDatabaseConfigured()) return null
    
    try {
        const response = await fetch(`${DATABASE_API_URL}/api/profile/${wallet}`, {
            headers: {
                'Content-Type': 'application/json',
                ...(DATABASE_API_KEY ? { 'Authorization': `Bearer ${DATABASE_API_KEY}` } : {})
            }
        })
        
        if (!response.ok) {
            if (response.status === 404) return null
            throw new Error(`API error: ${response.status}`)
        }
        
        return await response.json()
    } catch (error) {
        console.error('Failed to fetch user profile:', error)
        return null
    }
}

// Create or update user profile
export async function updateUserProfile(wallet: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    if (!isDatabaseConfigured()) return null
    
    try {
        const response = await fetch(`${DATABASE_API_URL}/api/profile/${wallet}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(DATABASE_API_KEY ? { 'Authorization': `Bearer ${DATABASE_API_KEY}` } : {})
            },
            body: JSON.stringify(updates)
        })
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`)
        }
        
        return await response.json()
    } catch (error) {
        console.error('Failed to update user profile:', error)
        return null
    }
}

// Sync watchlist to database
export async function syncWatchlist(wallet: string, watchlist: string[]): Promise<boolean> {
    if (!isDatabaseConfigured()) return false
    
    try {
        const response = await fetch(`${DATABASE_API_URL}/api/watchlist/${wallet}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(DATABASE_API_KEY ? { 'Authorization': `Bearer ${DATABASE_API_KEY}` } : {})
            },
            body: JSON.stringify({ watchlist })
        })
        
        return response.ok
    } catch (error) {
        console.error('Failed to sync watchlist:', error)
        return false
    }
}

// Fetch watchlist from database
export async function fetchWatchlist(wallet: string): Promise<string[]> {
    if (!isDatabaseConfigured()) return []
    
    try {
        const response = await fetch(`${DATABASE_API_URL}/api/watchlist/${wallet}`, {
            headers: {
                'Content-Type': 'application/json',
                ...(DATABASE_API_KEY ? { 'Authorization': `Bearer ${DATABASE_API_KEY}` } : {})
            }
        })
        
        if (!response.ok) return []
        
        const data = await response.json()
        return data.watchlist || []
    } catch (error) {
        console.error('Failed to fetch watchlist:', error)
        return []
    }
}

// Record a trade for achievement tracking
export async function recordTrade(
    wallet: string, 
    tradeType: 'buy' | 'sell',
    tokenMint: string,
    solAmount: number,
    isProfitable: boolean,
    taxPaid: number = 0
): Promise<void> {
    if (!isDatabaseConfigured()) return
    
    try {
        await fetch(`${DATABASE_API_URL}/api/trades`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(DATABASE_API_KEY ? { 'Authorization': `Bearer ${DATABASE_API_KEY}` } : {})
            },
            body: JSON.stringify({
                wallet,
                tradeType,
                tokenMint,
                solAmount,
                isProfitable,
                taxPaid,
                timestamp: new Date().toISOString()
            })
        })
    } catch (error) {
        console.error('Failed to record trade:', error)
    }
}

// Record token creation
export async function recordTokenCreation(wallet: string, tokenMint: string): Promise<void> {
    if (!isDatabaseConfigured()) return
    
    try {
        await fetch(`${DATABASE_API_URL}/api/tokens`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(DATABASE_API_KEY ? { 'Authorization': `Bearer ${DATABASE_API_KEY}` } : {})
            },
            body: JSON.stringify({
                wallet,
                tokenMint,
                timestamp: new Date().toISOString()
            })
        })
    } catch (error) {
        console.error('Failed to record token creation:', error)
    }
}

// Local storage fallback for watchlist when no database is configured
export function getLocalWatchlist(): string[] {
    if (typeof window === 'undefined') return []
    const saved = localStorage.getItem('phbt_watchlist')
    if (saved) {
        try {
            return JSON.parse(saved)
        } catch {
            return []
        }
    }
    return []
}

export function setLocalWatchlist(watchlist: string[]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem('phbt_watchlist', JSON.stringify(watchlist))
}

// Local storage for achievements when no database is configured
export function getLocalAchievements(): Achievement[] {
    if (typeof window === 'undefined') return []
    const saved = localStorage.getItem('phbt_achievements')
    if (saved) {
        try {
            return JSON.parse(saved)
        } catch {
            return []
        }
    }
    return []
}

export function setLocalAchievements(achievements: Achievement[]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem('phbt_achievements', JSON.stringify(achievements))
}

