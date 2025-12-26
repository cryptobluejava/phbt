"use client"

import { useState, use } from "react"
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
import { Copy, Check, ExternalLink, Globe, Twitter, Send, Users, Droplets } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getSolscanTokenUrl } from "@/lib/format"
import { IS_MAINNET } from "@/lib/constants"

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

export default function TokenPage({ params }: { params: Promise<{ mint: string }> }) {
    const { mint: mintStr } = use(params)
    const [refreshKey, setRefreshKey] = useState(0)
    const [copiedCA, setCopiedCA] = useState(false)
    const [imageError, setImageError] = useState(false)

    let mint: PublicKey
    try {
        mint = new PublicKey(mintStr)
    } catch (e) {
        return (
            <div className="min-h-screen bg-[#0a0f12] flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl text-white mb-4">Invalid Token Address</h1>
                    <Link href="/" className="text-[#8C3A32] hover:underline">Back to Explore</Link>
                </div>
            </div>
        )
    }

    const { metadata, trades, holdings, isLoading, isRefreshing, hasFetched, refetch } = useTokenPageData(mint)

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
            <div className="min-h-screen bg-[#0a0f12]">
                {/* Top Bar - Token Info */}
                <div className="border-b border-[#1f2937] bg-[#0a0f12]/80 backdrop-blur-sm sticky top-[72px] z-40">
                    <div className="max-w-[1800px] mx-auto px-4 py-3">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            {/* Left: Token Identity */}
                            <div className="flex items-center gap-4">
                                <Link href="/" className="text-gray-500 hover:text-white transition-colors text-sm">
                                    ← Back
                                </Link>
                                <div className="h-6 w-px bg-[#1f2937]" />
                                <div className="flex items-center gap-3">
                                    {metadata?.image && !imageError ? (
                                        <img
                                            src={metadata.image}
                                            alt={displayName}
                                            className="w-10 h-10 rounded-full object-cover border border-[#1f2937]"
                                            onError={() => setImageError(true)}
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8C3A32] to-[#A04438] flex items-center justify-center">
                                            <span className="text-white font-bold">{displaySymbol.slice(0, 2)}</span>
                                        </div>
                                    )}
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h1 className="text-lg font-bold text-white">{displayName}</h1>
                                            <Badge variant="secondary" className={`text-xs ${IS_MAINNET ? "border-green-500/50 text-green-500" : "border-[#8C3A32]/50 text-[#8C3A32]"}`}>
                                                {IS_MAINNET ? "MAINNET" : "DEVNET"}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <span>${displaySymbol}</span>
                                            <span>•</span>
                                            <span className="font-mono text-xs">{mint.toBase58().slice(0, 6)}...{mint.toBase58().slice(-4)}</span>
                                            <button onClick={copyCA} className="hover:text-white transition-colors">
                                                {copiedCA ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                            </button>
                                            <a href={getSolscanTokenUrl(mint.toBase58())} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Quick Info & Socials */}
                            <div className="flex items-center gap-4">
                                {/* Token Stats */}
                                <div className="hidden sm:flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Droplets className="w-4 h-4" />
                                        <span>Supply: {metadata ? formatSupply(metadata.totalSupply) : "--"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Users className="w-4 h-4" />
                                        <span>{holdings.length} holders</span>
                                    </div>
                                </div>

                                {/* Social Links */}
                                {(metadata?.website || metadata?.twitter || metadata?.telegram) && (
                                    <div className="flex items-center gap-2">
                                        {metadata?.website && (
                                            <a href={metadata.website.startsWith('http') ? metadata.website : `https://${metadata.website}`}
                                               target="_blank" rel="noopener noreferrer"
                                               className="p-2 rounded-lg hover:bg-[#1f2937] transition-colors">
                                                <Globe className="w-4 h-4 text-gray-400 hover:text-white" />
                                            </a>
                                        )}
                                        {metadata?.twitter && (
                                            <a href={metadata.twitter.startsWith('http') ? metadata.twitter : `https://twitter.com/${metadata.twitter.replace('@', '')}`}
                                               target="_blank" rel="noopener noreferrer"
                                               className="p-2 rounded-lg hover:bg-[#1f2937] transition-colors">
                                                <Twitter className="w-4 h-4 text-gray-400 hover:text-[#1DA1F2]" />
                                            </a>
                                        )}
                                        {metadata?.telegram && (
                                            <a href={metadata.telegram.startsWith('http') ? metadata.telegram : `https://t.me/${metadata.telegram.replace('@', '')}`}
                                               target="_blank" rel="noopener noreferrer"
                                               className="p-2 rounded-lg hover:bg-[#1f2937] transition-colors">
                                                <Send className="w-4 h-4 text-gray-400 hover:text-[#0088cc]" />
                                            </a>
                                        )}
                                    </div>
                                )}

                                {/* Share */}
                                <div className="flex items-center gap-2">
                                    <a
                                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out $${displaySymbol} on PHBT! 💀\n\n`)}&url=${encodeURIComponent(`https://phbt.fun/token/${mint.toBase58()}`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1.5 rounded-lg bg-[#1DA1F2]/10 text-[#1DA1F2] text-sm font-medium hover:bg-[#1DA1F2]/20 transition-colors"
                                    >
                                        Share
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-[1800px] mx-auto p-4">
                    <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4">
                        {/* Left Column - Chart & Trades */}
                        <div className="space-y-4">
                            {/* Chart */}
                            <TokenChart
                                trades={trades}
                                totalSupply={metadata?.totalSupply || 0}
                                isLoading={isLoading}
                                isRefreshing={isRefreshing}
                                onRefresh={manualRefetch}
                            />

                            {/* Trades Table */}
                            <TradesTable 
                                mint={mint} 
                                trades={trades} 
                                isLoading={isLoading} 
                                isRefreshing={isRefreshing} 
                                onRefresh={manualRefetch} 
                            />

                            {/* Wallet Distribution */}
                            <WalletDistribution
                                holdings={holdings}
                                isLoading={isLoading}
                                isRefreshing={isRefreshing}
                                onRefresh={manualRefetch}
                            />
                        </div>

                        {/* Right Column - Trading Sidebar */}
                        <div className="space-y-4">
                            {/* Trade Panel */}
                            <div className="sticky top-[160px]">
                                <TradePanel
                                    mint={mint}
                                    tokenSymbol={metadata?.symbol}
                                    onTradeComplete={handleTradeComplete}
                                />

                                {/* Position */}
                                <div className="mt-4">
                                    <PositionCard 
                                        key={`position-${refreshKey}`} 
                                        mint={mint} 
                                        tokenSymbol={metadata?.symbol} 
                                    />
                                </div>

                                {/* Treasury & Creator Fees */}
                                <div className="mt-4 space-y-4">
                                    <TreasuryCard />
                                    <CreatorFeesCard mint={mint} tokenCreator={metadata?.creator} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    )
}
