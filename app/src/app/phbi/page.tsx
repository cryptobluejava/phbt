"use client"

import { useState, useEffect, useCallback } from "react"
import { useConnection } from "@solana/wallet-adapter-react"
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw, Skull, ExternalLink, Trophy, TrendingDown, Flame, AlertCircle } from "lucide-react"
import { TREASURY_WALLET, PROGRAM_ID } from "@/lib/constants"
import { getPoolPDA } from "@/lib/pdas"
import { getSolscanAccountUrl, getSolscanTxUrl } from "@/lib/format"
import Link from "next/link"

// $PHBT - main coin on pump.fun
const PUMP_TOKEN = "8FffyZvj3LugcrVwr1jpDb33zmzMQk2pvLqXJtK5pump"
const PUMP_PROGRAM_ID = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P") // pump.fun program

// $stitches - main coin on PHBT platform
const PHBT_TOKEN = "FBCnkZ41gv1TLt7aCA7CUonBk3YNVJZsYvfQYNSJmDRz"

// Cache keys and duration (5 hours)
const CACHE_KEY_PUMP = "phbi_pump_cache"
const CACHE_KEY_PHBT = "phbi_phbt_cache"
const CACHE_DURATION = 5 * 60 * 60 * 1000 // 5 hours in ms

interface PaperHandSell {
    wallet: string
    taxAmount: number
    signature: string
    timestamp: number
}

interface WalletStats {
    address: string
    totalTaxPaid: number
    sellCount: number
    sells: PaperHandSell[]
}

interface CachedData {
    walletStats: WalletStats[]
    allSells: PaperHandSell[]
    totalTaxCollected: number
    timestamp: number
}

type Mode = "PUMP" | "PHBT"

