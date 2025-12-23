"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useConnection } from "@solana/wallet-adapter-react"
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token"
import { getPoolPDA, getGlobalPDA } from "@/lib/pdas"
import { TREASURY_WALLET, TOKEN_METADATA_PROGRAM_ID } from "@/lib/constants"

export interface Trade {
    signature: string
    account: string
    type: "buy" | "sell" | "paperhand"
    solAmount: number
    tokenAmount: number
    time: string
    timestamp: number
    price: number
}

export interface TokenMetadata {
    name: string
    symbol: string
    image: string | null
    totalSupply: number
    decimals: number
}

export interface WalletHolding {
    address: string
    balance: number
    percentage: number
    isLiquidityPool: boolean
}

export interface TokenPageData {
    metadata: TokenMetadata | null
    trades: Trade[]
    holdings: WalletHolding[]
    isLoading: boolean
    hasFetched: boolean // Track if we've done initial fetch
    error: string | null
}

export function useTokenPageData(mint: PublicKey) {
    const { connection } = useConnection()
    const [data, setData] = useState<TokenPageData>({
        metadata: null,
        trades: [],
        holdings: [],
        isLoading: true,
        hasFetched: false,
        error: null,
    })
    const fetchingRef = useRef(false)
    const mintKeyRef = useRef(mint.toBase58())

    const fetchAllData = useCallback(async () => {
        // Prevent duplicate fetches
        if (fetchingRef.current) return
        fetchingRef.current = true

        setData(prev => ({ ...prev, isLoading: true, error: null }))

        try {
            // ============ STEP 1: Fetch Token Metadata ============
            let metadata: TokenMetadata = {
                name: "Unknown Token",
                symbol: "???",
                image: null,
                totalSupply: 0,
                decimals: 6,
            }

            try {
                const mintInfo = await connection.getParsedAccountInfo(mint)
                if (mintInfo.value && 'parsed' in mintInfo.value.data) {
                    metadata.decimals = mintInfo.value.data.parsed.info.decimals
                    metadata.totalSupply = Number(mintInfo.value.data.parsed.info.supply) / Math.pow(10, metadata.decimals)
                }

                const [metadataPDA] = PublicKey.findProgramAddressSync(
                    [Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
                    TOKEN_METADATA_PROGRAM_ID
                )
                const metadataAccount = await connection.getAccountInfo(metadataPDA)
                if (metadataAccount) {
                    const data = metadataAccount.data
                    let offset = 1 + 32 + 32
                    metadata.name = data.slice(offset + 4, offset + 4 + 32).toString('utf8').replace(/\0/g, '').trim()
                    offset += 36
                    metadata.symbol = data.slice(offset + 4, offset + 4 + 10).toString('utf8').replace(/\0/g, '').trim()
                    offset += 14
                    const uriLen = data.readUInt32LE(offset)
                    const uri = data.slice(offset + 4, offset + 4 + uriLen).toString('utf8').replace(/\0/g, '').trim()
                    if (uri && uri.startsWith("http") && !uri.includes("placeholder-")) {
                        metadata.image = uri
                    }
                }
            } catch (e) {
                console.error("Metadata fetch error:", e)
            }

            // ============ STEP 2: Fetch Trades ============
            const trades: Trade[] = []
            try {
                const [poolPDA] = getPoolPDA(mint)
                const signatures = await connection.getSignaturesForAddress(poolPDA, { limit: 20 })

                // Process transactions - empty signatures is valid (no trades yet)
                for (const sig of signatures) {
                    try {
                        const tx = await connection.getParsedTransaction(sig.signature, {
                            maxSupportedTransactionVersion: 0
                        })

                        if (!tx || !tx.meta) continue

                        const timeDiff = Date.now() / 1000 - (sig.blockTime || 0)
                        let timeStr = ""
                        if (timeDiff < 60) timeStr = "just now"
                        else if (timeDiff < 3600) timeStr = `${Math.floor(timeDiff / 60)}m ago`
                        else if (timeDiff < 86400) timeStr = `${Math.floor(timeDiff / 3600)}h ago`
                        else timeStr = `${Math.floor(timeDiff / 86400)}d ago`

                        const signerAccount = tx.transaction.message.accountKeys.find(key => key.signer)
                        const signer = signerAccount?.pubkey.toBase58() || "Unknown"
                        const truncatedAccount = signer.slice(0, 4) + "..." + signer.slice(-4)

                        const preBalances = tx.meta.preBalances
                        const postBalances = tx.meta.postBalances
                        const solChange = (postBalances[0] - preBalances[0]) / LAMPORTS_PER_SOL

                        const preTokenBalances = tx.meta.preTokenBalances || []
                        const postTokenBalances = tx.meta.postTokenBalances || []

                        const [globalPDA] = getGlobalPDA()
                        const poolTokenAccount = getAssociatedTokenAddressSync(mint, globalPDA, true)

                        let tokenChange = 0
                        for (const post of postTokenBalances) {
                            const accountKey = tx.transaction.message.accountKeys[post.accountIndex].pubkey
                            if (accountKey.equals(poolTokenAccount)) continue

                            const pre = preTokenBalances.find(p => p.accountIndex === post.accountIndex)
                            const preAmount = pre?.uiTokenAmount.uiAmount || 0
                            const postAmount = post.uiTokenAmount.uiAmount || 0
                            const change = postAmount - preAmount

                            if (Math.abs(change) > 0) {
                                tokenChange = change
                                break
                            }
                        }

                        let type: "buy" | "sell" | "paperhand" = "buy"
                        const displaySolAmount = Math.abs(solChange)
                        const displayTokenAmount = Math.abs(tokenChange)

                        if (tokenChange > 0) {
                            type = "buy"
                        } else if (tokenChange < 0) {
                            const treasuryIndex = tx.transaction.message.accountKeys.findIndex(
                                key => key.pubkey.equals(TREASURY_WALLET)
                            )
                            if (treasuryIndex >= 0) {
                                const treasuryChange = postBalances[treasuryIndex] - preBalances[treasuryIndex]
                                type = treasuryChange > 0 ? "paperhand" : "sell"
                            } else {
                                type = "sell"
                            }
                        } else {
                            continue
                        }

                        if (displayTokenAmount < 0.001 && displaySolAmount < 0.0001) continue

                        const price = displayTokenAmount > 0 ? displaySolAmount / displayTokenAmount : 0

                        trades.push({
                            signature: sig.signature,
                            account: truncatedAccount,
                            type,
                            solAmount: displaySolAmount,
                            tokenAmount: displayTokenAmount,
                            time: timeStr,
                            timestamp: sig.blockTime || 0,
                            price,
                        })
                    } catch (e) {
                        continue
                    }
                }
                trades.sort((a, b) => b.timestamp - a.timestamp)
            } catch (e) {
                console.error("Trades fetch error:", e)
            }

            // ============ STEP 3: Fetch Token Holdings ============
            const holdings: WalletHolding[] = []
            try {
                if (metadata.totalSupply > 0) {
                    const [globalPDA] = getGlobalPDA()
                    const poolTokenAccount = getAssociatedTokenAddressSync(mint, globalPDA, true)

                    const accounts = await connection.getParsedProgramAccounts(TOKEN_PROGRAM_ID, {
                        filters: [
                            { dataSize: 165 },
                            { memcmp: { offset: 0, bytes: mint.toBase58() } }
                        ]
                    })

                    for (const account of accounts) {
                        const data = account.account.data
                        if ("parsed" in data) {
                            const info = data.parsed.info
                            const balance = Number(info.tokenAmount.uiAmount) || 0
                            if (balance === 0) continue

                            const isLP = account.pubkey.equals(poolTokenAccount)
                            const percentage = (balance / metadata.totalSupply) * 100

                            holdings.push({
                                address: isLP ? "Liquidity Pool" : account.pubkey.toBase58(),
                                balance,
                                percentage,
                                isLiquidityPool: isLP,
                            })
                        }
                    }
                    holdings.sort((a, b) => b.balance - a.balance)
                    holdings.splice(10)
                }
            } catch (e) {
                console.error("Holdings fetch error:", e)
            }

            // Success! Empty arrays are valid - no need to retry
            setData({
                metadata,
                trades,
                holdings,
                isLoading: false,
                hasFetched: true, // Mark that we've completed initial fetch
                error: null,
            })

        } catch (e) {
            console.error("Data fetch error:", e)
            setData(prev => ({
                ...prev,
                isLoading: false,
                hasFetched: true, // Even on error, mark as fetched to prevent infinite retry
                error: "Failed to fetch token data",
            }))
        } finally {
            fetchingRef.current = false
        }
    }, [connection, mint])

    useEffect(() => {
        // Reset state when mint changes
        if (mintKeyRef.current !== mint.toBase58()) {
            mintKeyRef.current = mint.toBase58()
            setData({
                metadata: null,
                trades: [],
                holdings: [],
                isLoading: true,
                hasFetched: false,
                error: null,
            })
        }

        fetchAllData()

        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchAllData, 30000)
        return () => clearInterval(interval)
    }, [fetchAllData, mint])

    return { ...data, refetch: fetchAllData }
}
