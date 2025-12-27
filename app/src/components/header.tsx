"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { LAMPORTS_PER_SOL } from "@solana/web3.js"
import { REFRESH_INTERVALS } from "@/lib/constants"
import { Wallet, Skull, HelpCircle, X, Download, Trophy, Book } from "lucide-react"
import logo from "@/app/logo.png"

export function Header() {
  const { connection } = useConnection()
  const { connected, publicKey } = useWallet()
  const [balance, setBalance] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)

  // Fix hydration mismatch - only render wallet button after mount
  useEffect(() => {
    setMounted(true)
    
    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallButton(true)
    }
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallButton(false)
    }
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])
  
  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setShowInstallButton(false)
    }
    setDeferredPrompt(null)
  }

  useEffect(() => {
    if (connected && publicKey) {
      let isMounted = true
      
      const fetchBalance = async () => {
        try {
          const lamports = await connection.getBalance(publicKey)
          if (isMounted) {
            setBalance(lamports / LAMPORTS_PER_SOL)
          }
        } catch (e) {
          // Silently fail on rate limit - balance will update on next successful fetch
          if (!String(e).includes('429')) {
            console.error("Failed to fetch balance", e)
          }
        }
      }

      // Delay initial fetch to stagger RPC calls (2.5s to avoid 429 with other components)
      const initialTimer = setTimeout(fetchBalance, 2500)
      
      // Refresh less frequently (60 seconds instead of REFRESH_INTERVALS)
      const interval = setInterval(fetchBalance, 60000)
      
      return () => {
        isMounted = false
        clearTimeout(initialTimer)
        clearInterval(interval)
      }
    } else {
      setBalance(null)
    }
  }, [connected, publicKey, connection])

  return (
    <>
    {/* How It Works Modal */}
    {showHowItWorks && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowHowItWorks(false)}
        />
        
        {/* Modal */}
        <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-[#141D21] border border-[#2A3338] rounded-2xl shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 flex items-center justify-between p-6 border-b border-[#2A3338] bg-[#141D21]">
            <h2 className="text-2xl font-bold text-[#E9E1D8] flex items-center gap-3">
              <span className="text-3xl">💀</span> How PHBT Works
            </h2>
            <button
              onClick={() => setShowHowItWorks(false)}
              className="p-2 rounded-lg hover:bg-[#2A3338] transition-colors"
            >
              <X className="w-5 h-5 text-[#9FA6A3]" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Core Rule */}
            <div className="p-4 rounded-xl bg-[#8C3A32]/20 border border-[#8C3A32]/40">
              <h3 className="text-lg font-bold text-[#E9E1D8] mb-2">⚡ Core Rule</h3>
              <p className="text-[#E9E1D8] text-lg font-medium">
                Sell at a loss → <span className="text-[#8C3A32]">50% Paper-Hand Tax</span>
              </p>
              <p className="text-sm text-[#9FA6A3] mt-2">
                The tax isn't burned it strengthens the ecosystem.
              </p>
            </div>

            {/* Tax Flow */}
            <div>
              <h3 className="text-sm font-bold text-[#9FA6A3] uppercase tracking-wider mb-3">Tax Flow</h3>
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <span className="px-3 py-1.5 rounded-lg bg-[#0E1518] text-[#E9E1D8]">Sell at Loss</span>
                <span className="text-[#5F6A6E]">→</span>
                <span className="px-3 py-1.5 rounded-lg bg-[#8C3A32]/30 text-[#8C3A32]">50% Tax</span>
                <span className="text-[#5F6A6E]">→</span>
                <span className="px-3 py-1.5 rounded-lg bg-[#0E1518] text-[#E9E1D8]">Treasury</span>
                <span className="text-[#5F6A6E]">→</span>
                <span className="px-3 py-1.5 rounded-lg bg-green-900/30 text-green-400">Buybacks & Growth</span>
              </div>
            </div>

            {/* Where Enforced */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-green-900/10 border border-green-500/30">
                <h3 className="text-sm font-bold text-green-400 mb-2">✅ On phbt.fun</h3>
                <ul className="text-sm text-[#9FA6A3] space-y-1">
                  <li>• Contract checks your PnL</li>
                  <li>• Tax auto-applied on loss</li>
                  <li>• 100% enforced, no trust needed</li>
                </ul>
              </div>
              <div className="p-4 rounded-xl bg-red-900/10 border border-red-500/30">
                <h3 className="text-sm font-bold text-red-400 mb-2">❌ External DEXs</h3>
                <ul className="text-sm text-[#9FA6A3] space-y-1">
                  <li>• Raydium, Jupiter, etc.</li>
                  <li>• Our contract isn't called</li>
                  <li>• No tax enforcement</li>
                </ul>
              </div>
            </div>

            {/* Philosophy */}
            <div className="p-4 rounded-xl bg-[#0E1518] border border-[#2A3338]">
              <h3 className="text-sm font-bold text-[#9FA6A3] uppercase tracking-wider mb-3">Design Philosophy</h3>
              <ul className="text-sm text-[#E9E1D8] space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-[#8C3A32]">💎</span>
                  <span>Full discipline inside our arena</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#8C3A32]">🎯</span>
                  <span>Strong incentive to trade on phbt.fun</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#8C3A32]">💰</span>
                  <span>Weak-hand losses → long-term growth</span>
                </li>
              </ul>
            </div>

            {/* TL;DR */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#8C3A32]/20 to-[#141D21] border border-[#8C3A32]/30">
              <h3 className="text-sm font-bold text-[#8C3A32] mb-2">TL;DR</h3>
              <p className="text-[#E9E1D8] font-medium">
                Paper hands feed the trenches. 💀
              </p>
            </div>
          </div>
        </div>
      </div>
    )}
    
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0E1518]">
      {/* Main Header */}
      <div className="border-b border-[#2A3338]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
            <Image
              src={logo}
              alt="PHBT"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="font-medium text-[#E9E1D8] tracking-tight hidden sm:inline">
              Paper Hand Bitch Tax
            </span>
          </Link>

          <div className="flex items-center gap-6">
            {/* Navigation */}
            <nav className="flex items-center gap-1 sm:gap-4">
              <button
                onClick={() => setShowHowItWorks(true)}
                className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{ 
                  backgroundColor: 'var(--surface)', 
                  borderColor: 'var(--border)',
                  border: '1px solid var(--border)',
                  color: 'var(--primary)'
                }}
                title="How It Works"
              >
                <HelpCircle className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span className="hidden sm:inline">How It Works</span>
              </button>
              <Link
                href="/phbi"
                className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{ 
                  backgroundColor: 'var(--surface)', 
                  borderColor: 'var(--border)',
                  border: '1px solid var(--border)',
                  color: 'var(--primary)'
                }}
                title="Paper Hand Bitch Index"
              >
                <Skull className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span className="hidden sm:inline">PHBI</span>
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{ 
                  backgroundColor: 'var(--surface)', 
                  borderColor: 'var(--border)',
                  border: '1px solid var(--border)',
                  color: 'var(--primary)'
                }}
                title="Profile & Achievements"
              >
                <Trophy className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span className="hidden sm:inline">Profile</span>
              </Link>
              <Link
                href="/docs"
                className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{ 
                  backgroundColor: 'var(--surface)', 
                  borderColor: 'var(--border)',
                  border: '1px solid var(--border)',
                  color: 'var(--primary)'
                }}
                title="Documentation"
              >
                <Book className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span className="hidden sm:inline">Docs</span>
              </Link>
              <Link
                href="/launch"
                className="px-2.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors"
                style={{ 
                  backgroundColor: 'var(--accent)',
                  color: '#E9E1D8'
                }}
              >
                <span className="hidden sm:inline">Create Coin</span>
                <span className="sm:hidden">Create</span>
              </Link>
            </nav>

            {/* Wallet Section */}
            <div className="flex items-center gap-2 sm:gap-3">
              {mounted && connected && balance !== null && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1A2428] border border-[#2A3338]">
                  <Wallet className="w-4 h-4 text-[#5F6A6E]" />
                  <span className="text-sm font-medium text-[#E9E1D8]">
                    {balance.toFixed(4)} SOL
                  </span>
                </div>
              )}

              {mounted && (
                <div className="wallet-adapter-button-wrapper">
                  <WalletMultiButton
                    style={{
                      background: connected ? '#E9E1D8' : '#141D21',
                      color: connected ? '#0E1518' : '#E9E1D8',
                      borderRadius: '12px',
                      height: '40px',
                      fontSize: '14px',
                      fontWeight: '500',
                      border: connected ? 'none' : '1px solid #2A3338',
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
      
      {/* Install App Banner - shown when PWA install is available */}
      {mounted && showInstallButton && (
        <div className="border-b border-[#2A3338] bg-[#141D21]">
          <div className="max-w-6xl mx-auto px-6">
            <button
              onClick={handleInstallClick}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-[#E9E1D8] hover:bg-[#8C3A32]/10 transition-colors"
            >
              <Download className="w-4 h-4 text-[#8C3A32]" />
              <span>Install PHBT App</span>
            </button>
          </div>
        </div>
      )}
    </header>
    </>
  )
}

