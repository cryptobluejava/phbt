"use client"

import { useState, useEffect, useCallback } from "react"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { formatLamportsToSol, formatTokenAmount } from "@/lib/format"
import { getPoolPDA, getUserPositionPDA } from "@/lib/pdas"
import { fetchPool, fetchUserPosition, LiquidityPool, UserPosition, calculateSellOutput } from "@/lib/solana"
import { TrendingDown, TrendingUp, Wallet, Info, AlertTriangle, RefreshCw } from "lucide-react"

interface PositionCardProps {
  mint: PublicKey | null
  className?: string
}

export function PositionCard({ mint, className }: PositionCardProps) {
  const { connection } = useConnection()
  const { publicKey, connected } = useWallet()

  const [position, setPosition] = useState<UserPosition | null>(null)
  const [pool, setPool] = useState<LiquidityPool | null>(null)
  const [totalSupply, setTotalSupply] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!mint || !publicKey) {
      setPosition(null)
      setPool(null)
      setTotalSupply(0)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const [poolPDA] = getPoolPDA(mint)
      const [positionPDA] = getUserPositionPDA(poolPDA, publicKey)

      const [poolData, positionData, supplyData] = await Promise.all([
        fetchPool(connection, poolPDA),
        fetchUserPosition(connection, positionPDA),
        connection.getTokenSupply(mint)
      ])

      setPool(poolData)
      setPosition(positionData)
      setTotalSupply(supplyData.value.uiAmount || 0)
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false)
    }
  }, [connection, mint, publicKey])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [fetchData])

  // Calculate values from real data only
  const totalTokens = position?.totalTokens.toNumber() || 0
  const totalSol = position?.totalSol.toNumber() || 0

  // Calculate current value based on pool reserves
  let currentValue = 0
  if (pool && totalTokens > 0) {
    currentValue = calculateSellOutput(
      totalTokens,
      pool.reserveOne.toNumber(),
      pool.reserveTwo.toNumber(),
      1 // 1% fee
    )
  }

  // Market Cap Calculations
  // Avoid division by zero
  const totalTokensVal = totalTokens / 1_000_000 // atomic -> ui
  const totalSolVal = totalSol / LAMPORTS_PER_SOL // lamports -> SOL

  const avgCostPerToken = totalTokensVal > 0 ? totalSolVal / totalTokensVal : 0

  // Entry Market Cap = Avg Price (SOL) * Total Supply
  const entryMC = avgCostPerToken * totalSupply

  // Break Even MC = Entry MC / (1 - fee) calculation to return same SOL
  // Fee is 1% for sells. Selling inputs tokens.
  // We want (SellOutputSOL) = TotalSolVal
  // SellOutputSOL = (Tokens * Price * (1-fee)) 
  // We need Price * Tokens * 0.99 = Cost
  // Price * Tokens = Cost / 0.99
  // Market Cap = Price * Supply
  // BreakEvenMC = (Cost / Tokens / 0.99) * Supply = (AvgCost / 0.99) * Supply = EntryMC / 0.99
  const breakEvenMC = entryMC > 0 ? entryMC / 0.99 : 0

  const pnl = currentValue - totalSol
  const pnlPercent = totalSol > 0 ? (pnl / totalSol) * 100 : 0
  const isProfit = pnl >= 0

  if (!connected) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0E1518] border border-[#2A3338] flex items-center justify-center">
              <Wallet className="w-5 h-5 text-[#5F6A6E]" />
            </div>
            <div>
              <CardTitle>Your Position</CardTitle>
              <CardDescription>On-curve cost basis tracking</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#0E1518] border border-[#2A3338] flex items-center justify-center mx-auto">
              <Wallet className="w-8 h-8 text-[#5F6A6E]" />
            </div>
            <p className="text-[#5F6A6E] text-sm">Connect wallet to view your position</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatMC = (val: number) => {
    if (val >= 1000) return `${(val / 1000).toFixed(2)}K SOL`
    return `${val.toFixed(2)} SOL`
  }

  return (
    <TooltipProvider>
      <Card className={className}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0E1518] border border-[#2A3338] flex items-center justify-center">
                <Wallet className="w-5 h-5 text-[#9FA6A3]" />
              </div>
              <div>
                <CardTitle>Your Position</CardTitle>
                <CardDescription>On-curve cost basis tracking</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isLoading && (
                <RefreshCw className="w-4 h-4 text-[#5F6A6E] animate-spin" />
              )}
              {totalTokens > 0 && (
                <Badge variant={isProfit ? "secondary" : "penalty"}>
                  {isProfit ? "IN PROFIT" : "AT LOSS"}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {totalTokens === 0 ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#0E1518] border border-[#2A3338] flex items-center justify-center mx-auto">
                <Wallet className="w-5 h-5 text-[#5F6A6E]" />
              </div>
              <p className="text-[#5F6A6E] text-sm">No position yet</p>
              <p className="text-xs text-[#5F6A6E]">Buy tokens to establish your position</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Holdings */}
              <div className="p-4 rounded-xl bg-[#0E1518] border border-[#2A3338]">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-[#5F6A6E]">Holdings</span>
                  <span className="text-xl font-medium text-[#E9E1D8] text-value">
                    {formatTokenAmount(totalTokens)} PHB
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#5F6A6E]">Total Cost</span>
                  <span className="text-lg text-[#E9E1D8] text-value">
                    {formatLamportsToSol(totalSol)} SOL
                  </span>
                </div>
              </div>

              {/* Cost basis details - REMOVED */}

              <div className="divider-line" />

              {/* P&L Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#5F6A6E]">Current Value</span>
                  <span className="text-[#E9E1D8] text-value">{formatLamportsToSol(currentValue)} SOL</span>
                </div>

                <div className={`p-4 rounded-xl border ${isProfit ? 'bg-[#0E1518] border-[#2A3338]' : 'bg-[#0E1518] border-[#8C3A32]'}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {isProfit ? (
                        <TrendingUp className="w-5 h-5 text-[#9FA6A3]" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-[#8C3A32]" />
                      )}
                      <span className="text-sm text-[#9FA6A3]">Unrealized P&L</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-lg font-medium text-value ${isProfit ? 'text-[#E9E1D8]' : 'text-[#8C3A32]'}`}>
                        {isProfit ? '+' : ''}{formatLamportsToSol(pnl)} SOL
                      </span>
                      <span className={`text-xs ml-2 ${isProfit ? 'text-[#9FA6A3]' : 'text-[#8C3A32]'}`}>
                        ({pnlPercent > 0 ? '+' : ''}{pnlPercent.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Penalty warning */}
                {!isProfit && (
                  <div className="flex items-start gap-3 p-3 rounded-lg border-l-2 border-[#8C3A32] bg-[#0E1518]">
                    <AlertTriangle className="w-5 h-5 text-[#8C3A32] shrink-0 mt-0.5" />
                    <p className="text-sm text-[#9FA6A3]">
                      Selling now triggers <span className="text-[#8C3A32] font-medium">50% penalty</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Info note */}
              <p className="text-xs text-[#5F6A6E] text-center flex items-center justify-center gap-1">
                <Info className="w-3 h-3" />
                Only on-platform trades are tracked
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
