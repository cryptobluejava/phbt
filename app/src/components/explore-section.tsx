"use client"

import { useState, useEffect, useCallback } from "react"
import { useConnection } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import { Card, CardContent } from "@/components/ui/card"
import { RefreshCw, Rocket, ExternalLink, Search, SlidersHorizontal, Star, StarOff } from "lucide-react"
import { PROGRAM_ID, POOL_SEED_PREFIX, TOKEN_METADATA_PROGRAM_ID, REFRESH_INTERVALS, HIDDEN_TOKENS, HIDE_OLD_TOKENS, ALLOWED_TOKENS, TOKEN_CATEGORIES, TokenCategory } from "@/lib/constants"
import { formatLamportsToSol } from "@/lib/format"
import Link from "next/link"
import { BN } from "bn.js"



interface LaunchedCoin {
    mint: PublicKey
    pool: PublicKey
    name: string
    symbol: string
    image: string | null
    tokenReserve: number
    solReserve: number
    category: TokenCategory | null
}

// Helper to derive metadata PDA
function getMetadataPDA(mint: PublicKey): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("metadata"),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            mint.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
    )
    return pda
}

// Parse Metaplex metadata account
function parseMetadata(data: Buffer): { name: string; symbol: string; uri: string } | null {
    try {
        // Skip: key (1) + update_authority (32) + mint (32)
        let offset = 1 + 32 + 32

        // Read name
        const nameLength = data.readUInt32LE(offset)
        offset += 4
        const name = data.slice(offset, offset + 32).toString('utf8').replace(/\0/g, '').trim()
        offset += 32

        // Read symbol
        const symbolLength = data.readUInt32LE(offset)
        offset += 4
        const symbol = data.slice(offset, offset + 10).toString('utf8').replace(/\0/g, '').trim()
        offset += 10

        // Read URI
        const uriLength = data.readUInt32LE(offset)
        offset += 4
        const uri = data.slice(offset, offset + uriLength).toString('utf8').replace(/\0/g, '').trim()

        return { name, symbol, uri }
    } catch (e) {
        console.error("Failed to parse metadata:", e)
        return null
    }
}

type SortOption = 'liquidity' | 'newest' | 'name' | 'watchlist'

