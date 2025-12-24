"use client"

import { useState, use } from "react"
import { TradePanel } from "@/components/trade-panel"
import { PositionCard } from "@/components/position-card"
import { TreasuryCard } from "@/components/treasury-card"
import { TokenCard } from "@/components/token-card"
import { TradesTable } from "@/components/trades-table"
import { TokenChart } from "@/components/token-chart"
import { WalletDistribution } from "@/components/wallet-distribution"
import { TooltipProvider } from "@/components/ui/tooltip"
import { PublicKey } from "@solana/web3.js"
import Link from "next/link"
import { useTokenPageData } from "@/hooks/use-token-page-data"

export default function TokenPage({ params }: { params: Promise<{ mint: string }> }) {
    const { mint: mintStr } = use(params)
    const [refreshKey, setRefreshKey] = useState(0)

    let mint: PublicKey
    try {
        mint = new PublicKey(mintStr)
    } catch (e) {
        return (
            <div className="min-h-screen bg-[#0E1518] flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl text-[#E9E1D8] mb-4">Invalid Token Address</h1>
                    <Link href="/" className="text-[#8C3A32] hover:underline">Back to Explore</Link>
                </div>
            </div>
        )
    }

    // Centralized data fetching - all RPC calls happen here
    const { metadata, trades, holdings, isLoading, isRefreshing, hasFetched, refetch } = useTokenPageData(mint)

    // Wrapper for manual refresh that passes true to show the spinner
    const manualRefetch = () => refetch(true)

    const handleTradeComplete = () => {
        setRefreshKey(prev => prev + 1)
        manualRefetch()
    }

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-[#0E1518]">
                <div className="max-w-6xl mx-auto px-6 py-12">

                    <div className="mb-8">
                        <Link href="/" className="text-sm text-[#9FA6A3] hover:text-[#E9E1D8] transition-colors">
                            ← Back to Explore
                        </Link>
                    </div>

                    {/* Main content grid - 2 columns with equal height */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

                        {/* Left column - Token Info & Trade */}
                        <div className="flex flex-col gap-6 h-full">
                            <TokenCard mint={mint} metadata={metadata} isLoading={isLoading} />
                            <TradePanel
                                mint={mint}
                                tokenSymbol={metadata?.symbol}
                                onTradeComplete={handleTradeComplete}
                                className="flex-1"
                            />
                        </div>

                        {/* Right column - Position & Treasury */}
                        <div className="flex flex-col gap-6 h-full">
                            <PositionCard key={`position-${refreshKey}`} mint={mint} tokenSymbol={metadata?.symbol} className="flex-1" />
                            <TreasuryCard />
                        </div>
                    </div>

                    {/* Market Cap Chart - Full width */}
                    <div className="mt-8">
                        <TokenChart
                            trades={trades}
                            totalSupply={metadata?.totalSupply || 0}
                            isLoading={isLoading}
                            isRefreshing={isRefreshing}
                            onRefresh={manualRefetch}
                        />
                    </div>

                    {/* Trades Section - Full width below columns */}
                    <div className="mt-8">
                        <TradesTable mint={mint} trades={trades} isLoading={isLoading} isRefreshing={isRefreshing} onRefresh={manualRefetch} />
                    </div>

                    {/* Wallet Distribution - Full width */}
                    <div className="mt-8">
                        <WalletDistribution
                            holdings={holdings}
                            isLoading={isLoading}
                            isRefreshing={isRefreshing}
                            onRefresh={manualRefetch}
                        />
                    </div>
                </div>
            </div>
        </TooltipProvider>
    )
}
