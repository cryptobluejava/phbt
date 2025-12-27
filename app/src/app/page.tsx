"use client"

import { useState, useEffect } from "react"
import { ExploreSection } from "@/components/explore-section"
import { TreasuryCard } from "@/components/treasury-card"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Download, Zap, Shield, TrendingUp, Github, FileText, Twitter } from "lucide-react"
import Link from "next/link"

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [canInstall, setCanInstall] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setCanInstall(true)
    }
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setCanInstall(false)
    }
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setCanInstall(false)
    setDeferredPrompt(null)
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#0E1518]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

          {/* Hero Section - Slick */}
          <div className="mb-12 sm:mb-16">
            {/* Main headline */}
            <div className="relative mb-8">
              <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-[#8C3A32] via-[#8C3A32] to-transparent rounded-full" />
              <h1 className="text-3xl sm:text-5xl font-bold text-[#E9E1D8] tracking-tight leading-tight">
                Paper Hand Bitch Tax
              </h1>
              <p className="text-lg sm:text-xl text-[#5F6A6E] mt-3 font-light">
                Sell at a loss. Receive 50% less.
              </p>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-3 mb-8">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#8C3A32]/10 border border-[#8C3A32]/20">
                <div className="w-2 h-2 rounded-full bg-[#8C3A32] animate-pulse" />
                <span className="text-sm text-[#E9E1D8] font-medium">50% Paper Hand Tax</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm text-emerald-400 font-medium">Diamond Hands = No Tax</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#141D21] border border-[#2A3338]/50">
                <Shield className="w-3.5 h-3.5 text-[#5F6A6E]" />
                <span className="text-sm text-[#9FA6A3]">On-chain Enforced</span>
              </div>
            </div>

            {/* Description card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#141D21] to-[#0E1518] border border-[#2A3338]/50 p-6">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#8C3A32]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <p className="text-[#9FA6A3] leading-relaxed relative z-10 max-w-2xl">
                When you sell below your cost basis, 50% of proceeds go to the treasury.
                Cost basis is tracked per-wallet. Diamond hands pay nothing. Paper hands pay the price.
              </p>
            </div>
          </div>

          {/* Explore Section */}
          <ExploreSection key={refreshKey} />

          {/* Treasury Stats */}
          <div className="mt-12 sm:mt-16">
            <TreasuryCard />
          </div>

          {/* How it Works - Slick cards */}
          <div className="mt-12 sm:mt-16">
            <h2 className="text-xl font-bold text-[#E9E1D8] mb-6 flex items-center gap-3">
              <Zap className="w-5 h-5 text-[#8C3A32]" />
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#141D21] to-[#0E1518] border border-[#2A3338]/50 p-6 hover:border-[#8C3A32]/30 transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all" />
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                    <span className="text-blue-400 font-bold">1</span>
                  </div>
                  <h3 className="text-[#E9E1D8] font-semibold mb-2">Buy Tokens</h3>
                  <p className="text-sm text-[#5F6A6E] leading-relaxed">
                    Your cost basis is tracked automatically with weighted average pricing.
                  </p>
                </div>
              </div>
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#141D21] to-[#0E1518] border border-[#2A3338]/50 p-6 hover:border-[#8C3A32]/30 transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all" />
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                    <span className="text-purple-400 font-bold">2</span>
                  </div>
                  <h3 className="text-[#E9E1D8] font-semibold mb-2">Hold or Sell</h3>
                  <p className="text-sm text-[#5F6A6E] leading-relaxed">
                    We compare your sell price against cost basis to determine profit or loss.
                  </p>
                </div>
              </div>
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#141D21] to-[#0E1518] border border-[#8C3A32]/30 p-6 hover:border-[#8C3A32]/50 transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#8C3A32]/10 rounded-full blur-2xl group-hover:bg-[#8C3A32]/15 transition-all" />
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-[#8C3A32]/20 border border-[#8C3A32]/30 flex items-center justify-center mb-4">
                    <span className="text-[#8C3A32] font-bold">!</span>
                  </div>
                  <h3 className="text-[#E9E1D8] font-semibold mb-2">Paper Hand Tax</h3>
                  <p className="text-sm text-[#5F6A6E] leading-relaxed">
                    Selling at loss? 50% goes to treasury. Diamond hands keep everything.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Slick with install option */}
          <footer className="mt-16 sm:mt-20 pt-8 border-t border-[#2A3338]/50">
            <div className="flex flex-col gap-6">
              {/* Top row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8C3A32] to-[#6B2D28] flex items-center justify-center">
                    <span className="text-white text-xs font-bold">💀</span>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-[#E9E1D8]">Paper Hand Bitch Tax</span>
                    <span className="text-xs text-[#5F6A6E] ml-2">Solana Mainnet</span>
                  </div>
                </div>
                
                {/* Links */}
                <div className="flex items-center gap-4">
                  <Link href="/docs" className="flex items-center gap-2 text-sm text-[#5F6A6E] hover:text-[#E9E1D8] transition-colors">
                    <FileText className="w-4 h-4" />
                    <span>Docs</span>
                  </Link>
                  <a href="https://github.com/cryptobluejava/phbt" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#5F6A6E] hover:text-[#E9E1D8] transition-colors">
                    <Github className="w-4 h-4" />
                    <span>GitHub</span>
                  </a>
                  <a href="https://x.com/PHBTax" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#5F6A6E] hover:text-[#E9E1D8] transition-colors">
                    <Twitter className="w-4 h-4" />
                    <span>X</span>
                  </a>
                </div>
              </div>
              
              {/* Bottom row with install */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-[#2A3338]/30">
                <p className="text-xs text-[#5F6A6E]">
                  Not financial advice. DYOR. Trade responsibly.
                </p>
                
                {/* Install App button - only shows when available */}
                {canInstall && (
                  <button
                    onClick={handleInstall}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#141D21] border border-[#2A3338]/50 text-sm text-[#9FA6A3] hover:text-[#E9E1D8] hover:border-[#5F6A6E] transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install PHBT App</span>
                  </button>
                )}
              </div>
            </div>
          </footer>
        </div>
      </div>
    </TooltipProvider>
  )
}
