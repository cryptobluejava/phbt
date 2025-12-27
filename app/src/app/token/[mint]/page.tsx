"use client"

import { useState, useEffect, use } from "react"
import { TradePanel } from "@/components/trade-panel"
import { PositionCard } from "@/components/position-card"
import { TreasuryCard } from "@/components/treasury-card"
import { TradesTable } from "@/components/trades-table"
import { TokenChart } from "@/components/token-chart"
import { WalletDistribution } from "@/components/wallet-distribution"
import { CreatorFeesCard } from "@/components/creator-fees-card"
import { TooltipProvider } from "@/components/ui/tooltip"
import { PublicKey } from "@solana/web3.js"
import Link from "next/link"
import { useTokenPageData } from "@/hooks/use-token-page-data"
import { Copy, Check, ExternalLink, Globe, Twitter, Send, Users, Droplets, TrendingUp, TrendingDown, Activity, Zap, ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getSolscanTokenUrl } from "@/lib/format"
import { IS_MAINNET } from "@/lib/constants"
import { getCachedSolPrice, formatMarketCap } from "@/lib/market-cap"

// Format large numbers
function formatSupply(supply: number): string {
    if (supply >= 1_000_000_000) {
        const billions = supply / 1_000_000_000
        return billions % 1 === 0 ? `${billions}B` : `${billions.toFixed(1)}B`
    }
    if (supply >= 1_000_000) {
        const millions = supply / 1_000_000
        return millions % 1 === 0 ? `${millions}M` : `${millions.toFixed(1)}M`
    }
    return supply.toLocaleString()
}

// Format price
function formatPrice(price: number): string {
    if (price >= 1) return `$${price.toFixed(2)}`
    if (price >= 0.01) return `$${price.toFixed(4)}`
    if (price >= 0.0001) return `$${price.toFixed(6)}`
    return `$${price.toExponential(2)}`
}

