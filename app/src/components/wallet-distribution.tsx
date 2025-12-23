"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, ExternalLink, Droplets, Wallet } from "lucide-react"
import { WalletHolding } from "@/hooks/use-token-page-data"
import { getSolscanAccountUrl } from "@/lib/format"

interface WalletDistributionProps {
    holdings: WalletHolding[]
    isLoading: boolean
    onRefresh: () => void
}

export function WalletDistribution({ holdings, isLoading, onRefresh }: WalletDistributionProps) {

    const formatBalance = (balance: number) => {
        if (balance >= 1_000_000) return (balance / 1_000_000).toFixed(2) + "M"
        if (balance >= 1_000) return (balance / 1_000).toFixed(2) + "K"
        return balance.toFixed(2)
    }

    const truncateAddress = (address: string) => {
        if (address === "Liquidity Pool") return address
        return address.slice(0, 4) + "..." + address.slice(-4)
    }

    return (
        <Card>
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-8 bg-[#8C3A32]" />
                        <div>
                            <CardTitle className="text-lg">Token Distribution</CardTitle>
                            <p className="text-xs text-[#5F6A6E] mt-0.5">
                                Top 10 holders
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onRefresh}
                        disabled={isLoading}
                        className="p-2 rounded-lg hover:bg-[#1A2428] transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 text-[#9FA6A3] ${isLoading ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading && holdings.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw className="w-6 h-6 text-[#5F6A6E] animate-spin" />
                    </div>
                ) : holdings.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                        <div className="w-12 h-12 rounded-full bg-[#0E1518] border border-[#2A3338] flex items-center justify-center mx-auto">
                            <Wallet className="w-5 h-5 text-[#5F6A6E]" />
                        </div>
                        <p className="text-sm text-[#5F6A6E]">No holders found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#2A3338]">
                                    <th className="text-left py-3 px-2 text-xs font-medium text-[#5F6A6E] uppercase tracking-wider">#</th>
                                    <th className="text-left py-3 px-2 text-xs font-medium text-[#5F6A6E] uppercase tracking-wider">Wallet</th>
                                    <th className="text-right py-3 px-2 text-xs font-medium text-[#5F6A6E] uppercase tracking-wider">Balance</th>
                                    <th className="text-right py-3 px-2 text-xs font-medium text-[#5F6A6E] uppercase tracking-wider">%</th>
                                    <th className="text-center py-3 px-2 text-xs font-medium text-[#5F6A6E] uppercase tracking-wider">Link</th>
                                </tr>
                            </thead>
                            <tbody>
                                {holdings.map((holder, index) => (
                                    <tr
                                        key={holder.address}
                                        className="border-b border-[#2A3338]/50 hover:bg-[#1A2428]/50 transition-colors"
                                    >
                                        <td className="py-3 px-2">
                                            <span className="text-sm text-[#5F6A6E]">{index + 1}</span>
                                        </td>
                                        <td className="py-3 px-2">
                                            <div className="flex items-center gap-2">
                                                {holder.isLiquidityPool ? (
                                                    <>
                                                        <Droplets className="w-4 h-4 text-[#8C3A32]" />
                                                        <Badge className="bg-[#8C3A32]/20 text-[#8C3A32] border-[#8C3A32]/30">
                                                            Liquidity Pool
                                                        </Badge>
                                                    </>
                                                ) : (
                                                    <code className="text-sm text-[#9FA6A3] font-mono">
                                                        {truncateAddress(holder.address)}
                                                    </code>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-2 text-right">
                                            <span className="text-sm text-[#E9E1D8] font-medium">
                                                {formatBalance(holder.balance)}
                                            </span>
                                        </td>
                                        <td className="py-3 px-2 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="w-16 h-2 bg-[#0E1518] rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-[#8C3A32] to-[#A04438]"
                                                        style={{ width: `${Math.min(holder.percentage, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm text-[#9FA6A3] w-14 text-right">
                                                    {holder.percentage.toFixed(2)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-2 text-center">
                                            {!holder.isLiquidityPool && (
                                                <a
                                                    href={getSolscanAccountUrl(holder.address)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#0E1518] border border-[#2A3338] hover:border-[#8C3A32] transition-colors"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5 text-[#9FA6A3]" />
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
