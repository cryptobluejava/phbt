"use client"

import { useState } from "react"
import { TradePanel } from "@/components/trade-panel"
import { PositionCard } from "@/components/position-card"
import { TreasuryCard } from "@/components/treasury-card"
import { TokenCard } from "@/components/token-card"
import { ActivityFeed } from "@/components/activity-feed"
import { Leaderboard } from "@/components/leaderboard"
import { ExploreSection } from "@/components/explore-section"
import { TooltipProvider } from "@/components/ui/tooltip"
import { TOKEN_MINT } from "@/lib/constants"

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleTradeComplete = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#0E1518]">
        <div className="max-w-7xl mx-auto px-6 py-12">

          {/* Hero section */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              {/* Geometric marker */}
              <div className="w-1 h-16 bg-[#8C3A32]" />
              <div>
                <h1 className="text-4xl font-medium text-[#E9E1D8] tracking-tight">
                  Paper Hand Bitch Tax
                </h1>
                <p className="text-[#9FA6A3] mt-2 text-lg">
                  Sell at a loss. Receive 50% less.
                </p>
              </div>
            </div>

            {/* Rule statement */}
            <div className="flex items-start gap-6 pl-5 border-l border-[#2A3338] max-w-2xl">
              <div className="space-y-4">
                <p className="text-sm text-[#9FA6A3] leading-relaxed">
                  When you sell below your cost basis, 50% of proceeds are routed to the protocol treasury.
                  Cost basis is tracked per-wallet using weighted average of platform purchases only.
                  Diamond hands pay nothing. Paper hands pay the price.
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141D21] border border-[#2A3338]">
                    <div className="w-2 h-2 rounded-full bg-[#8C3A32]" />
                    <span className="text-[#9FA6A3]">Loss = SOL out &lt; Cost basis</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141D21] border border-[#2A3338]">
                    <div className="w-2 h-2 rounded-full bg-[#8C3A32]" />
                    <span className="text-[#9FA6A3]">Penalty = 50% of proceeds</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141D21] border border-[#2A3338]">
                    <div className="w-2 h-2 rounded-full bg-[#E9E1D8]" />
                    <span className="text-[#9FA6A3]">Diamond hands = No tax</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Explore launched coins section */}
          <ExploreSection />

          {/* How it works section */}
          <div className="mt-16 p-8 rounded-2xl bg-[#141D21] border border-[#2A3338]">
            <h2 className="text-xl font-medium text-[#E9E1D8] mb-6">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#0E1518] border border-[#2A3338] flex items-center justify-center">
                  <span className="text-[#E9E1D8] font-medium">1</span>
                </div>
                <h3 className="text-[#E9E1D8] font-medium">Buy PHB</h3>
                <p className="text-sm text-[#9FA6A3]">
                  Your cost basis is tracked automatically. Every buy updates your weighted average cost per token.
                </p>
              </div>
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#0E1518] border border-[#2A3338] flex items-center justify-center">
                  <span className="text-[#E9E1D8] font-medium">2</span>
                </div>
                <h3 className="text-[#E9E1D8] font-medium">Hold or Sell</h3>
                <p className="text-sm text-[#9FA6A3]">
                  When you sell, we calculate if you&apos;re selling at a loss by comparing current price vs your cost basis.
                </p>
              </div>
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#0E1518] border border-[#8C3A32] flex items-center justify-center">
                  <span className="text-[#8C3A32] font-medium">!</span>
                </div>
                <h3 className="text-[#E9E1D8] font-medium">Paper Hand Tax</h3>
                <p className="text-sm text-[#9FA6A3]">
                  Selling at a loss? 50% of your SOL proceeds go to the treasury. Diamond hands keep 100%.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-16 pt-8 border-t border-[#2A3338]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-6 text-xs text-[#5F6A6E]">
                <span className="font-medium text-[#9FA6A3]">Paper Hand Bitch Tax</span>
                <span className="w-px h-3 bg-[#2A3338]" />
                <span>Solana Devnet</span>
                <span className="w-px h-3 bg-[#2A3338]" />
                <a href="#" className="hover:text-[#9FA6A3] transition-colors">Docs</a>
                <span className="w-px h-3 bg-[#2A3338]" />
                <a href="https://github.com/entresan1/Pumpfun-solana-smart-contract" target="_blank" rel="noopener noreferrer" className="hover:text-[#9FA6A3] transition-colors">GitHub</a>
              </div>
              <p className="text-xs text-[#5F6A6E]">
                Not financial advice. DYOR.
              </p>
            </div>
          </footer>
        </div>
      </div>
    </TooltipProvider>
  )
}
