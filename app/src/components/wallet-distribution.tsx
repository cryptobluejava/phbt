"use client"

import { RefreshCw, ExternalLink, Droplets, Wallet } from "lucide-react"
import { WalletHolding } from "@/hooks/use-token-page-data"
import { getSolscanAccountUrl } from "@/lib/format"

interface WalletDistributionProps {
    holdings: WalletHolding[]
    isLoading: boolean
    isRefreshing: boolean
    onRefresh: () => void
}

export function WalletDistribution({ holdings, isLoading, isRefreshing, onRefresh }: WalletDistributionProps) {

    const formatBalance = (balance: number) => {
        if (balance >= 1_000_000) return (balance / 1_000_000).toFixed(1) + "M"
        if (balance >= 1_000) return (balance / 1_000).toFixed(1) + "K"
        return balance.toFixed(0)
    }

    const truncateAddress = (address: string) => {
        if (address === "Liquidity Pool") return address
        return address.slice(0, 4) + "..." + address.slice(-4)
    }

    return (
        <div className="p-4">
            {isLoading && holdings.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-5 h-5 text-[#5F6A6E] animate-spin" />
                </div>
            ) : holdings.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                    <Wallet className="w-8 h-8 text-[#3A4448] mx-auto" />
                    <p className="text-sm text-[#5F6A6E]">No holders found</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#1A2428]">
                                <th className="text-left py-2 px-3 text-[10px] font-semibold text-[#5F6A6E] uppercase tracking-wider">#</th>
                                <th className="text-left py-2 px-3 text-[10px] font-semibold text-[#5F6A6E] uppercase tracking-wider">Wallet</th>
                                <th className="text-right py-2 px-3 text-[10px] font-semibold text-[#5F6A6E] uppercase tracking-wider">Balance</th>
                                <th className="text-right py-2 px-3 text-[10px] font-semibold text-[#5F6A6E] uppercase tracking-wider">Share</th>
                                <th className="text-center py-2 px-3 text-[10px] font-semibold text-[#5F6A6E] uppercase tracking-wider">Link</th>
                            </tr>
                        </thead>
                        <tbody>
                            {holdings.map((holder, index) => (
                                <tr
                                    key={holder.address}
                                    className="border-b border-[#1A2428]/50 hover:bg-[#1A2428]/30 transition-colors"
                                >
                                    <td className="py-2 px-3">
                                        <span className="text-xs text-[#5F6A6E]">{index + 1}</span>
                                    </td>
                                    <td className="py-2 px-3">
                                        <div className="flex items-center gap-2">
                                            {holder.isLiquidityPool ? (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#8C3A32]/10 text-[#8C3A32] border border-[#8C3A32]/20">
                                                    <Droplets className="w-3 h-3" />
                                                    Pool
                                                </span>
                                            ) : (
                                                <code className="text-xs text-[#9FA6A3] font-mono">
                                                    {truncateAddress(holder.address)}
                                                </code>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-2 px-3 text-right">
                                        <span className="text-xs text-[#E9E1D8] font-medium">
                                            {formatBalance(holder.balance)}
                                        </span>
                                    </td>
                                    <td className="py-2 px-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <div className="w-12 h-1.5 bg-[#0E1518] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-[#8C3A32] to-[#A04438]"
                                                    style={{ width: `${Math.min(holder.percentage, 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-[11px] text-[#9FA6A3] w-10 text-right">
                                                {holder.percentage.toFixed(1)}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                        {!holder.isLiquidityPool && (
                                            <a
                                                href={getSolscanAccountUrl(holder.address)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center w-6 h-6 rounded bg-[#0E1518] border border-[#2A3338] hover:border-[#8C3A32] transition-colors"
                                            >
                                                <ExternalLink className="w-3 h-3 text-[#5F6A6E]" />
                                            </a>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
