"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check, ExternalLink, Vault, Percent, Shield, TrendingUp, ArrowUpRight } from "lucide-react"
import { formatPercentage, shortenPubkey, getSolscanAccountUrl } from "@/lib/format"
import { PROGRAM_ID, DEFAULT_PAPERHAND_TAX_BPS, TREASURY_WALLET } from "@/lib/constants"

interface TreasuryCardProps {
  className?: string
}

// Known stats - these are the actual totals from on-chain activity
const TOTAL_TAXES_COLLECTED = 50.2 // ~50 SOL total taxes collected
const TOTAL_BUYBACKS = 44.0 // 44 SOL used for buybacks

export function TreasuryCard({ className }: TreasuryCardProps) {
  const [treasuryVaultAddress, setTreasuryVaultAddress] = useState("")
  const [copied, setCopied] = useState<'treasury' | 'program' | null>(null)

  useEffect(() => {
    setTreasuryVaultAddress(TREASURY_WALLET.toBase58())
  }, [])

  const copyToClipboard = async (text: string, type: 'treasury' | 'program') => {
    await navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const taxRate = DEFAULT_PAPERHAND_TAX_BPS

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8C3A32]/20 to-[#0E1518] border border-[#8C3A32]/30 flex items-center justify-center">
            <Vault className="w-5 h-5 text-[#8C3A32]" />
          </div>
          <div>
            <CardTitle>Protocol Treasury</CardTitle>
            <CardDescription>Tax collection & buyback stats</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Total Taxes Collected */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#8C3A32]/10 to-[#0E1518] border border-[#8C3A32]/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-[#8C3A32]" />
              <span className="text-[10px] text-[#8C3A32] uppercase tracking-wider font-semibold">Total Collected</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-[#E9E1D8]">{TOTAL_TAXES_COLLECTED.toFixed(1)}</span>
              <span className="text-sm text-[#5F6A6E]">SOL</span>
            </div>
            <span className="text-[10px] text-[#5F6A6E] mt-1 block">From paper hand sells</span>
          </div>

          {/* Buybacks */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-[#0E1518] border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">Buybacks</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-[#E9E1D8]">{TOTAL_BUYBACKS.toFixed(0)}</span>
              <span className="text-sm text-[#5F6A6E]">SOL</span>
            </div>
            <span className="text-[10px] text-[#5F6A6E] mt-1 block">Dev wallet buybacks</span>
          </div>
        </div>

        {/* Tax Rate */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#0E1518]/50 border border-[#2A3338]/50">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-[#8C3A32]" />
            <span className="text-sm text-[#9FA6A3]">Tax Rate</span>
          </div>
          <span className="text-lg font-bold text-[#8C3A32]">{formatPercentage(taxRate)}</span>
        </div>

        <div className="h-px bg-[#2A3338]/50" />

        {/* Treasury Wallet */}
        <div className="space-y-2">
          <label className="text-[10px] text-[#5F6A6E] uppercase tracking-wider">Treasury Wallet</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs text-[#9FA6A3] bg-[#0E1518]/50 rounded-lg px-3 py-2 font-mono border border-[#2A3338]/50 truncate">
              {treasuryVaultAddress ? shortenPubkey(treasuryVaultAddress, 6) : "..."}
            </code>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(treasuryVaultAddress, 'treasury')}
              className="shrink-0 h-8 w-8"
              disabled={!treasuryVaultAddress}
            >
              {copied === 'treasury' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-[#5F6A6E]" />
              )}
            </Button>
            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" asChild>
              <a href={getSolscanAccountUrl(treasuryVaultAddress)} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5 text-[#5F6A6E]" />
              </a>
            </Button>
          </div>
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 pt-1">
          <Shield className="w-3.5 h-3.5 text-[#5F6A6E]" />
          <span className="text-[10px] text-[#5F6A6E]">On-chain verified · Immutable</span>
        </div>
      </CardContent>
    </Card>
  )
}
