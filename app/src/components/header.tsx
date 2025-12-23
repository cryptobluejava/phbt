"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { LAMPORTS_PER_SOL } from "@solana/web3.js"
import { Wallet } from "lucide-react"
import logo from "@/app/logo.png"

export function Header() {
  const { connection } = useConnection()
  const { connected, publicKey } = useWallet()
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => {
    if (connected && publicKey) {
      const fetchBalance = async () => {
        try {
          const lamports = await connection.getBalance(publicKey)
          setBalance(lamports / LAMPORTS_PER_SOL)
        } catch (e) {
          console.error("Failed to fetch balance", e)
        }
      }

      fetchBalance()
      // Refresh every 10 seconds
      const interval = setInterval(fetchBalance, 10000)
      return () => clearInterval(interval)
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
                🚀 Launch Token
              </Link>
            </nav>

            {/* Wallet Section */}
            <div className="flex items-center gap-3">
              {connected && balance !== null && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1A2428] border border-[#2A3338]">
                  <Wallet className="w-4 h-4 text-[#5F6A6E]" />
                  <span className="text-sm font-medium text-[#E9E1D8]">
                    {balance.toFixed(4)} SOL
                  </span>
                </div>
              )}

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
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
