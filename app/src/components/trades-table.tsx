"use client"

import { PublicKey } from "@solana/web3.js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, ExternalLink } from "lucide-react"
import { Trade } from "@/hooks/use-token-page-data"
import { getSolscanTxUrl } from "@/lib/format"

interface TradesTableProps {
    mint: PublicKey
    trades: Trade[]
    isLoading: boolean
    onRefresh: () => void
}

export function TradesTable({ mint, trades, isLoading, onRefresh }: TradesTableProps) {

    const getTypeBadge = (type: Trade["type"]) => {
        switch (type) {
            case "buy":
                return <Badge className="bg-green-900/30 text-green-400 border-green-500/30">🟢 Buy</Badge>
            case "sell":
                return <Badge className="bg-yellow-900/30 text-yellow-400 border-yellow-500/30">🔴 Sell</Badge>
            case "paperhand":
                return <Badge className="bg-[#8C3A32]/30 text-[#8C3A32] border-[#8C3A32]/30">💀 Paper Hand</Badge>
        }
    }

    const formatAmount = (amount: number) => {
        if (amount >= 1000000) return (amount / 1000000).toFixed(2) + "M"
        if (amount >= 1000) return (amount / 1000).toFixed(2) + "K"
        if (amount >= 1) return amount.toFixed(2)
        return amount.toFixed(6)
    }

    return (
        <Card>
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-8 bg-[#8C3A32]" />
                        <div>
                            <CardTitle className="text-lg">Recent Trades</CardTitle>
                            <p className="text-xs text-[#5F6A6E] mt-0.5">
                                Live transaction feed
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onRefresh}
                        disabled={isLoading}
                        className="p-2 rounded-lg hover:bg-[#1A2428] transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 text-[#9FA6A3] ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading && trades.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw className="w-6 h-6 text-[#5F6A6E] animate-spin" />
                    </div>
                ) : trades.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                        <div className="w-12 h-12 rounded-full bg-[#0E1518] border border-[#2A3338] flex items-center justify-center mx-auto">
                            <ExternalLink className="w-5 h-5 text-[#5F6A6E]" />
                        </div>
                        <p className="text-sm text-[#5F6A6E]">No trades yet</p>
                        <p className="text-xs text-[#5F6A6E]">Transactions will appear here after trading</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#2A3338]">
                                    <th className="text-left py-3 px-2 text-xs font-medium text-[#5F6A6E] uppercase tracking-wider">Account</th>
                                    <th className="text-left py-3 px-2 text-xs font-medium text-[#5F6A6E] uppercase tracking-wider">Type</th>
                                    <th className="text-right py-3 px-2 text-xs font-medium text-[#5F6A6E] uppercase tracking-wider">SOL</th>
                                    <th className="text-right py-3 px-2 text-xs font-medium text-[#5F6A6E] uppercase tracking-wider">Tokens</th>
                                    <th className="text-right py-3 px-2 text-xs font-medium text-[#5F6A6E] uppercase tracking-wider">Time</th>
                                    <th className="text-center py-3 px-2 text-xs font-medium text-[#5F6A6E] uppercase tracking-wider">Txn</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trades.map((trade) => (
                                    <tr
                                        key={trade.signature}
                                        className="border-b border-[#2A3338]/50 hover:bg-[#1A2428]/50 transition-colors"
                                    >
                                        <td className="py-3 px-2">
                                            <code className="text-sm text-[#9FA6A3] font-mono">{trade.account}</code>
                                        </td>
                                        <td className="py-3 px-2">
                                            {getTypeBadge(trade.type)}
                                        </td>
                                        <td className="py-3 px-2 text-right">
                                            <span className="text-sm text-[#E9E1D8] font-medium">
                                                {formatAmount(trade.solAmount)} SOL
                                            </span>
                                        </td>
                                        <td className="py-3 px-2 text-right">
                                            <span className="text-sm text-[#9FA6A3]">
                                                {formatAmount(trade.tokenAmount)}
                                            </span>
                                        </td>
                                        <td className="py-3 px-2 text-right">
                                            <span className="text-xs text-[#5F6A6E]">{trade.time}</span>
                                        </td>
                                        <td className="py-3 px-2 text-center">
                                            <a
                                                href={getSolscanTxUrl(trade.signature)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#0E1518] border border-[#2A3338] hover:border-[#8C3A32] transition-colors"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5 text-[#9FA6A3]" />
                                            </a>
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

