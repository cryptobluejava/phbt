"use client"

import { useState, useEffect } from "react"
import { PublicKey } from "@solana/web3.js"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, DollarSign, AlertCircle } from "lucide-react"
import { getMeteoraFeeClaimUrl } from "@/lib/program"
import { PROGRAM_ID, POOL_SEED_PREFIX, TREASURY_WALLET } from "@/lib/constants"

interface CreatorFeesCardProps {
  mint: PublicKey
  tokenCreator?: string | null
}

export function CreatorFeesCard({ mint, tokenCreator }: CreatorFeesCardProps) {
  const { publicKey } = useWallet()
  const { connection } = useConnection()
  const [isCreator, setIsCreator] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Check if current user is the token creator
  useEffect(() => {
    if (publicKey && tokenCreator) {
      setIsCreator(publicKey.toBase58() === tokenCreator)
      setLoading(false)
    } else {
      setLoading(false)
    }
  }, [publicKey, tokenCreator])

  // Derive the pool address
  const [poolPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from(POOL_SEED_PREFIX), mint.toBuffer()],
    PROGRAM_ID
  )

  // If not the creator or not connected, show minimal info
  if (!publicKey || !isCreator) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="w-5 h-5 text-[#8C3A32]" />
          Creator Earnings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Fee Sources */}
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-[#0E1518] border border-[#2A3338]">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#8C3A32]/20 flex items-center justify-center shrink-0">
                <span className="text-sm">💰</span>
              </div>
              <div>
                <p className="text-sm font-medium text-[#E9E1D8]">Paper Hand Tax Revenue</p>
                <p className="text-xs text-[#9FA6A3] mt-1">
                  50% tax on loss-based sells goes to the platform treasury.
                </p>
                <a
                  href={`https://solscan.io/account/${TREASURY_WALLET.toBase58()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#8C3A32] hover:text-[#A04438] inline-flex items-center gap-1 mt-2"
                >
                  View Treasury <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#0E1518] border border-[#2A3338]">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#8C3A32]/20 flex items-center justify-center shrink-0">
                <span className="text-sm">📈</span>
              </div>
              <div>
                <p className="text-sm font-medium text-[#E9E1D8]">Trading Fees (1%)</p>
                <p className="text-xs text-[#9FA6A3] mt-1">
                  Platform fee on all trades goes to the treasury.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-3 rounded-lg bg-[#8C3A32]/10 border border-[#8C3A32]/30">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-[#8C3A32] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-[#E9E1D8] font-medium">Creator Fee Distribution</p>
              <p className="text-xs text-[#9FA6A3] mt-1">
                All fees from your token's trading activity go to the platform treasury.
                Create a Meteora pool to earn LP fees directly to your wallet.
              </p>
            </div>
          </div>
        </div>

        {/* External Links */}
        <div className="space-y-2">
          <a
            href={getMeteoraFeeClaimUrl(publicKey.toBase58())}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 text-sm rounded-lg bg-[#2A3338] text-[#E9E1D8] hover:bg-[#3A4348] transition-colors flex items-center justify-center gap-2"
          >
            <span>View Meteora Portfolio</span>
            <ExternalLink className="w-4 h-4" />
          </a>
          <a
            href={`https://solscan.io/account/${poolPDA.toBase58()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 text-sm rounded-lg bg-[#0E1518] border border-[#2A3338] text-[#9FA6A3] hover:text-[#E9E1D8] hover:border-[#3A4348] transition-colors flex items-center justify-center gap-2"
          >
            <span>View Pool on Solscan</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </CardContent>
    </Card>
  )
}

