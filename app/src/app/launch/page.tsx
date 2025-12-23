"use client"

import { useState, useCallback } from "react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { PublicKey, Transaction, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js"
import {
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAssociatedTokenAddressSync
} from "@solana/spl-token"
import { PROGRAM_ID, CURVE_CONFIG_SEED, POOL_SEED_PREFIX, GLOBAL_SEED, LAMPORTS_PER_SOL, TOKEN_METADATA_PROGRAM_ID } from "@/lib/constants"
import { TooltipProvider } from "@/components/ui/tooltip"
import Link from "next/link"



export default function LaunchPage() {
    const { connection } = useConnection()
    const { publicKey, sendTransaction, connected } = useWallet()

    const [name, setName] = useState("")
    const [symbol, setSymbol] = useState("")
    const [description, setDescription] = useState("")
    const [imageUri, setImageUri] = useState("")
    const [decimals, setDecimals] = useState(6)
    const [initialSupply, setInitialSupply] = useState("1000000000")
    const [initialSol, setInitialSol] = useState("0.1")

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<{ mint: string; pool: string } | null>(null)

    // Removed handleImageChange as we now use direct URI input

    const derivePDAs = useCallback((symbolStr: string) => {
        // Derive mint PDA
        const [mint] = PublicKey.findProgramAddressSync(
            [Buffer.from("mint"), Buffer.from(symbolStr)],
            PROGRAM_ID
        )

        // Derive metadata PDA
        const [metadata] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("metadata"),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                mint.toBuffer(),
            ],
            TOKEN_METADATA_PROGRAM_ID
        )

        // Derive pool PDA
        const [pool] = PublicKey.findProgramAddressSync(
            [Buffer.from(POOL_SEED_PREFIX), mint.toBuffer()],
            PROGRAM_ID
        )

        // Derive global PDA
        const [global] = PublicKey.findProgramAddressSync(
            [Buffer.from(GLOBAL_SEED)],
            PROGRAM_ID
        )

        // Derive curve config PDA
        const [curveConfig] = PublicKey.findProgramAddressSync(
            [Buffer.from(CURVE_CONFIG_SEED)],
            PROGRAM_ID
        )

        // Pool token account (ATA)
        const poolTokenAccount = getAssociatedTokenAddressSync(mint, global, true)

        // Liquidity provider PDA
        const [liquidityProvider] = PublicKey.findProgramAddressSync(
            [Buffer.from("LiqudityProvider"), pool.toBuffer(), publicKey!.toBuffer()],
            PROGRAM_ID
        )

        return { mint, metadata, pool, global, curveConfig, poolTokenAccount, liquidityProvider }
    }, [publicKey])

    const handleLaunch = useCallback(async () => {
        if (!publicKey || !connected) {
            setError("Please connect your wallet")
            return
        }

        if (!name || !symbol) {
            setError("Name and Symbol are required")
            return
        }

        if (symbol.length > 10) {
            setError("Symbol must be 10 characters or less")
            return
        }

        setIsLoading(true)
        setError(null)
        setSuccess(null)

        try {
            // Use provided image URI or leave empty (fallback will show initials)
            let uri = imageUri || ""

            const pdas = derivePDAs(symbol)
            const supplyLamports = BigInt(initialSupply) * BigInt(Math.pow(10, decimals))
            const solLamports = BigInt(Math.floor(parseFloat(initialSol) * LAMPORTS_PER_SOL))

            console.log("Launching token:", {
                name,
                symbol,
                uri,
                decimals,
                initialSupply: supplyLamports.toString(),
                initialSol: solLamports.toString(),
                pdas: {
                    mint: pdas.mint.toBase58(),
                    pool: pdas.pool.toBase58(),
                    metadata: pdas.metadata.toBase58(),
                }
            })

            // Import and use the program client
            const { createLaunchTransaction } = await import("@/lib/program")
            const { ComputeBudgetProgram } = await import("@solana/web3.js")

            const transaction = await createLaunchTransaction(
                connection,
                {
                    name,
                    symbol,
                    uri,
                    decimals,
                    initialSupply: supplyLamports,
                    initialSolReserve: solLamports,
                },
                publicKey
            )

            // Add compute budget
            transaction.add(
                ComputeBudgetProgram.setComputeUnitLimit({
                    units: 400000,
                })
            )

            // Simulate transaction first
            console.log("Simulating transaction...")
            try {
                const simulation = await connection.simulateTransaction(transaction)
                if (simulation.value.err) {
                    console.error("Simulation failed:", simulation.value.logs)
                    throw new Error(`Simulation failed: ${JSON.stringify(simulation.value.err)}. Check console for logs.`)
                }
                console.log("Simulation success!", simulation.value.logs)
            } catch (simErr: any) {
                console.error("Simulation error details:", simErr)
                throw simErr
            }

            // Send transaction
            const signature = await sendTransaction(transaction, connection)

            // Wait for confirmation
            const confirmation = await connection.confirmTransaction(signature, "confirmed")

            if (confirmation.value.err) {
                throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`)
            }

            console.log("Token launched successfully! Signature:", signature)

            setSuccess({
                mint: pdas.mint.toBase58(),
                pool: pdas.pool.toBase58(),
            })

        } catch (err: any) {
            console.error("Launch error:", err)
            setError(err.message || "Failed to launch token")
        } finally {
            setIsLoading(false)
        }
    }, [publicKey, connected, name, symbol, imageUri, decimals, initialSupply, initialSol, derivePDAs, connection, sendTransaction])

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-[#0E1518]">
                <div className="max-w-2xl mx-auto px-6 py-12">

                    {/* Header */}
                    <div className="mb-8">
                        <Link href="/" className="text-sm text-[#9FA6A3] hover:text-[#E9E1D8] transition-colors">
                            ← Back to Trading
                        </Link>
                        <div className="flex items-center gap-4 mt-4 mb-6">
                            <div className="w-1 h-12 bg-[#8C3A32]" />
                            <div>
                                <h1 className="text-3xl font-medium text-[#E9E1D8] tracking-tight">
                                    Launch Your Token
                                </h1>
                                <p className="text-[#9FA6A3] mt-1">
                                    Create a token with Paper Hand Tax built-in
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Launch Form */}
                    <div className="p-8 rounded-2xl bg-[#141D21] border border-[#2A3338]">

                        {/* Wallet Connection */}
                        {!connected && (
                            <div className="mb-6 p-4 rounded-xl bg-[#0E1518] border border-[#2A3338] text-center">
                                <p className="text-sm text-[#9FA6A3] mb-4">Connect your wallet to launch a token</p>
                                <WalletMultiButton className="!bg-[#8C3A32] !rounded-lg" />
                            </div>
                        )}

                        {/* Form Fields */}
                        <div className="space-y-6">

                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-[#E9E1D8] mb-2">
                                    Token Name *
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Paper Hand Coin"
                                    maxLength={32}
                                    className="w-full px-4 py-3 rounded-xl bg-[#0E1518] border border-[#2A3338] text-[#E9E1D8] placeholder-[#5F6A6E] focus:outline-none focus:border-[#8C3A32] transition-colors"
                                />
                                <p className="text-xs text-[#5F6A6E] mt-1">{name.length}/32 characters</p>
                            </div>

                            {/* Symbol */}
                            <div>
                                <label className="block text-sm font-medium text-[#E9E1D8] mb-2">
                                    Symbol (Ticker) *
                                </label>
                                <input
                                    type="text"
                                    value={symbol}
                                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                                    placeholder="e.g., PHC"
                                    maxLength={10}
                                    className="w-full px-4 py-3 rounded-xl bg-[#0E1518] border border-[#2A3338] text-[#E9E1D8] placeholder-[#5F6A6E] focus:outline-none focus:border-[#8C3A32] transition-colors uppercase"
                                />
                                <p className="text-xs text-[#5F6A6E] mt-1">{symbol.length}/10 characters</p>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-[#E9E1D8] mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe your token..."
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl bg-[#0E1518] border border-[#2A3338] text-[#E9E1D8] placeholder-[#5F6A6E] focus:outline-none focus:border-[#8C3A32] transition-colors resize-none"
                                />
                            </div>

                            {/* Token Image URL */}
                            <div>
                                <label className="block text-sm font-medium text-[#E9E1D8] mb-2">
                                    Token Image URL (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={imageUri}
                                    onChange={(e) => setImageUri(e.target.value)}
                                    placeholder="https://example.com/my-token-logo.png"
                                    className="w-full px-4 py-3 rounded-xl bg-[#0E1518] border border-[#2A3338] text-[#E9E1D8] placeholder-[#5F6A6E] focus:outline-none focus:border-[#8C3A32] transition-colors"
                                />
                                <p className="text-xs text-[#5F6A6E] mt-1">
                                    Direct link to your token's logo image (PNG, JPG, SVG). If left empty, initials will be shown.
                                </p>
                            </div>

                            {/* Advanced Options */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#E9E1D8] mb-2">
                                        Decimals
                                    </label>
                                    <select
                                        value={decimals}
                                        onChange={(e) => setDecimals(Number(e.target.value))}
                                        className="w-full px-4 py-3 rounded-xl bg-[#0E1518] border border-[#2A3338] text-[#E9E1D8] focus:outline-none focus:border-[#8C3A32] transition-colors"
                                    >
                                        <option value={6}>6 (Standard)</option>
                                        <option value={9}>9 (Like SOL)</option>
                                        <option value={0}>0 (NFT-like)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#E9E1D8] mb-2">
                                        Initial Supply
                                    </label>
                                    <input
                                        type="text"
                                        value={initialSupply}
                                        onChange={(e) => setInitialSupply(e.target.value.replace(/[^0-9]/g, ""))}
                                        placeholder="1000000000"
                                        className="w-full px-4 py-3 rounded-xl bg-[#0E1518] border border-[#2A3338] text-[#E9E1D8] placeholder-[#5F6A6E] focus:outline-none focus:border-[#8C3A32] transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Initial SOL */}
                            <div>
                                <label className="block text-sm font-medium text-[#E9E1D8] mb-2">
                                    Initial SOL Liquidity
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={initialSol}
                                        onChange={(e) => setInitialSol(e.target.value)}
                                        placeholder="0.1"
                                        className="w-full px-4 py-3 pr-16 rounded-xl bg-[#0E1518] border border-[#2A3338] text-[#E9E1D8] placeholder-[#5F6A6E] focus:outline-none focus:border-[#8C3A32] transition-colors"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9FA6A3]">SOL</span>
                                </div>
                                <p className="text-xs text-[#5F6A6E] mt-1">
                                    This SOL seeds the bonding curve. You can start with as little as 0.01 SOL.
                                </p>
                            </div>

                            {/* Paper Hand Tax Notice */}
                            <div className="p-4 rounded-xl bg-[#8C3A32]/10 border border-[#8C3A32]/30">
                                <div className="flex items-start gap-3">
                                    <span className="text-lg">⚠️</span>
                                    <div>
                                        <p className="text-sm font-medium text-[#E9E1D8]">Paper Hand Tax: 50%</p>
                                        <p className="text-xs text-[#9FA6A3] mt-1">
                                            Anyone who sells this token at a loss will have 50% of their SOL proceeds sent to the treasury. Diamond hands pay nothing.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="p-4 rounded-xl bg-red-900/20 border border-red-500/30">
                                    <p className="text-sm text-red-400">{error}</p>
                                </div>
                            )}

                            {/* Success Message */}
                            {success && (
                                <div className="p-4 rounded-xl bg-green-900/20 border border-green-500/30">
                                    <p className="text-sm text-green-400 font-medium mb-2">🎉 Token Launched Successfully!</p>
                                    <p className="text-xs text-[#9FA6A3]">
                                        Mint: <code className="text-green-400">{success.mint}</code>
                                    </p>
                                    <p className="text-xs text-[#9FA6A3] mt-1">
                                        Pool: <code className="text-green-400">{success.pool}</code>
                                    </p>
                                </div>
                            )}

                            {/* Launch Button */}
                            <button
                                onClick={handleLaunch}
                                disabled={!connected || isLoading || !name || !symbol}
                                className="w-full py-4 rounded-xl bg-[#8C3A32] text-[#E9E1D8] font-medium hover:bg-[#A04438] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Launching...
                                    </span>
                                ) : (
                                    "🚀 Launch Token"
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="mt-8 p-6 rounded-2xl bg-[#141D21] border border-[#2A3338]">
                        <h2 className="text-lg font-medium text-[#E9E1D8] mb-4">What Happens When You Launch?</h2>
                        <ul className="space-y-3 text-sm text-[#9FA6A3]">
                            <li className="flex items-start gap-2">
                                <span className="text-[#8C3A32]">1.</span>
                                A new SPL token is created with your name and symbol
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#8C3A32]">2.</span>
                                <span>The entire supply is minted to the bonding curve pool</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#8C3A32]">3.</span>
                                <span>Your initial SOL seeds the liquidity</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#8C3A32]">4.</span>
                                <span>Anyone can immediately start trading</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#8C3A32]">5.</span>
                                <span>Paper Hand Tax (50%) applies to all loss-based sells</span>
                            </li>
                        </ul>
                    </div>

                </div>
            </div>
        </TooltipProvider>
    )
}
