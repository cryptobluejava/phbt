"use client"

import { useState, useEffect, useCallback } from "react"
import { useConnection } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import { Card, CardContent } from "@/components/ui/card"
import { RefreshCw, Rocket, ExternalLink } from "lucide-react"
import { PROGRAM_ID, POOL_SEED_PREFIX, TOKEN_METADATA_PROGRAM_ID, REFRESH_INTERVALS, HIDDEN_TOKENS, HIDE_OLD_TOKENS } from "@/lib/constants"
import { formatLamportsToSol } from "@/lib/format"
import Link from "next/link"
import { BN } from "bn.js"



interface LaunchedCoin {
    mint: PublicKey
    pool: PublicKey
    name: string
    symbol: string
    image: string | null
    tokenReserve: number
    solReserve: number
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
        // Skip: key (1) + update_authority (32) + mint (32)
        let offset = 1 + 32 + 32

        // Read name
        const nameLength = data.readUInt32LE(offset)
        offset += 4
        const name = data.slice(offset, offset + 32).toString('utf8').replace(/\0/g, '').trim()
        offset += 32

        // Read symbol
        const symbolLength = data.readUInt32LE(offset)
        offset += 4
        const symbol = data.slice(offset, offset + 10).toString('utf8').replace(/\0/g, '').trim()
        offset += 10

        // Read URI
        const uriLength = data.readUInt32LE(offset)
        offset += 4
        const uri = data.slice(offset, offset + uriLength).toString('utf8').replace(/\0/g, '').trim()

        return { name, symbol, uri }
    } catch (e) {
        console.error("Failed to parse metadata:", e)
        return null
    }
}

