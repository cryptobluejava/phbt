"use client"

import { PublicKey } from "@solana/web3.js"
import { RefreshCw, ExternalLink } from "lucide-react"
import { Trade } from "@/hooks/use-token-page-data"
import { getSolscanTxUrl } from "@/lib/format"

interface TradesTableProps {
    mint: PublicKey
    trades: Trade[]
    isLoading: boolean
    isRefreshing: boolean
    onRefresh: () => void
}

export function TradesTable({ mint, trades, isLoading, isRefreshing, onRefresh }: TradesTableProps) {

    const getTypeBadge = (type: Trade["type"]) => {
        switch (type) {
            case "buy":
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        Buy
                    </span>
                )
            case "sell":
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        Sell
                    </span>
                )
            case "paperhand":
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#8C3A32]/10 text-[#8C3A32] border border-[#8C3A32]/20">
                        💀 Tax
                    </span>
                )
        }
    }

    const formatAmount = (amount: number) => {
        if (amount >= 1000000) return (amount / 1000000).toFixed(2) + "M"
        if (amount >= 1000) return (amount / 1000).toFixed(1) + "K"
        if (amount >= 1) return amount.toFixed(2)
        return amount.toFixed(4)
    }

    return (
        <div className="p-4">
            {isLoading && trades.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-5 h-5 text-[#5F6A6E] animate-spin" />
                </div>
            ) : trades.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                    <ExternalLink className="w-8 h-8 text-[#3A4448] mx-auto" />
                    <p className="text-sm text-[#5F6A6E]">No trades yet</p>
                    <p className="text-xs text-[#3A4448]">Transactions will appear here after trading</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#1A2428]">
                                <th className="text-left py-2 px-3 text-[10px] font-semibold text-[#5F6A6E] uppercase tracking-wider">Account</th>
                                <th className="text-left py-2 px-3 text-[10px] font-semibold text-[#5F6A6E] uppercase tracking-wider">Type</th>
                                <th className="text-right py-2 px-3 text-[10px] font-semibold text-[#5F6A6E] uppercase tracking-wider">SOL</th>
                                <th className="text-right py-2 px-3 text-[10px] font-semibold text-[#5F6A6E] uppercase tracking-wider">Tokens</th>
                                <th className="text-right py-2 px-3 text-[10px] font-semibold text-[#5F6A6E] uppercase tracking-wider">Time</th>
                                <th className="text-center py-2 px-3 text-[10px] font-semibold text-[#5F6A6E] uppercase tracking-wider">Tx</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trades.map((trade) => (
                                <tr
                                    key={trade.signature}
                                    className="border-b border-[#1A2428]/50 hover:bg-[#1A2428]/30 transition-colors"
                                >
                                    <td className="py-2 px-3">
                                        <code className="text-xs text-[#9FA6A3] font-mono">{trade.account}</code>
                                    </td>
                                    <td className="py-2 px-3">
                                        {getTypeBadge(trade.type)}
                                    </td>
                                    <td className="py-2 px-3 text-right">
                                        <span className={`text-xs font-medium ${trade.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                                            {trade.type === 'buy' ? '+' : '-'}{formatAmount(trade.solAmount)}
                                        </span>
                                    </td>
                                    <td className="py-2 px-3 text-right">
                                        <span className="text-xs text-[#9FA6A3]">
                                            {formatAmount(trade.tokenAmount)}
                                        </span>
                                    </td>
                                    <td className="py-2 px-3 text-right">
                                        <span className="text-[11px] text-[#5F6A6E]">{trade.time}</span>
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                        <a
                                            href={getSolscanTxUrl(trade.signature)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center w-6 h-6 rounded bg-[#0E1518] border border-[#2A3338] hover:border-[#8C3A32] transition-colors"
                                        >
                                            <ExternalLink className="w-3 h-3 text-[#5F6A6E]" />
                                        </a>
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

