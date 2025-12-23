"use client"

import { useState, useEffect, useCallback } from "react"
import { useConnection } from "@solana/wallet-adapter-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check, ExternalLink, Vault, Percent, Shield, RefreshCw } from "lucide-react"
import { formatLamportsToSol, formatPercentage, shortenPubkey, getSolscanAccountUrl } from "@/lib/format"
import { getCurveConfigPDA } from "@/lib/pdas"
import { fetchCurveConfig, CurveConfiguration } from "@/lib/solana"
import { PROGRAM_ID, DEFAULT_PAPERHAND_TAX_BPS, TREASURY_WALLET } from "@/lib/constants"

interface TreasuryCardProps {
  className?: string
}

export function TreasuryCard({ className }: TreasuryCardProps) {
  const { connection } = useConnection()

  const [config, setConfig] = useState<CurveConfiguration | null>(null)
  const [treasuryBalance, setTreasuryBalance] = useState(0)
  const [treasuryVaultAddress, setTreasuryVaultAddress] = useState("")
  const [copied, setCopied] = useState<'treasury' | 'program' | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [configPDA] = getCurveConfigPDA()
      const treasuryWallet = TREASURY_WALLET

      setTreasuryVaultAddress(treasuryWallet.toBase58())

      const [configData, balance] = await Promise.all([
        fetchCurveConfig(connection, configPDA),
        connection.getBalance(treasuryWallet).catch(() => 0)
      ])

      setConfig(configData)
      setTreasuryBalance(balance)
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false)
    }
  }, [connection])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  const copyToClipboard = async (text: string, type: 'treasury' | 'program') => {
    await navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const taxRate = config?.paperhandTaxBps || DEFAULT_PAPERHAND_TAX_BPS

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0E1518] border border-[#2A3338] flex items-center justify-center">
              <Vault className="w-5 h-5 text-[#9FA6A3]" />
            </div>
            <div>
              <CardTitle>Protocol Treasury</CardTitle>
              <CardDescription>Collected from paper hands</CardDescription>
            </div>
          </div>
          {isLoading && (
            <RefreshCw className="w-4 h-4 text-[#5F6A6E] animate-spin" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-5">
          {/* Treasury Balance - Featured */}
          <div className="p-5 rounded-xl bg-[#0E1518] border border-[#2A3338]">
            <span className="text-xs text-[#5F6A6E] uppercase tracking-wider block mb-2">Total Collected</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-medium text-[#E9E1D8] text-value">
                {formatLamportsToSol(treasuryBalance)}
              </span>
              <span className="text-lg text-[#5F6A6E]">SOL</span>
            </div>
          </div>

          {/* Tax Rate */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-[#0E1518] border border-[#2A3338]">
            <div className="flex items-center gap-3">
              <Percent className="w-5 h-5 text-[#8C3A32]" />
              <div>
                <span className="text-sm text-[#E9E1D8]">Paper Hand Tax Rate</span>
                <span className="text-xs text-[#5F6A6E] block">Applied on loss-making sells</span>
              </div>
            </div>
            <span className="text-2xl font-medium text-[#8C3A32] text-value">{formatPercentage(taxRate)}</span>
          </div>

          <div className="divider-line" />

          {/* Treasury Vault (PDA) */}
          <div className="space-y-2">
            <label className="text-label">Treasury Vault (PDA)</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm text-[#9FA6A3] bg-[#0E1518] rounded-lg px-3 py-2.5 font-mono border border-[#2A3338] truncate">
                {treasuryVaultAddress ? shortenPubkey(treasuryVaultAddress, 6) : "..."}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(treasuryVaultAddress, 'treasury')}
                className="shrink-0 h-9 w-9"
                disabled={!treasuryVaultAddress}
              >
                {copied === 'treasury' ? (
                  <Check className="w-4 h-4 text-[#E9E1D8]" />
                ) : (
                  <Copy className="w-4 h-4 text-[#5F6A6E]" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-9 w-9"
                asChild
              >
                <a href={getSolscanAccountUrl(treasuryVaultAddress)} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 text-[#5F6A6E]" />
                </a>
              </Button>
            </div>
          </div>

          {/* Program ID */}
          <div className="space-y-2">
            <label className="text-label">Program ID</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm text-[#9FA6A3] bg-[#0E1518] rounded-lg px-3 py-2.5 font-mono border border-[#2A3338] truncate">
                {shortenPubkey(PROGRAM_ID.toBase58(), 6)}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(PROGRAM_ID.toBase58(), 'program')}
                className="shrink-0 h-9 w-9"
              >
                {copied === 'program' ? (
                  <Check className="w-4 h-4 text-[#E9E1D8]" />
                ) : (
                  <Copy className="w-4 h-4 text-[#5F6A6E]" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-9 w-9"
                asChild
              >
                <a href={getSolscanAccountUrl(PROGRAM_ID.toBase58())} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 text-[#5F6A6E]" />
                </a>
              </Button>
            </div>
          </div>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <Shield className="w-4 h-4 text-[#5F6A6E]" />
            <span className="text-xs text-[#5F6A6E]">On-chain verified · Immutable</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
