"use client"

import { useState } from "react"
import { PublicKey } from "@solana/web3.js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, ExternalLink, RefreshCw, Globe, Twitter, Send } from "lucide-react"
import { TokenMetadata } from "@/hooks/use-token-page-data"
import { getSolscanTokenUrl } from "@/lib/format"
import { IS_MAINNET } from "@/lib/constants"

interface TokenCardProps {
  mint: PublicKey
  metadata: TokenMetadata | null
  isLoading: boolean
}

// Format large numbers: 1,000,000,000 -> "1B", 500,000,000 -> "500M"
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

export function TokenCard({ mint, metadata, isLoading }: TokenCardProps) {
  const [copiedCA, setCopiedCA] = useState(false)
  const [imageError, setImageError] = useState(false)

  const copyCA = async () => {
    await navigator.clipboard.writeText(mint.toBase58())
    setCopiedCA(true)
    setTimeout(() => setCopiedCA(false), 2000)
  }

  const displayName = metadata?.name || "Loading..."
  const displaySymbol = metadata?.symbol || "..."

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {metadata?.image && !imageError ? (
              <img
                src={metadata.image}
                alt={displayName}
                className="w-12 h-12 rounded-full object-cover border border-[#2A3338]"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8C3A32] to-[#A04438] flex items-center justify-center border border-[#2A3338]">
                <span className="text-[#E9E1D8] font-bold text-lg">{displaySymbol.slice(0, 2)}</span>
              </div>
            )}
            <div>
              <CardTitle className="text-xl">{displayName}</CardTitle>
              <span className="text-sm text-[#5F6A6E]">${displaySymbol}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isLoading && (
              <RefreshCw className="w-4 h-4 text-[#5F6A6E] animate-spin" />
            )}
            <Badge variant="secondary" className={IS_MAINNET ? "border-green-500 text-green-500 bg-transparent" : "border-[#8C3A32] text-[#8C3A32] bg-transparent"}>{IS_MAINNET ? "MAINNET" : "DEVNET"}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* CA Section */}
        <div className="space-y-2">
          <label className="text-label">Contract Address (CA)</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm bg-[#0E1518] rounded-lg px-3 py-2.5 font-mono border border-[#2A3338] truncate text-[#9FA6A3]">
              {mint.toBase58()}
            </code>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyCA}
              className="shrink-0 h-9 w-9 hover:bg-[#1A2428] hover:text-[#E9E1D8]"
            >
              {copiedCA ? (
                <Check className="w-4 h-4 text-[#E9E1D8]" />
              ) : (
                <Copy className="w-4 h-4 text-[#5F6A6E]" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-9 w-9 hover:bg-[#1A2428] hover:text-[#E9E1D8]"
              asChild
            >
              <a href={getSolscanTokenUrl(mint.toBase58())} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 text-[#5F6A6E]" />
              </a>
            </Button>
          </div>
        </div>

        {/* Social Links - only show if any exist */}
        {(metadata?.website || metadata?.twitter || metadata?.telegram) && (
          <>
            <div className="divider-line" />
            <div className="flex items-center gap-2">
              {metadata?.website && (
                <a
                  href={metadata.website.startsWith('http') ? metadata.website : `https://${metadata.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0E1518] border border-[#2A3338] hover:border-[#8C3A32] transition-colors"
                >
                  <Globe className="w-4 h-4 text-[#9FA6A3]" />
                  <span className="text-sm text-[#9FA6A3]">Website</span>
                </a>
              )}
              {metadata?.twitter && (
                <a
                  href={metadata.twitter.startsWith('http') ? metadata.twitter : `https://twitter.com/${metadata.twitter.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0E1518] border border-[#2A3338] hover:border-[#8C3A32] transition-colors"
                >
                  <Twitter className="w-4 h-4 text-[#9FA6A3]" />
                  <span className="text-sm text-[#9FA6A3]">Twitter</span>
                </a>
              )}
              {metadata?.telegram && (
                <a
                  href={metadata.telegram.startsWith('http') ? metadata.telegram : `https://t.me/${metadata.telegram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0E1518] border border-[#2A3338] hover:border-[#8C3A32] transition-colors"
                >
                  <Send className="w-4 h-4 text-[#9FA6A3]" />
                  <span className="text-sm text-[#9FA6A3]">Telegram</span>
                </a>
              )}
            </div>
          </>
        )}

        <div className="divider-line" />

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-[#0E1518] border border-[#2A3338]">
            <span className="text-xs text-[#5F6A6E] block mb-1">Total Supply</span>
            <span className="text-sm text-[#E9E1D8] text-value md:text-base">
              {metadata ? formatSupply(metadata.totalSupply) : "--"}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-[#0E1518] border border-[#2A3338]">
            <span className="text-xs text-[#5F6A6E] block mb-1">Decimals</span>
            <span className="text-sm text-[#E9E1D8] text-value md:text-base">{metadata?.decimals ?? "--"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