export function ExploreSection() {
    const { connection } = useConnection()
    const [coins, setCoins] = useState<LaunchedCoin[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchLaunchedCoins = useCallback(async () => {
        setIsLoading(true)
        try {
            // Support both old (97 bytes) and new (105 bytes) pool formats
            const OLD_POOL_SIZE = 97
            const NEW_POOL_SIZE = 105

            // Fetch pool accounts - do sequentially to avoid rate limits
            const oldAccounts = await connection.getProgramAccounts(PROGRAM_ID, {
                filters: [{ dataSize: OLD_POOL_SIZE }]
            })
            
            // Longer delay between calls to avoid 429
            await new Promise(r => setTimeout(r, 500))
            
            const newAccounts = await connection.getProgramAccounts(PROGRAM_ID, {
                filters: [{ dataSize: NEW_POOL_SIZE }]
            })

            const allAccounts = [
                ...oldAccounts.map(a => ({ ...a, isNewFormat: false })),
                ...newAccounts.map(a => ({ ...a, isNewFormat: true }))
            ]

            // First pass: parse pool data without metadata
            const poolsWithMints: Array<{
                pubkey: PublicKey
                tokenOne: PublicKey
                reserveOne: BN
                reserveTwo: BN
            }> = []

            for (const { pubkey, account } of allAccounts) {
                try {
                    const data = account.data.slice(8)
                    const tokenOne = new PublicKey(data.slice(0, 32))
                    const reserveOne = new BN(data.slice(72, 80), 'le')
                    const reserveTwo = new BN(data.slice(80, 88), 'le')

                    // Skip invalid pools
                    if (tokenOne.toBase58() === "11111111111111111111111111111111") {
                        continue
                    }

                    poolsWithMints.push({ pubkey, tokenOne, reserveOne, reserveTwo })
                } catch (e) {
                    console.error("Failed to parse pool:", pubkey.toBase58(), e)
                }
            }

            // Batch fetch all metadata accounts at once (much faster!)
            const metadataPDAs = poolsWithMints.map(p => getMetadataPDA(p.tokenOne))
            
            await new Promise(r => setTimeout(r, 500))
            
            const metadataAccounts = await connection.getMultipleAccountsInfo(metadataPDAs)

            // Build final list with metadata, filtering out hidden tokens
            const parsedCoins: LaunchedCoin[] = []
            
            for (let i = 0; i < poolsWithMints.length; i++) {
                const pool = poolsWithMints[i]
                const mintAddress = pool.tokenOne.toBase58()
                
                // Skip explicitly hidden tokens
                if (HIDDEN_TOKENS.includes(mintAddress)) {
                    continue
                }
                
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

                        // Check if URI is a data URI (new JSON metadata format)
                        if (parsed.uri?.startsWith('data:application/json;base64,')) {
                            hasNewMetadataFormat = true
                            try {
                                const base64Data = parsed.uri.replace('data:application/json;base64,', '')
                                const jsonStr = Buffer.from(base64Data, 'base64').toString('utf8')
                                const jsonMeta = JSON.parse(jsonStr)
                                if (jsonMeta.image) {
                                    image = jsonMeta.image
                                }
                            } catch (e) {
                                // Ignore parse errors
                            }
                        } else {
                            const isValidImageUrl = parsed.uri &&
                                parsed.uri.startsWith('http') &&
                                !parsed.uri.includes('placeholder-') &&
                                !parsed.uri.includes('arweave.net/placeholder')

                            if (isValidImageUrl) {
                                image = parsed.uri
                            }
                        }
                    }
                }
                
                // If HIDE_OLD_TOKENS is enabled, skip tokens without new metadata format
                if (HIDE_OLD_TOKENS && !hasNewMetadataFormat) {
                    continue
                }

                parsedCoins.push({
                    mint: pool.tokenOne,
                    pool: pool.pubkey,
                    name,
                    symbol,
                    image,
                    tokenReserve: pool.reserveOne.toNumber(),
                    solReserve: pool.reserveTwo.toNumber(),
                })
            }

            setCoins(parsedCoins)
        } catch (error) {
            console.error("Failed to fetch launched coins:", error)
        } finally {
            setIsLoading(false)
        }
    }, [connection])

    useEffect(() => {
        // Delay initial fetch to avoid simultaneous RPC calls with other components
        const timer = setTimeout(() => {
            fetchLaunchedCoins()
        }, 1500) // Increased delay to spread out RPC calls
        return () => clearTimeout(timer)
        // Disabled auto-refresh to reduce RPC calls
    }, [fetchLaunchedCoins])

    return (
        <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-1 h-10 bg-[#8C3A32]" />
                    <div>
                        <h2 className="text-2xl font-medium text-[#E9E1D8] tracking-tight">
                            Explore Launched Coins
                        </h2>
                        <p className="text-sm text-[#9FA6A3] mt-1">
                            Discover tokens created with Paper Hand Tax
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchLaunchedCoins()}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#2A3338] text-[#9FA6A3] text-sm hover:bg-[#1A2428] transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <Link
                        href="/launch"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#8C3A32] text-[#E9E1D8] text-sm font-medium hover:bg-[#A04438] transition-colors"
                    >
                        <Rocket className="w-4 h-4" />
                        Create Coin
                    </Link>
                </div>
            </div>

            {isLoading && coins.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-6 h-6 text-[#5F6A6E] animate-spin" />
                </div>
            ) : coins.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-[#0E1518] border border-[#2A3338] flex items-center justify-center mx-auto mb-4">
                            <Rocket className="w-8 h-8 text-[#5F6A6E]" />
                        </div>
                        <p className="text-[#E9E1D8] font-medium mb-2">No coins launched yet</p>
                        <p className="text-sm text-[#5F6A6E] mb-4">Be the first to launch a token with Paper Hand Tax!</p>
                        <Link
                            href="/launch"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#8C3A32] text-[#E9E1D8] text-sm font-medium hover:bg-[#A04438] transition-colors"
                        >
                            Create Your Coin
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${isLoading ? 'opacity-80' : ''}`}>
                    {coins.map((coin) => (
                        <Link
                            key={coin.pool.toBase58()}
                            href={`/token/${coin.mint.toBase58()}`}
                            className="group"
                        >
                            <Card className="overflow-hidden hover:border-[#8C3A32]/50 transition-all hover:scale-[1.02] cursor-pointer">
                                {/* Large Image Section - ~33% of card */}
                                <div className="aspect-[4/3] relative bg-gradient-to-br from-[#1A2428] to-[#0E1518]">
                                    {coin.image ? (
                                        <img
                                            src={coin.image}
                                            alt={coin.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#8C3A32] to-[#A04438] flex items-center justify-center text-3xl font-bold text-[#E9E1D8] shadow-lg">
                                                {coin.symbol.slice(0, 2)}
                                            </div>
                                        </div>
                                    )}
                                    {/* Overlay gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#141D21] via-transparent to-transparent" />

                                    {/* Symbol badge */}
                                    <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-[#0E1518]/80 backdrop-blur-sm border border-[#2A3338]">
                                        <span className="text-xs font-medium text-[#E9E1D8]">${coin.symbol}</span>
                                    </div>
                                </div>

                                {/* Info Section */}
                                <CardContent className="p-4 space-y-3">
                                    <div>
                                        <h3 className="text-[#E9E1D8] font-medium truncate group-hover:text-[#8C3A32] transition-colors">
                                            {coin.name}
                                        </h3>
                                        <p className="text-xs text-[#5F6A6E] truncate mt-0.5">
                                            {coin.mint.toBase58().slice(0, 16)}...
                                        </p>
                                    </div>

                                    <div className="flex justify-between items-center text-sm">
                                        <div>
                                            <p className="text-[#5F6A6E] text-xs">Liquidity</p>
                                            <p className="text-[#E9E1D8] font-medium">{formatLamportsToSol(coin.solReserve)} SOL</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[#5F6A6E] text-xs">Supply</p>
                                            <p className="text-[#E9E1D8] font-medium">{(coin.tokenReserve / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                        </div>
                                    </div>

                                    <button className="w-full py-2.5 rounded-lg bg-[#8C3A32] text-[#E9E1D8] text-sm font-medium group-hover:bg-[#A04438] transition-colors flex items-center justify-center gap-2">
                                        Trade
                                        <Rocket className="w-3.5 h-3.5" />
                                    </button>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
