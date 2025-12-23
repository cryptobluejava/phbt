"use client"

import { useState, useEffect, useCallback } from "react"
import { useConnection } from "@solana/wallet-adapter-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { TREASURY_WALLET } from "@/lib/constants"
import { formatLamportsToSol } from "@/lib/format"
import { Skull, RefreshCw, TrendingDown } from "lucide-react"

export function Leaderboard() {
  const { connection } = useConnection()
  const [treasuryBalance, setTreasuryBalance] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const balance = await connection.getBalance(TREASURY_WALLET)
      setTreasuryBalance(balance)
    } catch {
      // Error fetching
    } finally {
      setIsLoading(false)
    }
  }, [connection])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Skull className="w-5 h-5 text-[#8C3A32]" />
          <div>
            <CardTitle className="text-base">Hall of Paper Hands</CardTitle>
            <CardDescription>Top penalty payers</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-5 h-5 text-[#5F6A6E] animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-[#0E1518] border border-[#2A3338]">
                <span className="text-xs text-[#5F6A6E] block mb-1">Treasury Balance</span>
                <span className="text-lg font-medium text-[#E9E1D8] text-value">
                  {formatLamportsToSol(treasuryBalance)} SOL
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#0E1518] border border-[#2A3338]">
                <span className="text-xs text-[#5F6A6E] block mb-1">Penalty Rate</span>
                <span className="text-lg font-medium text-[#8C3A32] text-value">50%</span>
              </div>
            </div>

            <div className="divider-line" />

            {/* Leaderboard - empty until we have data */}
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#0E1518] border border-[#2A3338] flex items-center justify-center mx-auto">
                <TrendingDown className="w-5 h-5 text-[#5F6A6E]" />
              </div>
              <p className="text-sm text-[#5F6A6E]">No paper hands yet</p>
              <p className="text-xs text-[#5F6A6E]">Leaderboard updates after first penalty</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
