"use client"

import { useState, useEffect, useCallback } from "react"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { TooltipProvider } from "@/components/ui/tooltip"
import { formatLamportsToSol, formatTokenAmount, calculateCostBasisForSale, isLoss, calculateTax } from "@/lib/format"
import { getPoolPDA, getUserPositionPDA, getCurveConfigPDA } from "@/lib/pdas"
import { fetchPool, fetchUserPosition, fetchCurveConfig, calculateBuyOutput, calculateSellOutput, LiquidityPool, UserPosition, CurveConfiguration } from "@/lib/solana"
import { createSwapTransaction } from "@/lib/program"
import { AlertTriangle, ArrowDown, ArrowUp, Zap, RefreshCw } from "lucide-react"

interface TradePanelProps {
  mint: PublicKey | null
  onTradeComplete?: () => void
  className?: string
}

export function TradePanel({ mint, onTradeComplete, className }: TradePanelProps) {
  const { connection } = useConnection()
  const { publicKey, connected, sendTransaction } = useWallet()

  const [activeTab, setActiveTab] = useState("buy")
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(true)

  const [pool, setPool] = useState<LiquidityPool | null>(null)
  const [position, setPosition] = useState<UserPosition | null>(null)
  const [config, setConfig] = useState<CurveConfiguration | null>(null)
  const [walletBalance, setWalletBalance] = useState(0)

  const [estimatedOutput, setEstimatedOutput] = useState(0)
  const [costBasis, setCostBasis] = useState(0)
  const [isAtLoss, setIsAtLoss] = useState(false)
  const [taxAmount, setTaxAmount] = useState(0)

  const fetchData = useCallback(async () => {
    setIsDataLoading(true)
    try {
      if (mint) {
        const [poolPDA] = getPoolPDA(mint)
        const [configPDA] = getCurveConfigPDA()

        const [poolData, configData] = await Promise.all([
          fetchPool(connection, poolPDA),
          fetchCurveConfig(connection, configPDA)
        ])

        setPool(poolData)
        setConfig(configData)

        if (publicKey) {
          const [positionPDA] = getUserPositionPDA(poolPDA, publicKey)
          const [positionData, balance] = await Promise.all([
            fetchUserPosition(connection, positionPDA),
            connection.getBalance(publicKey)
          ])
          setPosition(positionData)
          setWalletBalance(balance)
        }
      }
    } catch {
      // Silent fail
    } finally {
      setIsDataLoading(false)
    }
  }, [connection, mint, publicKey])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [fetchData])

  // Calculate estimates based on real pool data
  useEffect(() => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0 || !pool) {
      setEstimatedOutput(0)
      setCostBasis(0)
      setIsAtLoss(false)
      setTaxAmount(0)
      return
    }

    const feePct = config?.fees || 1
    const taxBps = config?.paperhandTaxBps || 5000

    if (activeTab === "buy") {
      const solAmount = Number(amount) * LAMPORTS_PER_SOL
      const tokensOut = calculateBuyOutput(
        solAmount,
        pool.reserveTwo.toNumber(),
        pool.reserveOne.toNumber(),
        feePct
      )
      setEstimatedOutput(tokensOut)
      setCostBasis(0)
      setIsAtLoss(false)
      setTaxAmount(0)
    } else {
      const tokenAmount = Number(amount) * 1_000_000
      const solOut = calculateSellOutput(
        tokenAmount,
        pool.reserveOne.toNumber(),
        pool.reserveTwo.toNumber(),
        feePct
      )
      setEstimatedOutput(solOut)

      if (position && position.totalTokens.toNumber() > 0) {
        const basis = calculateCostBasisForSale(
          position.totalSol.toNumber(),
          position.totalTokens.toNumber(),
          tokenAmount
        )
        setCostBasis(basis)

        const atLoss = isLoss(solOut, basis)
        setIsAtLoss(atLoss)

        if (atLoss) {
          const tax = calculateTax(solOut, taxBps)
          setTaxAmount(tax)
        } else {
          setTaxAmount(0)
        }
      } else {
        setCostBasis(0)
        setIsAtLoss(false)
        setTaxAmount(0)
      }
    }
  }, [amount, activeTab, pool, position, config])

  const handleMaxClick = () => {
    if (activeTab === "buy") {
      // Leave some for fees
      const maxSol = Math.max(0, (walletBalance - 0.01 * LAMPORTS_PER_SOL)) / LAMPORTS_PER_SOL
      setAmount(maxSol.toFixed(4))
    } else {
      if (position) {
        const maxTokens = position.totalTokens.toNumber() / 1_000_000
        setAmount(maxTokens.toString())
      }
    }
  }

  const handleTrade = async () => {
    if (!connected || !publicKey || !sendTransaction) {
      alert("Please connect your wallet")
      return
    }

    if (!pool || !mint) {
      alert("Pool not available yet")
      return
    }

    const numAmount = Number(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      alert("Please enter a valid amount")
      return
    }

    setIsLoading(true)

    try {
      // Calculate amount in smallest units
      let amountInSmallestUnit: bigint
      let style: number

      if (activeTab === "buy") {
        // BUY: amount is in SOL, convert to lamports
        amountInSmallestUnit = BigInt(Math.floor(numAmount * LAMPORTS_PER_SOL))
        style = 2 // BUY
      } else {
        // SELL: amount is in tokens, convert to smallest unit (assuming 6 decimals)
        amountInSmallestUnit = BigInt(Math.floor(numAmount * 1_000_000))
        style = 1 // SELL
      }

      // Create the swap transaction
      const transaction = await createSwapTransaction(
        connection,
        { amount: amountInSmallestUnit, style },
        mint,
        publicKey
      )

      // Send transaction via wallet adapter
      const signature = await sendTransaction(transaction, connection)

      // Wait for confirmation
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
      await connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature,
      })

      console.log("Transaction confirmed:", signature)

      // Refresh data
      onTradeComplete?.()
      setAmount("")
      fetchData()

    } catch (error: unknown) {
      console.error("Swap error:", error)
      const errorMessage = error instanceof Error ? error.message : "Transaction failed"
      alert(`Swap failed: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const netSolReceived = estimatedOutput - taxAmount
  const positionTokens = position?.totalTokens.toNumber() || 0

  return (
    <TooltipProvider>
      <Card className={className}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Trade</CardTitle>
            <div className="flex items-center gap-2">
              {isDataLoading && <RefreshCw className="w-4 h-4 text-[#5F6A6E] animate-spin" />}
              <Zap className="w-4 h-4 text-[#5F6A6E]" />
              <span className="text-xs text-[#5F6A6E]">Bonding Curve</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!pool && isDataLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-5 h-5 text-[#5F6A6E] animate-spin" />
            </div>
          ) : !pool ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-sm text-[#5F6A6E]">Pool not initialized</p>
              <p className="text-xs text-[#5F6A6E]">Trading available after launch</p>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="buy" className="flex items-center gap-2">
                  <ArrowUp className="w-4 h-4" />
                  Buy
                </TabsTrigger>
                <TabsTrigger value="sell" className="flex items-center gap-2">
                  <ArrowDown className="w-4 h-4" />
                  Sell
                </TabsTrigger>
              </TabsList>

              <TabsContent value="buy" className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-label">You Pay</label>
                    <span className="text-xs text-[#5F6A6E]">
                      Balance: {formatLamportsToSol(walletBalance)} SOL
                    </span>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pr-20 text-value text-lg"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={handleMaxClick}
                      >
                        MAX
                      </Button>
                      <span className="text-sm text-[#5F6A6E]">SOL</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="w-10 h-10 rounded-full bg-[#0E1518] border border-[#2A3338] flex items-center justify-center">
                    <ArrowDown className="w-4 h-4 text-[#5F6A6E]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-label">You Receive</label>
                  <div className="h-14 flex items-center justify-between px-4 rounded-xl bg-[#0E1518] border border-[#2A3338]">
                    <span className="text-[#E9E1D8] text-lg text-value">
                      {estimatedOutput > 0 ? formatTokenAmount(estimatedOutput) : "0.00"}
                    </span>
                    <span className="text-sm text-[#5F6A6E]">PHB</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-[#0E1518] border border-[#2A3338] space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#5F6A6E]">Slippage</span>
                    <span className="text-[#9FA6A3]">1%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#5F6A6E]">Platform fee</span>
                    <span className="text-[#9FA6A3]">{config?.fees || 1}%</span>
                  </div>
                </div>

                <Button
                  className="w-full h-12"
                  size="lg"
                  onClick={handleTrade}
                  disabled={!connected || !amount || Number(amount) <= 0 || isLoading}
                >
                  {isLoading ? "Processing..." : !connected ? "Connect Wallet" : "Buy PHB"}
                </Button>
              </TabsContent>

              <TabsContent value="sell" className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-label">You Sell</label>
                    <span className="text-xs text-[#5F6A6E]">
                      Position: {formatTokenAmount(positionTokens)} PHB
                    </span>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pr-20 text-value text-lg"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={handleMaxClick}
                        disabled={positionTokens === 0}
                      >
                        MAX
                      </Button>
                      <span className="text-sm text-[#5F6A6E]">PHB</span>
                    </div>
                  </div>
                </div>

                {/* Tax calculation block */}
                <div className={`rounded-xl border bg-[#0E1518] p-5 space-y-4 transition-colors ${isAtLoss ? 'border-[#8C3A32]' : 'border-[#2A3338]'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-label">Paper Hand Check</span>
                    <Badge variant={isAtLoss ? "penalty" : "secondary"}>
                      {isAtLoss ? "LOSS DETECTED" : "NO LOSS"}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#9FA6A3]">Your cost basis</span>
                      <span className="text-[#E9E1D8] text-value">{formatLamportsToSol(costBasis)} SOL</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-[#9FA6A3]">Current value</span>
                      <span className="text-[#E9E1D8] text-value">{formatLamportsToSol(estimatedOutput)} SOL</span>
                    </div>

                    {isAtLoss && (
                      <>
                        <div className="divider-accent" />
                        <div className="flex justify-between text-sm">
                          <span className="text-[#8C3A32] flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Paper Hand Tax (50%)
                          </span>
                          <span className="text-[#8C3A32] text-value font-medium">−{formatLamportsToSol(taxAmount)} SOL</span>
                        </div>
                      </>
                    )}

                    <div className="divider-line pt-2" />

                    <div className="flex justify-between pt-2">
                      <span className="text-[#E9E1D8] font-medium">You receive</span>
                      <span className={`font-medium text-lg text-value ${isAtLoss ? 'text-[#8C3A32]' : 'text-[#E9E1D8]'}`}>
                        {formatLamportsToSol(Math.max(0, netSolReceived))} SOL
                      </span>
                    </div>
                  </div>
                </div>

                {isAtLoss && (
                  <div className="flex items-start gap-3 p-3 rounded-lg border-l-2 border-[#8C3A32] bg-[#0E1518]">
                    <AlertTriangle className="w-5 h-5 text-[#8C3A32] shrink-0 mt-0.5" />
                    <p className="text-sm text-[#9FA6A3]">
                      Selling below your cost basis triggers a <span className="text-[#8C3A32] font-medium">50% penalty</span> routed to protocol treasury.
                    </p>
                  </div>
                )}

                <Button
                  className="w-full h-12"
                  size="lg"
                  variant={isAtLoss ? "danger" : "default"}
                  onClick={handleTrade}
                  disabled={!connected || !amount || Number(amount) <= 0 || isLoading || positionTokens === 0}
                >
                  {isLoading ? "Processing..." :
                    !connected ? "Connect Wallet" :
                      positionTokens === 0 ? "No Position" :
                        isAtLoss ? `Sell (50% Tax Applied)` : "Sell PHB"}
                </Button>
              </TabsContent>
            </Tabs>
          )}

          {!connected && (
            <p className="text-center text-sm text-[#5F6A6E]">Connect wallet to trade</p>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
