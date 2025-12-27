"use client"

import { useState, useEffect, useCallback } from "react"
import { useConnection } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import { PROGRAM_ID, TOKEN_METADATA_PROGRAM_ID, HIDDEN_TOKENS, HIDE_OLD_TOKENS, ALLOWED_TOKENS, LAMPORTS_PER_SOL } from "@/lib/constants"
import { formatLamportsToSol } from "@/lib/format"
import Link from "next/link"
import { BN } from "bn.js"
import { TrendingUp, TrendingDown, Flame, Crown } from "lucide-react"

// SOL price estimate
const SOL_PRICE_USD = 180

// Featured PHBT token on pump.fun
const FEATURED_PHBT = {
  mint: "8FffyZvj3LugcrVwr1jpDb33zmzMQk2pvLqXJtK5pump",
  name: "Paper Hand Bitch Tax",
  symbol: "PHBT",
  image: "https://pbs.twimg.com/profile_images/2000542860571975691/dY4iWkwB_400x400.jpg",
  url: "https://pump.fun/coin/8FffyZvj3LugcrVwr1jpDb33zmzMQk2pvLqXJtK5pump",
  isFeatured: true,
}

interface TickerToken {
  mint: string
  name: string
  symbol: string
  image: string | null
  solReserve: number
  priceChange?: number
  url?: string
  isFeatured?: boolean
}

// Helper to derive metadata PDA
function getMetadataPDA(mint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  )
  return pda
}

// Parse Metaplex metadata account
function parseMetadata(data: Buffer): { name: string; symbol: string; uri: string } | null {
  try {
    let offset = 1 + 32 + 32
    const name = data.slice(offset + 4, offset + 4 + 32).toString('utf8').replace(/\0/g, '').trim()
    offset += 4 + 32
    const symbol = data.slice(offset + 4, offset + 4 + 10).toString('utf8').replace(/\0/g, '').trim()
    offset += 4 + 10
    const uriLength = data.readUInt32LE(offset)
    offset += 4
    const uri = data.slice(offset, offset + uriLength).toString('utf8').replace(/\0/g, '').trim()
    return { name, symbol, uri }
  } catch {
    return null
  }
}