export default function TokenPage({ params }: { params: Promise<{ mint: string }> }) {
    const { mint: mintStr } = use(params)
    const [refreshKey, setRefreshKey] = useState(0)
    const [copiedCA, setCopiedCA] = useState(false)
    const [imageError, setImageError] = useState(false)
    const [solPrice, setSolPrice] = useState(180)
    
    // Fetch SOL price
    useEffect(() => {
        getCachedSolPrice().then(p => p > 0 && setSolPrice(p))
        const interval = setInterval(() => getCachedSolPrice().then(p => p > 0 && setSolPrice(p)), 60000)
        return () => clearInterval(interval)
    }, [])

    let mint: PublicKey
    try {
        mint = new PublicKey(mintStr)
    } catch {
        return (
            <div className="min-h-screen bg-[#0a0f12] flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl text-white mb-4">Invalid Token Address</h1>
                    <Link href="/" className="text-[#8C3A32] hover:underline">Back to Explore</Link>
                </div>
            </div>
        )
    }

    const { metadata, trades, holdings, pool, isLoading, isRefreshing, hasFetched, refetch } = useTokenPageData(mint)
    
    // Calculate market cap from ACTUAL TRADE PRICES (in-platform price!)
    // This is the real price from executed trades on the platform
    const latestTradePrice = trades.length > 0 ? trades[0].price : 0
    const marketCapUsd = latestTradePrice > 0 && metadata?.totalSupply 
        ? latestTradePrice * metadata.totalSupply * solPrice 
        : 0
    
    // Price change from trades (if available)
    const priceChange = trades.length >= 2 
        ? ((trades[0].price - trades[trades.length - 1].price) / trades[trades.length - 1].price) * 100 
        : 0

    const manualRefetch = () => refetch(true)

    const handleTradeComplete = () => {
        setRefreshKey(prev => prev + 1)
        manualRefetch()
    }

    const copyCA = async () => {
        await navigator.clipboard.writeText(mint.toBase58())
        setCopiedCA(true)
        setTimeout(() => setCopiedCA(false), 2000)
    }

    const displayName = metadata?.name || "Loading..."
    const displaySymbol = metadata?.symbol || "..."

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-gradient-to-b from-[#080B0E] via-[#0a0f12] to-[#080B0E]">
                {/* Sleek Top Bar */}
                <div className="border-b border-[#1A2428]/80 bg-[#0A0F11]/90 backdrop-blur-xl sticky top-[72px] z-40">
                    <div className="max-w-[1800px] mx-auto px-4 py-4">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            {/* Left: Token Identity */}
                            <div className="flex items-center gap-5">
                                <Link 
                                    href="/" 
                                    className="flex items-center gap-2 text-[#5F6A6E] hover:text-[#E9E1D8] transition-all text-sm group"
                                >
                                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                    <span>Back</span>
                                </Link>
                                <div className="h-8 w-px bg-gradient-to-b from-transparent via-[#2A3338] to-transparent" />
                                
                                {/* Token Avatar & Info */}
                                <div className="flex items-center gap-4">
                                    <div className="relative group">
                                        {metadata?.image && !imageError ? (
                                            <img
                                                src={metadata.image}
                                                alt={displayName}
                                                className="w-12 h-12 rounded-xl object-cover border-2 border-[#2A3338] group-hover:border-[#8C3A32] transition-colors shadow-lg"
                                                onError={() => setImageError(true)}
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8C3A32] to-[#5C2520] flex items-center justify-center shadow-lg shadow-[#8C3A32]/20">
                                                <span className="text-white font-bold text-lg">{displaySymbol.slice(0, 2)}</span>
                                            </div>
                                        )}
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-[#0A0F11] animate-pulse" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h1 className="text-xl font-bold text-[#E9E1D8]">{displayName}</h1>
                                            <Badge 
                                                variant="secondary" 
                                                className={`text-[10px] px-2 py-0.5 font-medium ${
                                                    IS_MAINNET 
                                                        ? "bg-green-500/10 border-green-500/30 text-green-400" 
                                                        : "bg-[#8C3A32]/10 border-[#8C3A32]/30 text-[#8C3A32]"
                                                }`}
                                            >
                                                {IS_MAINNET ? "MAINNET" : "DEVNET"}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[#8C3A32] font-semibold">${displaySymbol}</span>
                                            <span className="text-[#3A4448]">•</span>
                                            <code className="text-xs text-[#5F6A6E] font-mono bg-[#0E1518] px-2 py-0.5 rounded">
                                                {mint.toBase58().slice(0, 6)}...{mint.toBase58().slice(-4)}
                                            </code>
                                            <button 
                                                onClick={copyCA} 
                                                className="text-[#5F6A6E] hover:text-[#E9E1D8] transition-colors p-1 hover:bg-[#1A2428] rounded"
                                            >
                                                {copiedCA ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                            </button>
                                            <a 
                                                href={getSolscanTokenUrl(mint.toBase58())} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="text-[#5F6A6E] hover:text-[#E9E1D8] transition-colors p-1 hover:bg-[#1A2428] rounded"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Stats & Actions */}
                            <div className="flex items-center gap-6">
                                {/* Live Stats Cards */}
                                <div className="hidden lg:flex items-center gap-3">
                                    {/* Market Cap */}
                                    <div className="bg-[#0E1518] border border-[#1A2428] rounded-xl px-4 py-2 min-w-[120px]">
                                        <div className="text-[10px] uppercase tracking-wider text-[#5F6A6E] font-medium">Market Cap</div>
                                        <div className="text-[#E9E1D8] font-bold text-lg">
                                            {marketCapUsd > 0 ? formatMarketCap(marketCapUsd) : '--'}
                                        </div>
                                    </div>
                                    
                                    {/* Supply */}
                                    <div className="bg-[#0E1518] border border-[#1A2428] rounded-xl px-4 py-2 min-w-[100px]">
                                        <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-[#5F6A6E] font-medium">
                                            <Droplets className="w-3 h-3" />
                                            Supply
                                        </div>
                                        <div className="text-[#E9E1D8] font-bold">
                                            {metadata ? formatSupply(metadata.totalSupply) : "--"}
                                        </div>
                                    </div>
                                    
                                    {/* Holders */}
                                    <div className="bg-[#0E1518] border border-[#1A2428] rounded-xl px-4 py-2 min-w-[80px]">
                                        <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-[#5F6A6E] font-medium">
                                            <Users className="w-3 h-3" />
                                            Holders
                                        </div>
                                        <div className="text-[#E9E1D8] font-bold">{holdings.length}</div>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="hidden lg:block h-10 w-px bg-gradient-to-b from-transparent via-[#2A3338] to-transparent" />

                                {/* Social Links */}
                                {(metadata?.website || metadata?.twitter || metadata?.telegram) && (
                                    <div className="flex items-center gap-1">
                                        {metadata?.website && (
                                            <a 
                                                href={metadata.website.startsWith('http') ? metadata.website : `https://${metadata.website}`}
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="p-2.5 rounded-xl hover:bg-[#1A2428] transition-all group"
                                            >
                                                <Globe className="w-4 h-4 text-[#5F6A6E] group-hover:text-[#E9E1D8] transition-colors" />
                                            </a>
                                        )}
                                        {metadata?.twitter && (
                                            <a 
                                                href={metadata.twitter.startsWith('http') ? metadata.twitter : `https://twitter.com/${metadata.twitter.replace('@', '')}`}
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="p-2.5 rounded-xl hover:bg-[#1DA1F2]/10 transition-all group"
                                            >
                                                <Twitter className="w-4 h-4 text-[#5F6A6E] group-hover:text-[#1DA1F2] transition-colors" />
                                            </a>
                                        )}
                                        {metadata?.telegram && (
                                            <a 
                                                href={metadata.telegram.startsWith('http') ? metadata.telegram : `https://t.me/${metadata.telegram.replace('@', '')}`}
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="p-2.5 rounded-xl hover:bg-[#0088cc]/10 transition-all group"
                                            >
                                                <Send className="w-4 h-4 text-[#5F6A6E] group-hover:text-[#0088cc] transition-colors" />
                                            </a>
                                        )}
                                    </div>
                                )}

                                {/* Share Button */}
                                <a
                                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out $${displaySymbol} on PHBT! 💀\n\n`)}&url=${encodeURIComponent(`https://phbt.fun/token/${mint.toBase58()}`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#1DA1F2]/20 to-[#1DA1F2]/10 text-[#1DA1F2] text-sm font-medium hover:from-[#1DA1F2]/30 hover:to-[#1DA1F2]/20 transition-all border border-[#1DA1F2]/20"
                                >
                                    <Twitter className="w-4 h-4" />
                                    Share
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-[1800px] mx-auto p-4 lg:p-6">
                    <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
                        {/* Left Column - Chart & Data */}
                        <div className="space-y-6">
                            {/* Chart Card */}
                            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0E1518] to-[#0A0F11] border border-[#1A2428] shadow-xl">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#8C3A32]/5 to-transparent pointer-events-none" />
                                <TokenChart
                                    trades={trades}
                                    totalSupply={metadata?.totalSupply || 0}
                                    isLoading={isLoading}
                                    isRefreshing={isRefreshing}
                                    onRefresh={manualRefetch}
                                />
                            </div>

                            {/* Trades & Distribution in Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Trades Table */}
                                <div className="rounded-2xl bg-gradient-to-br from-[#0E1518] to-[#0A0F11] border border-[#1A2428] overflow-hidden shadow-xl">
                                    <TradesTable 
                                        mint={mint} 
                                        trades={trades} 
                                        isLoading={isLoading} 
                                        isRefreshing={isRefreshing} 
                                        onRefresh={manualRefetch} 
                                    />
                                </div>

                                {/* Wallet Distribution */}
                                <div className="rounded-2xl bg-gradient-to-br from-[#0E1518] to-[#0A0F11] border border-[#1A2428] overflow-hidden shadow-xl">
                                    <WalletDistribution
                                        holdings={holdings}
                                        isLoading={isLoading}
                                        isRefreshing={isRefreshing}
                                        onRefresh={manualRefetch}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Trading Sidebar */}
                        <div className="space-y-5">
                            <div className="sticky top-[180px] space-y-5">
                                {/* Trade Panel */}
                                <div className="rounded-2xl bg-gradient-to-br from-[#0E1518] to-[#0A0F11] border border-[#1A2428] overflow-hidden shadow-xl">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#8C3A32]/5 to-transparent pointer-events-none rounded-2xl" />
                                    <TradePanel
                                        mint={mint}
                                        tokenSymbol={metadata?.symbol}
                                        onTradeComplete={handleTradeComplete}
                                    />
                                </div>

                                {/* Position Card */}
                                <div className="rounded-2xl bg-gradient-to-br from-[#0E1518] to-[#0A0F11] border border-[#1A2428] overflow-hidden shadow-xl">
                                    <PositionCard 
                                        key={`position-${refreshKey}`} 
                                        mint={mint} 
                                        tokenSymbol={metadata?.symbol} 
                                    />
                                </div>

                                {/* Treasury & Creator */}
                                <div className="grid grid-cols-1 gap-5">
                                    <div className="rounded-2xl bg-gradient-to-br from-[#0E1518] to-[#0A0F11] border border-[#1A2428] overflow-hidden shadow-xl">
                                        <TreasuryCard />
                                    </div>
                                    <div className="rounded-2xl bg-gradient-to-br from-[#0E1518] to-[#0A0F11] border border-[#1A2428] overflow-hidden shadow-xl">
                                        <CreatorFeesCard mint={mint} tokenCreator={metadata?.creator} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    )
}