export default function PaperHandBitchIndex() {
    const { connection } = useConnection()
    const [mode, setMode] = useState<Mode>("PUMP")
    const [walletStats, setWalletStats] = useState<WalletStats[]>([])
    const [allSells, setAllSells] = useState<PaperHandSell[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [totalTaxCollected, setTotalTaxCollected] = useState(0)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

    // Load cached data
    const loadFromCache = useCallback((cacheKey: string): CachedData | null => {
        try {
            const cached = localStorage.getItem(cacheKey)
            if (!cached) return null
            
            const data: CachedData = JSON.parse(cached)
            const age = Date.now() - data.timestamp
            
            // Check if cache is still valid
            if (age < CACHE_DURATION) {
                return data
            }
            return null
        } catch {
            return null
        }
    }, [])

    // Save to cache
    const saveToCache = useCallback((cacheKey: string, data: Omit<CachedData, 'timestamp'>) => {
        try {
            const cacheData: CachedData = {
                ...data,
                timestamp: Date.now()
            }
            localStorage.setItem(cacheKey, JSON.stringify(cacheData))
        } catch (e) {
            console.error("Failed to save cache:", e)
        }
    }, [])

    // Fetch PHBT paper hands (from $stitches pool)
    const fetchPHBTPaperHands = useCallback(async (forceRefresh = false) => {
        const cacheKey = CACHE_KEY_PHBT
        
        // Try cache first
        if (!forceRefresh) {
            const cached = loadFromCache(cacheKey)
            if (cached) {
                setWalletStats(cached.walletStats)
                setAllSells(cached.allSells)
                setTotalTaxCollected(cached.totalTaxCollected)
                setLastUpdated(new Date(cached.timestamp))
                return
            }
        }

        setIsLoading(true)
        setError(null)

        try {
            // Query $stitches pool for paper hand sells
            const mint = new PublicKey(PHBT_TOKEN)
            const [poolPDA] = getPoolPDA(mint)
            
            const signatures = await connection.getSignaturesForAddress(poolPDA, { limit: 200 })
            
            if (signatures.length === 0) {
                setError("No treasury transactions found")
                setIsLoading(false)
                return
            }

            const paperHandSells: PaperHandSell[] = []
            const walletMap = new Map<string, WalletStats>()

            for (const sig of signatures) {
                try {
                    await new Promise(r => setTimeout(r, 100))
                    
                    const tx = await connection.getParsedTransaction(sig.signature, {
                        maxSupportedTransactionVersion: 0
                    })

                    if (!tx || !tx.meta || tx.meta.err) continue

                    const programInvolved = tx.transaction.message.accountKeys.some(
                        key => key.pubkey.equals(PROGRAM_ID)
                    )
                    if (!programInvolved) continue

                    const treasuryIndex = tx.transaction.message.accountKeys.findIndex(
                        key => key.pubkey.equals(TREASURY_WALLET)
                    )
                    if (treasuryIndex === -1) continue

                    const preBalances = tx.meta.preBalances
                    const postBalances = tx.meta.postBalances
                    const treasuryChange = (postBalances[treasuryIndex] - preBalances[treasuryIndex]) / LAMPORTS_PER_SOL

                    if (treasuryChange <= 0.0001) continue

                    const signerIndex = tx.transaction.message.accountKeys.findIndex(key => key.signer)
                    if (signerIndex === -1) continue
                    const signer = tx.transaction.message.accountKeys[signerIndex].pubkey.toBase58()

                    const sell: PaperHandSell = {
                        wallet: signer,
                        taxAmount: treasuryChange,
                        signature: sig.signature,
                        timestamp: sig.blockTime || 0,
                    }
                    
                    paperHandSells.push(sell)

                    let stats = walletMap.get(signer)
                    if (!stats) {
                        stats = { address: signer, totalTaxPaid: 0, sellCount: 0, sells: [] }
                        walletMap.set(signer, stats)
                    }
                    stats.totalTaxPaid += treasuryChange
                    stats.sellCount++
                    stats.sells.push(sell)

                } catch {
                    continue
                }
            }

            const statsArray = Array.from(walletMap.values())
            statsArray.sort((a, b) => b.totalTaxPaid - a.totalTaxPaid)
            const total = statsArray.reduce((sum, w) => sum + w.totalTaxPaid, 0)
            
            setWalletStats(statsArray)
            setAllSells(paperHandSells)
            setTotalTaxCollected(total)
            setLastUpdated(new Date())
            
            // Save to cache
            saveToCache(cacheKey, { walletStats: statsArray, allSells: paperHandSells, totalTaxCollected: total })

        } catch (e) {
            console.error("Error fetching PHBT paper hands:", e)
            setError(e instanceof Error ? e.message : "Failed to fetch data")
        } finally {
            setIsLoading(false)
        }
    }, [connection, loadFromCache, saveToCache])

    // Fetch PUMP paper hands (from token trades)
    const fetchPUMPPaperHands = useCallback(async (forceRefresh = false) => {
        const cacheKey = CACHE_KEY_PUMP
        
        // Try cache first
        if (!forceRefresh) {
            const cached = loadFromCache(cacheKey)
            if (cached) {
                setWalletStats(cached.walletStats)
                setAllSells(cached.allSells)
                setTotalTaxCollected(cached.totalTaxCollected)
                setLastUpdated(new Date(cached.timestamp))
                return
            }
        }

        setIsLoading(true)
        setError(null)

        try {
            const mint = new PublicKey(PUMP_TOKEN)
            
            // Derive pump.fun bonding curve PDA
            const [bondingCurve] = PublicKey.findProgramAddressSync(
                [Buffer.from("bonding-curve"), mint.toBuffer()],
                PUMP_PROGRAM_ID
            )
            
            console.log("Pump.fun bonding curve:", bondingCurve.toBase58())
            
            // Fetch multiple pages of signatures for comprehensive data
            let allSignatures: typeof signatures = []
            let lastSig: string | undefined = undefined
            
            for (let page = 0; page < 5; page++) { // Get up to 5 pages (1000 signatures)
                const sigs = await connection.getSignaturesForAddress(bondingCurve, { 
                    limit: 200,
                    before: lastSig 
                })
                if (sigs.length === 0) break
                allSignatures = allSignatures.concat(sigs)
                lastSig = sigs[sigs.length - 1].signature
                console.log(`Page ${page + 1}: fetched ${sigs.length} signatures, total: ${allSignatures.length}`)
                await new Promise(r => setTimeout(r, 100))
            }
            
            const signatures = allSignatures
            console.log("Total signatures found:", signatures.length)
            
            if (signatures.length === 0) {
                setError("No trades found for $PHBT token")
                setIsLoading(false)
                return
            }
            
            // Process oldest first for correct cost basis calculation
            signatures.reverse()

            // Track each wallet's trades
            const walletTrades = new Map<string, { 
                buys: { sol: number, tokens: number }[], 
                sells: { sol: number, tokens: number, signature: string, timestamp: number }[] 
            }>()
            
            let processedCount = 0

            for (const sig of signatures) {
                try {
                    await new Promise(r => setTimeout(r, 50))
                    
                    const tx = await connection.getParsedTransaction(sig.signature, {
                        maxSupportedTransactionVersion: 0
                    })

                    if (!tx || !tx.meta || tx.meta.err) continue

                    const signerIndex = tx.transaction.message.accountKeys.findIndex(key => key.signer)
                    if (signerIndex === -1) continue
                    const signer = tx.transaction.message.accountKeys[signerIndex].pubkey.toBase58()

                    const preBalances = tx.meta.preBalances
                    const postBalances = tx.meta.postBalances
                    const solChange = (postBalances[signerIndex] - preBalances[signerIndex]) / LAMPORTS_PER_SOL

                    // Get token change - look at ALL token balance changes for this mint
                    const preTokenBalances = tx.meta.preTokenBalances || []
                    const postTokenBalances = tx.meta.postTokenBalances || []

                    let tokenChange = 0
                    
                    // Check all post balances for our token
                    for (const post of postTokenBalances) {
                        if (post.mint !== PUMP_TOKEN) continue
                        const pre = preTokenBalances.find(p => p.accountIndex === post.accountIndex)
                        const preAmount = pre?.uiTokenAmount.uiAmount || 0
                        const postAmount = post.uiTokenAmount.uiAmount || 0
                        const change = postAmount - preAmount
                        
                        // Take the change that's not from the bonding curve (user's change)
                        if (Math.abs(change) > Math.abs(tokenChange)) {
                            tokenChange = change
                        }
                    }
                    
                    // Also check pre balances (for accounts that were closed)
                    for (const pre of preTokenBalances) {
                        if (pre.mint !== PUMP_TOKEN) continue
                        const post = postTokenBalances.find(p => p.accountIndex === pre.accountIndex)
                        if (!post) {
                            // Account was closed, user sold all
                            const preAmount = pre.uiTokenAmount.uiAmount || 0
                            if (preAmount > Math.abs(tokenChange)) {
                                tokenChange = -preAmount // Sold
                            }
                        }
                    }

                    if (Math.abs(tokenChange) < 0.1) continue
                    
                    processedCount++

                    let trades = walletTrades.get(signer)
                    if (!trades) {
                        trades = { buys: [], sells: [] }
                        walletTrades.set(signer, trades)
                    }

                    if (tokenChange > 0) {
                        // BUY
                        console.log(`BUY: ${signer.slice(0,8)}... bought ${tokenChange.toFixed(0)} for ${Math.abs(solChange).toFixed(4)} SOL`)
                        trades.buys.push({ sol: Math.abs(solChange), tokens: tokenChange })
                    } else if (tokenChange < 0) {
                        // SELL
                        console.log(`SELL: ${signer.slice(0,8)}... sold ${Math.abs(tokenChange).toFixed(0)} for ${Math.abs(solChange).toFixed(4)} SOL`)
                        trades.sells.push({ 
                            sol: Math.abs(solChange), 
                            tokens: Math.abs(tokenChange),
                            signature: sig.signature,
                            timestamp: sig.blockTime || 0
                        })
                    }

                } catch {
                    continue
                }
            }

            // Calculate paper hands (sold at loss)
            const paperHandSells: PaperHandSell[] = []
            const walletMap = new Map<string, WalletStats>()

            for (const [address, trades] of walletTrades.entries()) {
                if (trades.sells.length === 0) continue

                // Calculate average buy price
                const totalSolSpent = trades.buys.reduce((sum, b) => sum + b.sol, 0)
                const totalTokensBought = trades.buys.reduce((sum, b) => sum + b.tokens, 0)
                const avgBuyPrice = totalTokensBought > 0 ? totalSolSpent / totalTokensBought : 0

                // Check each sell
                let totalLoss = 0
                let lossCount = 0

                for (const sell of trades.sells) {
                    const sellPrice = sell.tokens > 0 ? sell.sol / sell.tokens : 0
                    
                    if (sellPrice < avgBuyPrice && avgBuyPrice > 0) {
                        // Sold at loss!
                        const loss = (avgBuyPrice - sellPrice) * sell.tokens
                        totalLoss += loss
                        lossCount++

                        paperHandSells.push({
                            wallet: address,
                            taxAmount: loss, // Using "taxAmount" field for loss amount
                            signature: sell.signature,
                            timestamp: sell.timestamp
                        })
                    }
                }

                if (lossCount > 0) {
                    console.log(`PAPER HAND: ${address.slice(0,8)}... lost ${totalLoss.toFixed(4)} SOL on ${lossCount} sells`)
                    walletMap.set(address, {
                        address,
                        totalTaxPaid: totalLoss, // Total loss
                        sellCount: lossCount,
                        sells: paperHandSells.filter(s => s.wallet === address)
                    })
                }
            }
            
            console.log(`Processed ${processedCount} trades, ${walletTrades.size} unique wallets, ${walletMap.size} paper hands found`)

            const statsArray = Array.from(walletMap.values())
            statsArray.sort((a, b) => b.totalTaxPaid - a.totalTaxPaid)
            const total = statsArray.reduce((sum, w) => sum + w.totalTaxPaid, 0)
            
            setWalletStats(statsArray)
            setAllSells(paperHandSells.sort((a, b) => b.timestamp - a.timestamp))
            setTotalTaxCollected(total)
            setLastUpdated(new Date())
            
            // Save to cache
            saveToCache(cacheKey, { walletStats: statsArray, allSells: paperHandSells, totalTaxCollected: total })

        } catch (e) {
            console.error("Error fetching PUMP paper hands:", e)
            setError(e instanceof Error ? e.message : "Failed to fetch data")
        } finally {
            setIsLoading(false)
        }
    }, [connection, loadFromCache, saveToCache])

    // Fetch data based on mode
    const fetchData = useCallback((forceRefresh = false) => {
        setWalletStats([])
        setAllSells([])
        setError(null)
        
        if (mode === "PUMP") {
            fetchPUMPPaperHands(forceRefresh)
        } else {
            fetchPHBTPaperHands(forceRefresh)
        }
    }, [mode, fetchPUMPPaperHands, fetchPHBTPaperHands])

    // Load on mount and mode change
    useEffect(() => {
        fetchData(false) // Use cache if available
    }, [fetchData])

    const formatSol = (amount: number) => {
        if (amount >= 1000) return (amount / 1000).toFixed(2) + "K"
        if (amount >= 1) return amount.toFixed(4)
        return amount.toFixed(6)
    }

    const shortenAddress = (addr: string) => addr.slice(0, 4) + "..." + addr.slice(-4)

    const formatTime = (timestamp: number) => {
        const diff = Date.now() / 1000 - timestamp
        if (diff < 60) return "just now"
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
        return `${Math.floor(diff / 86400)}d ago`
    }

    const getRankEmoji = (index: number) => {
        if (index === 0) return "👑"
        if (index === 1) return "🥈"
        if (index === 2) return "🥉"
        return `#${index + 1}`
    }

    const getRankStyle = (index: number) => {
        if (index === 0) return "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/40"
        if (index === 1) return "bg-gradient-to-r from-slate-400/20 to-slate-300/20 border-slate-400/40"
        if (index === 2) return "bg-gradient-to-r from-orange-600/20 to-amber-600/20 border-orange-600/40"
        return "bg-[#141D21] border-[#2A3338]"
    }

    return (
        <div className="min-h-screen bg-[#0E1518]">
            {/* Hero section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#8C3A32]/10 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM4QzNBMzIiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
                
                <div className="max-w-4xl mx-auto px-6 py-16 relative">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-3 mb-4">
                            <Skull className="w-12 h-12 text-[#8C3A32]" />
                            <h1 className="text-4xl md:text-5xl font-bold text-[#E9E1D8] tracking-tight">
                                Paper Hand Bitch Index
                            </h1>
                            <Skull className="w-12 h-12 text-[#8C3A32]" />
                        </div>
                        <p className="text-[#9FA6A3] text-lg">
                            Exposing the weak hands who sold at a loss 💀
                        </p>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex justify-center mb-6">
                        <div className="inline-flex bg-[#141D21] border border-[#2A3338] rounded-xl p-1">
                            <button
                                onClick={() => setMode("PUMP")}
                                className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
                                    mode === "PUMP"
                                        ? "bg-[#8C3A32] text-[#E9E1D8]"
                                        : "text-[#9FA6A3] hover:text-[#E9E1D8]"
                                }`}
                            >
                                🎰 $PHBT
                            </button>
                            <button
                                onClick={() => setMode("PHBT")}
                                className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
                                    mode === "PHBT"
                                        ? "bg-[#8C3A32] text-[#E9E1D8]"
                                        : "text-[#9FA6A3] hover:text-[#E9E1D8]"
                                }`}
                            >
                                💀 $stitches
                            </button>
                        </div>
                    </div>

                    {/* Mode description */}
                    <p className="text-center text-sm text-[#5F6A6E] mb-6">
                        {mode === "PUMP" 
                            ? "Tracking paper hands on $PHBT (pump.fun)"
                            : "Tracking paper hands on $stitches (PHBT platform)"
                        }
                    </p>

                    {/* Hunt button */}
                    <div className="flex justify-center gap-3 mb-4">
                        <button
                            onClick={() => fetchData(true)}
                            disabled={isLoading}
                            className="px-6 py-3 bg-[#8C3A32] text-[#E9E1D8] rounded-xl font-medium hover:bg-[#7A332C] transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    Hunting...
                                </>
                            ) : (
                                <>
                                    <Flame className="w-5 h-5" />
                                    Hunt Paper Hands
                                </>
                            )}
                        </button>
                    </div>

                    {/* Last updated */}
                    {lastUpdated && !isLoading && (
                        <p className="text-center text-xs text-[#5F6A6E]">
                            Last updated: {lastUpdated.toLocaleString()} 
                            {" • "}
                            <button 
                                onClick={() => fetchData(true)}
                                className="text-[#8C3A32] hover:underline"
                            >
                                Force refresh
                            </button>
                        </p>
                    )}

                    {error && (
                        <div className="flex items-center justify-center gap-2 text-[#8C3A32] mt-4">
                            <AlertCircle className="w-5 h-5" />
                            <p>{error}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats cards */}
            {!isLoading && walletStats.length > 0 && (
                <div className="max-w-4xl mx-auto px-6 pb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <Card className="bg-gradient-to-br from-[#8C3A32]/20 to-[#141D21] border-[#8C3A32]/30">
                            <CardContent className="p-6 text-center">
                                <Skull className="w-8 h-8 text-[#8C3A32] mx-auto mb-2" />
                                <p className="text-3xl font-bold text-[#E9E1D8]">{walletStats.length}</p>
                                <p className="text-sm text-[#9FA6A3]">Paper Hand Bitches</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-red-900/20 to-[#141D21] border-red-500/30">
                            <CardContent className="p-6 text-center">
                                <TrendingDown className="w-8 h-8 text-red-500 mx-auto mb-2" />
                                <p className="text-3xl font-bold text-[#E9E1D8]">{formatSol(totalTaxCollected)} SOL</p>
                                <p className="text-sm text-[#9FA6A3]">
                                    {mode === "PUMP" ? "Total Losses" : "Total Tax Collected"}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-amber-900/20 to-[#141D21] border-amber-500/30">
                            <CardContent className="p-6 text-center">
                                <Trophy className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                                <p className="text-3xl font-bold text-[#E9E1D8]">{allSells.length}</p>
                                <p className="text-sm text-[#9FA6A3]">Paper Hand Sells</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* Leaderboard */}
            <div className="max-w-4xl mx-auto px-6 pb-16">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-8 bg-[#8C3A32]" />
                            <div>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Skull className="w-5 h-5 text-[#8C3A32]" />
                                    Wall of Shame
                                </CardTitle>
                                <p className="text-xs text-[#5F6A6E] mt-1">
                                    {mode === "PUMP" 
                                        ? "Ranked by total losses realized on $PHBT"
                                        : "Ranked by total paper hand tax paid on $stitches"
                                    }
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-4">
                                <RefreshCw className="w-8 h-8 text-[#8C3A32] animate-spin" />
                                <p className="text-[#9FA6A3]">Hunting paper hands...</p>
                                <p className="text-xs text-[#5F6A6E]">
                                    {mode === "PUMP" ? "Analyzing $PHBT trades..." : "Scanning $stitches trades..."}
                                </p>
                            </div>
                        ) : walletStats.length === 0 ? (
                            <div className="text-center py-16">
                                <Trophy className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                <p className="text-xl text-[#E9E1D8] mb-2">No Paper Hands Found! 💎🙌</p>
                                <p className="text-[#9FA6A3]">
                                    {mode === "PUMP" 
                                        ? "Everyone who sold $PHBT is in profit!"
                                        : "No one has been taxed on $stitches yet!"
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {walletStats.map((wallet, index) => (
                                    <div
                                        key={wallet.address}
                                        className={`p-4 rounded-xl border transition-all hover:scale-[1.01] ${getRankStyle(index)}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="text-2xl font-bold min-w-[50px] text-center">
                                                {getRankEmoji(index)}
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <a
                                                        href={getSolscanAccountUrl(wallet.address)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="font-mono text-[#E9E1D8] hover:text-[#8C3A32] transition-colors"
                                                    >
                                                        {shortenAddress(wallet.address)}
                                                    </a>
                                                    <ExternalLink className="w-3 h-3 text-[#5F6A6E]" />
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-[#5F6A6E]">
                                                    <span className="bg-[#8C3A32]/30 text-[#8C3A32] px-2 py-0.5 rounded-full">
                                                        💀 {wallet.sellCount}x {mode === "PUMP" ? "sold at loss" : "taxed"}
                                                    </span>
                                                    {wallet.sells[0] && (
                                                        <span>Last: {formatTime(wallet.sells[0].timestamp)}</span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="text-right">
                                                <p className="text-xl font-bold text-red-500">
                                                    {formatSol(wallet.totalTaxPaid)} SOL
                                                </p>
                                                <p className="text-xs text-[#5F6A6E]">
                                                    {mode === "PUMP" ? "total loss" : "tax paid"}
                                                </p>
                                            </div>
                                        </div>

                                        {wallet.sells.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-[#2A3338]/50">
                                                <div className="flex flex-wrap gap-2">
                                                    {wallet.sells.slice(0, 3).map((sell) => (
                                                        <a
                                                            key={sell.signature}
                                                            href={getSolscanTxUrl(sell.signature)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs bg-[#0E1518] px-2 py-1 rounded border border-[#2A3338] hover:border-[#8C3A32] transition-colors flex items-center gap-1"
                                                        >
                                                            <span className="text-[#9FA6A3]">{formatSol(sell.taxAmount)} SOL</span>
                                                            <ExternalLink className="w-3 h-3 text-[#5F6A6E]" />
                                                        </a>
                                                    ))}
                                                    {wallet.sells.length > 3 && (
                                                        <span className="text-xs text-[#5F6A6E] px-2 py-1">
                                                            +{wallet.sells.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent sells */}
                {allSells.length > 0 && (
                    <Card className="mt-8">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-8 bg-[#8C3A32]" />
                                <div>
                                    <CardTitle className="text-lg">Recent Paper Hand Sells</CardTitle>
                                    <p className="text-xs text-[#5F6A6E] mt-1">
                                        {mode === "PUMP" ? "Recent loss-making sells on $PHBT" : "Recent taxed sells on $stitches"}
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {allSells.slice(0, 10).map((sell) => (
                                    <div
                                        key={sell.signature}
                                        className="flex items-center justify-between p-3 rounded-lg bg-[#0E1518] border border-[#2A3338]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Skull className="w-4 h-4 text-[#8C3A32]" />
                                            <a
                                                href={getSolscanAccountUrl(sell.wallet)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-mono text-sm text-[#E9E1D8] hover:text-[#8C3A32]"
                                            >
                                                {shortenAddress(sell.wallet)}
                                            </a>
                                            <span className="text-[#5F6A6E] text-sm">
                                                {mode === "PUMP" ? "lost" : "paid"}
                                            </span>
                                            <span className="text-red-500 font-medium">{formatSol(sell.taxAmount)} SOL</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-[#5F6A6E]">{formatTime(sell.timestamp)}</span>
                                            <a
                                                href={getSolscanTxUrl(sell.signature)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1 rounded hover:bg-[#1A2428]"
                                            >
                                                <ExternalLink className="w-3 h-3 text-[#5F6A6E]" />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Back link */}
                <div className="mt-8 text-center">
                    <Link 
                        href="/"
                        className="text-[#9FA6A3] hover:text-[#E9E1D8] transition-colors"
                    >
                        ← Back to Explore
                    </Link>
                </div>
            </div>
        </div>
    )
}