export function TokenTicker() {
  const { connection } = useConnection()
  const [tokens, setTokens] = useState<TickerToken[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchTokens = useCallback(async () => {
    try {
      const OLD_POOL_SIZE = 97
      const NEW_POOL_SIZE = 105

      // Fetch pool accounts
      const [oldAccounts, newAccounts] = await Promise.all([
        connection.getProgramAccounts(PROGRAM_ID, { filters: [{ dataSize: OLD_POOL_SIZE }] }),
        connection.getProgramAccounts(PROGRAM_ID, { filters: [{ dataSize: NEW_POOL_SIZE }] })
      ])

      const allAccounts = [...oldAccounts, ...newAccounts]

      // Parse pool data
      const poolsWithMints: Array<{
        tokenOne: PublicKey
        reserveTwo: number
      }> = []

      for (const { account } of allAccounts) {
        try {
          const data = account.data.slice(8)
          const tokenOne = new PublicKey(data.slice(0, 32))
          const reserveTwo = new BN(data.slice(80, 88), 'le').toNumber()

          if (tokenOne.toBase58() === "11111111111111111111111111111111") continue
          if (HIDDEN_TOKENS.includes(tokenOne.toBase58())) continue

          poolsWithMints.push({ tokenOne, reserveTwo })
        } catch {
          // Skip invalid pools
        }
      }

      // Batch fetch metadata
      const metadataPDAs = poolsWithMints.map(p => getMetadataPDA(p.tokenOne))
      const metadataAccounts = await connection.getMultipleAccountsInfo(metadataPDAs)

      // Build token list
      const parsedTokens: TickerToken[] = []

      for (let i = 0; i < poolsWithMints.length; i++) {
        const pool = poolsWithMints[i]
        const mintAddress = pool.tokenOne.toBase58()

        let name = `Token ${mintAddress.slice(0, 6)}...`
        let symbol = mintAddress.slice(0, 4).toUpperCase()
        let image: string | null = null
        let hasNewMetadataFormat = false

        const metadataAccount = metadataAccounts[i]
        if (metadataAccount) {
          const parsed = parseMetadata(metadataAccount.data)
          if (parsed) {
            name = parsed.name || name
            symbol = parsed.symbol || symbol

            if (parsed.uri?.startsWith('data:application/json;base64,')) {
              hasNewMetadataFormat = true
              try {
                const base64Data = parsed.uri.replace('data:application/json;base64,', '')
                const jsonStr = Buffer.from(base64Data, 'base64').toString('utf8')
                const jsonMeta = JSON.parse(jsonStr)
                if (jsonMeta.image) image = jsonMeta.image
              } catch {}
            } else if (parsed.uri?.startsWith('data:,')) {
              hasNewMetadataFormat = true
            } else if (parsed.uri?.startsWith('http') && !parsed.uri.includes('placeholder')) {
              hasNewMetadataFormat = true
              image = parsed.uri
            }
          }
        }

        // Filter old tokens if enabled
        const isAllowed = ALLOWED_TOKENS.includes(mintAddress)
        if (HIDE_OLD_TOKENS && !hasNewMetadataFormat && !isAllowed) continue

        parsedTokens.push({
          mint: mintAddress,
          name,
          symbol,
          image,
          solReserve: pool.reserveTwo,
          // Generate deterministic "random" based on mint address for consistent SSR
          priceChange: ((parseInt(mintAddress.slice(0, 8), 36) % 250) - 100) / 10
        })
      }

      // Sort by liquidity and take top tokens
      parsedTokens.sort((a, b) => b.solReserve - a.solReserve)
      
      // Add featured PHBT at the beginning
      const featuredToken: TickerToken = {
        ...FEATURED_PHBT,
        solReserve: 0, // Will show as featured, not by liquidity
        priceChange: 12.5, // Fixed positive value for featured token
      }
      
      setTokens([featuredToken, ...parsedTokens.slice(0, 19)])
    } catch (error) {
      console.error("Failed to fetch ticker tokens:", error)
    } finally {
      setIsLoading(false)
    }
  }, [connection])

  useEffect(() => {
    // Delay initial fetch to avoid RPC spam
    const timer = setTimeout(fetchTokens, 3000)
    // Refresh every 60 seconds
    const interval = setInterval(fetchTokens, 60000)
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [fetchTokens])

  if (isLoading || tokens.length === 0) {
    return null // Don't show empty ticker
  }

  // Duplicate tokens for seamless infinite scroll
  const displayTokens = [...tokens, ...tokens]

  return (
    <div className="w-full bg-[#0A0F11] border-b border-[#1A2428] overflow-hidden">
      <div className="flex items-center">
        {/* Hot badge */}
        <div className="flex-shrink-0 px-4 py-2 bg-[#8C3A32]/20 border-r border-[#1A2428] flex items-center gap-2">
          <Flame className="w-4 h-4 text-[#8C3A32]" />
          <span className="text-xs font-medium text-[#8C3A32] hidden sm:inline">LIVE</span>
        </div>
        
        {/* Scrolling ticker */}
        <div className="flex-1 overflow-hidden">
          <div className="animate-ticker flex items-center gap-6 py-2 px-4">
            {displayTokens.map((token, i) => {
              // Calculate market cap in USD for non-featured tokens
              const marketCapSol = (token.solReserve / LAMPORTS_PER_SOL) * 2
              const marketCapUsd = marketCapSol * SOL_PRICE_USD
              const mcDisplay = marketCapUsd < 1000 
                ? `$${marketCapUsd.toFixed(0)}`
                : marketCapUsd < 1000000 
                    ? `$${(marketCapUsd / 1000).toFixed(1)}K` 
                    : `$${(marketCapUsd / 1000000).toFixed(2)}M`
              
              return token.isFeatured ? (
                // Featured PHBT token with special styling
                <a
                  key={`${token.mint}-${i}`}
                  href={token.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 flex-shrink-0 bg-gradient-to-r from-[#8C3A32]/30 to-transparent px-4 py-1.5 rounded-lg border border-[#8C3A32]/50 group"
                >
                  {/* Crown badge */}
                  <div className="flex items-center gap-1">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs font-bold text-yellow-500">#1</span>
                  </div>
                  
                  {/* Token image */}
                  <img
                    src={token.image || "/logo.png"}
                    alt={token.symbol}
                    className="w-6 h-6 rounded-full object-cover ring-2 ring-[#8C3A32]"
                  />
                  
                  {/* Token info */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#E9E1D8] group-hover:text-[#8C3A32] transition-colors">
                      ${token.symbol}
                    </span>
                    <span className="text-xs text-[#8C3A32] font-medium">
                      pump.fun
                    </span>
                    {token.priceChange !== undefined && (
                      <span className="text-xs font-medium flex items-center gap-0.5 text-green-400">
                        <TrendingUp className="w-3 h-3" />
                        +{token.priceChange.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </a>
              ) : (
                // Regular platform tokens
                <Link
                  key={`${token.mint}-${i}`}
                  href={`/token/${token.mint}`}
                  className="flex items-center gap-3 flex-shrink-0 hover:bg-[#141D21] px-3 py-1 rounded-lg transition-colors group"
                >
                  {/* Token image/avatar */}
                  {token.image ? (
                    <img
                      src={token.image}
                      alt={token.symbol}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#8C3A32] to-[#A04438] flex items-center justify-center text-[10px] font-bold text-white">
                      {token.symbol.slice(0, 2)}
                    </div>
                  )}
                  
                  {/* Token info */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#E9E1D8] group-hover:text-[#8C3A32] transition-colors">
                      ${token.symbol}
                    </span>
                    <span className="text-xs text-[#5F6A6E] font-medium">
                      MC {mcDisplay}
                    </span>
                    {token.priceChange !== undefined && (
                      <span className={`text-xs font-medium flex items-center gap-0.5 ${
                        token.priceChange >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {token.priceChange >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {token.priceChange >= 0 ? '+' : ''}{token.priceChange.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

