"use client"

import { useState, useEffect, useCallback } from "react"
import { useConnection } from "@solana/wallet-adapter-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TREASURY_WALLET, PROGRAM_ID } from "@/lib/constants"
import { RefreshCw, Radio } from "lucide-react"

interface Transaction {
  signature: string
  type: string
  amount: number
  time: string
  wallet: string
}

export function ActivityFeed() {
  const { connection } = useConnection()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true)
    try {
      // Get recent transactions for the program
      const signatures = await connection.getSignaturesForAddress(PROGRAM_ID, { limit: 10 })
      
      const txs: Transaction[] = []
      for (const sig of signatures.slice(0, 8)) {
        const timeDiff = Date.now() / 1000 - (sig.blockTime || 0)
        let timeStr = ""
        if (timeDiff < 60) timeStr = "just now"
        else if (timeDiff < 3600) timeStr = `${Math.floor(timeDiff / 60)}m ago`
        else if (timeDiff < 86400) timeStr = `${Math.floor(timeDiff / 3600)}h ago`
        else timeStr = `${Math.floor(timeDiff / 86400)}d ago`
        
        txs.push({
          signature: sig.signature,
          type: "TX",
          amount: 0,
          time: timeStr,
          wallet: sig.signature.slice(0, 4) + "..." + sig.signature.slice(-4),
        })
      }
      
      setTransactions(txs)
    } catch {
      // No transactions or error
      setTransactions([])
    } finally {
      setIsLoading(false)
    }
  }, [connection])

  useEffect(() => {
    fetchTransactions()
    const interval = setInterval(fetchTransactions, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [fetchTransactions])

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Activity</CardTitle>
          <div className="flex items-center gap-2">
            <Radio className="w-3 h-3 text-[#9FA6A3]" />
            <span className="text-xs text-[#5F6A6E]">Mainnet</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-5 h-5 text-[#5F6A6E] animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#0E1518] border border-[#2A3338] flex items-center justify-center mx-auto">
              <Radio className="w-5 h-5 text-[#5F6A6E]" />
            </div>
            <p className="text-sm text-[#5F6A6E]">No activity yet</p>
            <p className="text-xs text-[#5F6A6E]">Transactions will appear here after launch</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx, i) => (
              <a
                key={tx.signature}
                href={`https://solscan.io/tx/${tx.signature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg bg-[#0E1518] border border-[#2A3338] hover:border-[#5F6A6E] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-xs">
                    {tx.type}
                  </Badge>
                  <code className="text-sm text-[#9FA6A3] font-mono">{tx.wallet}</code>
                </div>
                <span className="text-xs text-[#5F6A6E]">{tx.time}</span>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
