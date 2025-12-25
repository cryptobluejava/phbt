"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { LAMPORTS_PER_SOL } from "@solana/web3.js"
import { REFRESH_INTERVALS } from "@/lib/constants"
import { Wallet } from "lucide-react"
import logo from "@/app/logo.png"

export function Header() {
  const { connection } = useConnection()
  const { connected, publicKey } = useWallet()
  const [balance, setBalance] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  // Fix hydration mismatch - only render wallet button after mount
  useEffect(() => {
    setMounted(true)
  }, [])

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
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#2A3338] bg-[#0E1518]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Image
              src={logo}
              alt="Paper Hand Bitch Tax"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="font-medium text-[#E9E1D8] tracking-tight">
              Paper Hand Bitch Tax
            </span>
          </Link>

          <div className="flex items-center gap-6">
            {/* Navigation */}
            <nav className="flex items-center gap-6">
              <Link
                href="/launch"
                className="px-4 py-2 rounded-xl bg-[#8C3A32] text-[#E9E1D8] text-sm font-medium hover:bg-[#A04438] transition-colors"
              >
                Create Coin
              </Link>
            </nav>

            {/* Wallet Section */}
            <div className="flex items-center gap-3">
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
    </header>
  )
}