export function ExploreSection() {
    const { connection } = useConnection()
    const [coins, setCoins] = useState<LaunchedCoin[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [sortBy, setSortBy] = useState<SortOption>('liquidity')
    const [watchlist, setWatchlist] = useState<string[]>([])
    const [categoryFilter, setCategoryFilter] = useState<TokenCategory | 'all'>('all')
    
    // Load watchlist from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('phbt_watchlist')
        if (saved) {
            try {
                setWatchlist(JSON.parse(saved))
            } catch {}
        }
    }, [])
    
    // Toggle watchlist
    const toggleWatchlist = (mint: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setWatchlist(prev => {
            const newList = prev.includes(mint) 
                ? prev.filter(m => m !== mint)
                : [...prev, mint]
            localStorage.setItem('phbt_watchlist', JSON.stringify(newList))
            return newList
        })
    }
    
    // Filter and sort coins
    const filteredCoins = coins
        .filter(coin => {
            // Category filter
            if (categoryFilter !== 'all' && coin.category !== categoryFilter) {
                return false
            }
            // Search filter
            if (!searchQuery) return true
            const query = searchQuery.toLowerCase()
            return coin.name.toLowerCase().includes(query) || 
                   coin.symbol.toLowerCase().includes(query) ||
                   coin.mint.toBase58().toLowerCase().includes(query)
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'liquidity':
                    return b.solReserve - a.solReserve
                case 'newest':
                    return 0 // Keep original order (newest first from RPC)
                case 'name':
                    return a.name.localeCompare(b.name)
                case 'watchlist':
                    const aWatched = watchlist.includes(a.mint.toBase58()) ? 1 : 0
                    const bWatched = watchlist.includes(b.mint.toBase58()) ? 1 : 0
                    return bWatched - aWatched
                default:
                    return 0
            }
        })

    const fetchLaunchedCoins = useCallback(async () => {
        setIsLoading(true)
        try {
            // Support both old (97 bytes) and new (105 bytes) pool formats
            const OLD_POOL_SIZE = 97
            const NEW_POOL_SIZE = 105

            // Fetch pool accounts - do sequentially to avoid rate limits
            const oldAccounts = await connection.getProgramAccounts(PROGRAM_ID, {
                filters: [{ dataSize: OLD_POOL_SIZE }]
            })
            
            // Longer delay between calls to avoid 429
            await new Promise(r => setTimeout(r, 500))
            
            const newAccounts = await connection.getProgramAccounts(PROGRAM_ID, {
                filters: [{ dataSize: NEW_POOL_SIZE }]
            })

            const allAccounts = [
                ...oldAccounts.map(a => ({ ...a, isNewFormat: false })),
                ...newAccounts.map(a => ({ ...a, isNewFormat: true }))
            ]

            // First pass: parse pool data without metadata
            const poolsWithMints: Array<{
                pubkey: PublicKey
                tokenOne: PublicKey
                reserveOne: InstanceType<typeof BN>
                reserveTwo: InstanceType<typeof BN>
            }> = []

            for (const { pubkey, account } of allAccounts) {
                try {
                    const data = account.data.slice(8)
                    const tokenOne = new PublicKey(data.slice(0, 32))
                    const reserveOne = new BN(data.slice(72, 80), 'le')
                    const reserveTwo = new BN(data.slice(80, 88), 'le')

                    // Skip invalid pools
                    if (tokenOne.toBase58() === "11111111111111111111111111111111") {
                        continue
                    }

                    poolsWithMints.push({ pubkey, tokenOne, reserveOne, reserveTwo })
                } catch (e) {
                    console.error("Failed to parse pool:", pubkey.toBase58(), e)
                }
            }

            // Batch fetch all metadata accounts at once (much faster!)
            const metadataPDAs = poolsWithMints.map(p => getMetadataPDA(p.tokenOne))
            
            await new Promise(r => setTimeout(r, 500))
            
            const metadataAccounts = await connection.getMultipleAccountsInfo(metadataPDAs)

            // Build final list with metadata, filtering out hidden tokens
            const parsedCoins: LaunchedCoin[] = []
            
            for (let i = 0; i < poolsWithMints.length; i++) {
                const pool = poolsWithMints[i]
                const mintAddress = pool.tokenOne.toBase58()
                
                // Skip explicitly hidden tokens
                if (HIDDEN_TOKENS.includes(mintAddress)) {
                    continue
                }
                
                let name = `Token ${mintAddress.slice(0, 6)}...`
                let symbol = mintAddress.slice(0, 4).toUpperCase()
                let image: string | null = null
                let category: TokenCategory | null = null
                let hasNewMetadataFormat = false

                const metadataAccount = metadataAccounts[i]
                if (metadataAccount) {
                    const parsed = parseMetadata(metadataAccount.data)
                    if (parsed) {
                        name = parsed.name || name
                        symbol = parsed.symbol || symbol

                        // Check if URI is a data URI (new JSON metadata format)
                        if (parsed.uri?.startsWith('data:application/json;base64,')) {
                            hasNewMetadataFormat = true
                            try {
                                const base64Data = parsed.uri.replace('data:application/json;base64,', '')
                                const jsonStr = Buffer.from(base64Data, 'base64').toString('utf8')
                                const jsonMeta = JSON.parse(jsonStr)
                                if (jsonMeta.image) {
                                    image = jsonMeta.image
                                }
                                if (jsonMeta.c || jsonMeta.category) {
                                    category = (jsonMeta.c || jsonMeta.category) as TokenCategory
                                }
                            } catch (e) {
                                // Ignore parse errors
                            }
                        } else if (parsed.uri?.startsWith('data:,')) {
                            // New compact format - also counts as new metadata
                            hasNewMetadataFormat = true
                            try {
                                const jsonStr = decodeURIComponent(parsed.uri.replace('data:,', ''))
                                const jsonMeta = JSON.parse(jsonStr)
                                if (jsonMeta.c || jsonMeta.category) {
                                    category = (jsonMeta.c || jsonMeta.category) as TokenCategory
                                }
                            } catch (e) {
                                // Ignore parse errors
                            }
                        } else {
                            const isValidImageUrl = parsed.uri &&
                                parsed.uri.startsWith('http') &&
                                !parsed.uri.includes('placeholder-') &&
                                !parsed.uri.includes('arweave.net/placeholder')

                            if (isValidImageUrl) {
                                image = parsed.uri
                                // HTTP image URLs also count as new format
                                hasNewMetadataFormat = true
                                
                                // Try to extract category from query params
                                try {
                                    const url = new URL(parsed.uri)
                                    const catParam = url.searchParams.get('cat')
                                    if (catParam && TOKEN_CATEGORIES.some(c => c.id === catParam)) {
                                        category = catParam as TokenCategory
                                    }
                                } catch (e) {
                                    // Ignore URL parse errors
                                }
                            }
                        }
                    }
                }
                
                // If HIDE_OLD_TOKENS is enabled, skip tokens without new metadata format
                // UNLESS they're in the ALLOWED_TOKENS list
                const isAllowed = ALLOWED_TOKENS.includes(mintAddress)
                if (HIDE_OLD_TOKENS && !hasNewMetadataFormat && !isAllowed) {
                    continue
                }

                parsedCoins.push({
                    mint: pool.tokenOne,
                    pool: pool.pubkey,
                    name,
                    symbol,
                    image,
                    tokenReserve: pool.reserveOne.toNumber(),
                    solReserve: pool.reserveTwo.toNumber(),
                    category,
                })
            }

            setCoins(parsedCoins)
        } catch (error) {
            console.error("Failed to fetch launched coins:", error)
        } finally {
            setIsLoading(false)
        }
    }, [connection])

    useEffect(() => {
        // Delay initial fetch to avoid simultaneous RPC calls with other components
        const timer = setTimeout(() => {
            fetchLaunchedCoins()
        }, 1500) // Increased delay to spread out RPC calls
        return () => clearTimeout(timer)
        // Disabled auto-refresh to reduce RPC calls
    }, [fetchLaunchedCoins])

    return (
        <div className="mb-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8C3A32] to-[#6B2D28] flex items-center justify-center shadow-lg shadow-[#8C3A32]/20">
                            <Rocket className="w-6 h-6 text-white" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0E1518] flex items-center justify-center">
                            <span className="text-[8px] font-bold text-white">{filteredCoins.length}</span>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-[#E9E1D8] tracking-tight">
                            Explore Coins
                        </h2>
                        <p className="text-sm text-[#5F6A6E]">
                            Tokens with Paper Hand Tax protection
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchLaunchedCoins()}
                        disabled={isLoading}
                        className="p-2.5 rounded-xl bg-[#141D21]/50 border border-[#2A3338]/50 text-[#5F6A6E] hover:text-[#E9E1D8] hover:border-[#5F6A6E] transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <Link
                        href="/launch"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8C3A32] to-[#A04438] text-white text-sm font-semibold hover:shadow-lg hover:shadow-[#8C3A32]/25 transition-all hover:-translate-y-0.5"
                    >
                        <Rocket className="w-4 h-4" />
                        <span>Launch</span>
                    </Link>
                </div>
            </div>
            
            {/* Category Pills - Horizontal scroll */}
            <div className="relative mb-6">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-2 px-2">
                    <button
                        onClick={() => setCategoryFilter('all')}
                        className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                            categoryFilter === 'all'
                                ? 'bg-white text-[#0E1518] shadow-lg'
                                : 'bg-[#1A2428]/80 text-[#9FA6A3] hover:bg-[#1A2428] hover:text-white border border-transparent hover:border-[#2A3338]'
                        }`}
                    >
                        All Coins
                    </button>
                    {TOKEN_CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setCategoryFilter(cat.id)}
                            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                                categoryFilter === cat.id
                                    ? 'text-white shadow-lg'
                                    : 'bg-[#1A2428]/80 text-[#9FA6A3] hover:bg-[#1A2428] hover:text-white border border-transparent hover:border-[#2A3338]'
                            }`}
                            style={categoryFilter === cat.id ? { 
                                backgroundColor: cat.color,
                                boxShadow: `0 4px 20px ${cat.color}40`
                            } : {}}
                        >
                            <span className="text-base">{cat.emoji}</span>
                            <span>{cat.label}</span>
                        </button>
                    ))}
                </div>
                {/* Fade edges */}
                <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-[#0E1518] to-transparent pointer-events-none" />
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                {/* Search Input */}
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5F6A6E] group-focus-within:text-[#8C3A32] transition-colors" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search tokens..."
                        className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#141D21]/50 border border-[#2A3338]/50 text-[#E9E1D8] placeholder-[#5F6A6E] text-sm focus:outline-none focus:border-[#8C3A32]/50 focus:bg-[#141D21] transition-all"
                    />
                </div>
                
                {/* Sort Dropdown */}
                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#141D21]/50 border border-[#2A3338]/50">
                    <SlidersHorizontal className="w-4 h-4 text-[#5F6A6E]" />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="bg-transparent text-[#E9E1D8] text-sm focus:outline-none cursor-pointer"
                    >
                        <option value="liquidity" className="bg-[#141D21]">💰 Liquidity</option>
                        <option value="newest" className="bg-[#141D21]">🆕 Newest</option>
                        <option value="name" className="bg-[#141D21]">🔤 A-Z</option>
                        <option value="watchlist" className="bg-[#141D21]">⭐ Watchlist</option>
                    </select>
                </div>
                
                {/* Watchlist count */}
                {watchlist.length > 0 && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm font-medium">{watchlist.length} saved</span>
                    </div>
                )}
            </div>

            {isLoading && coins.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-6 h-6 text-[#5F6A6E] animate-spin" />
                </div>
            ) : coins.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-[#0E1518] border border-[#2A3338] flex items-center justify-center mx-auto mb-4">
                            <Rocket className="w-8 h-8 text-[#5F6A6E]" />
                        </div>
                        <p className="text-[#E9E1D8] font-medium mb-2">No coins launched yet</p>
                        <p className="text-sm text-[#5F6A6E] mb-4">Be the first to launch a token with Paper Hand Tax!</p>
                        <Link
                            href="/launch"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#8C3A32] text-[#E9E1D8] text-sm font-medium hover:bg-[#A04438] transition-colors"
                        >
                            Create Your Coin
                        </Link>
                    </CardContent>
                </Card>
            ) : filteredCoins.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Search className="w-12 h-12 text-[#5F6A6E] mx-auto mb-4" />
                        <p className="text-[#E9E1D8] font-medium mb-2">No tokens found</p>
                        <p className="text-sm text-[#5F6A6E]">Try a different search term</p>
                    </CardContent>
                </Card>
            ) : (
                <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 ${isLoading ? 'opacity-80' : ''}`}>
                    {filteredCoins.map((coin) => {
                        const isWatched = watchlist.includes(coin.mint.toBase58())
                        return (
                        <Link
                            key={coin.pool.toBase58()}
                            href={`/token/${coin.mint.toBase58()}`}
                            className="group"
                        >
                            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#1A2428]/80 to-[#0E1518] border border-[#2A3338]/50 hover:border-[#8C3A32]/60 transition-all duration-300 hover:shadow-[0_0_30px_rgba(140,58,50,0.15)] hover:-translate-y-1">
                                {/* Glow effect on hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[#8C3A32]/0 to-[#8C3A32]/0 group-hover:from-[#8C3A32]/5 group-hover:to-transparent transition-all duration-300 pointer-events-none" />
                                
                                {/* Image */}
                                <div className="aspect-square relative overflow-hidden">
                                    {coin.image ? (
                                        <img
                                            src={coin.image}
                                            alt={coin.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#8C3A32]/20 to-[#0E1518]">
                                            <span className="text-4xl font-bold text-[#8C3A32]/60">{coin.symbol.slice(0, 2)}</span>
                                        </div>
                                    )}
                                    {/* Vignette overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0E1518] via-[#0E1518]/20 to-transparent" />
                                    
                                    {/* Watchlist star */}
                                    <button
                                        onClick={(e) => toggleWatchlist(coin.mint.toBase58(), e)}
                                        className={`absolute top-2 left-2 p-1.5 rounded-full backdrop-blur-md border transition-all duration-200 ${
                                            isWatched 
                                                ? 'bg-amber-500/30 border-amber-400/50 text-amber-300 scale-110' 
                                                : 'bg-black/30 border-white/10 text-white/50 hover:text-amber-300 hover:bg-amber-500/20'
                                        }`}
                                    >
                                        <Star className={`w-3.5 h-3.5 ${isWatched ? 'fill-current' : ''}`} />
                                    </button>

                                    {/* Symbol pill */}
                                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                                        <span className="text-[10px] font-bold text-white tracking-wider">${coin.symbol}</span>
                                    </div>
                                    
                                    {/* Category badge */}
                                    {coin.category && (
                                        <div 
                                            className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full backdrop-blur-md text-[10px] font-semibold text-white flex items-center gap-1"
                                            style={{ backgroundColor: `${TOKEN_CATEGORIES.find(c => c.id === coin.category)?.color}cc` || '#8C3A32cc' }}
                                        >
                                            <span>{TOKEN_CATEGORIES.find(c => c.id === coin.category)?.emoji}</span>
                                            <span className="hidden sm:inline">{TOKEN_CATEGORIES.find(c => c.id === coin.category)?.label}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-3 space-y-2">
                                    <h3 className="text-sm font-semibold text-[#E9E1D8] truncate group-hover:text-white transition-colors">
                                        {coin.name}
                                    </h3>
                                    
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                            <span className="text-xs text-emerald-400 font-medium">{formatLamportsToSol(coin.solReserve)} SOL</span>
                                        </div>
                                        <span className="text-[10px] text-[#5F6A6E] font-mono">{coin.mint.toBase58().slice(0, 6)}...</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    )})}
                </div>
            )}
        </div>
    )
}
