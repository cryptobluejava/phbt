"use client"

import { useState, useCallback, useEffect } from "react"
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
import { useRouter } from "next/navigation"



export default function LaunchPage() {
    const router = useRouter()
    const { connection } = useConnection()
    const { publicKey, signTransaction, connected } = useWallet()
    const [mounted, setMounted] = useState(false)

    const [name, setName] = useState("")
    const [symbol, setSymbol] = useState("")
    const [description, setDescription] = useState("")
    const [imageUri, setImageUri] = useState("")
    const [website, setWebsite] = useState("")
    const [twitter, setTwitter] = useState("")
    const [telegram, setTelegram] = useState("")
    // Fixed defaults - not editable by users
    const decimals = 6
    const initialSupply = "1000000000"
    const [initialSol, setInitialSol] = useState("0.1")
    // All SOL goes to Platform LP
    // User can buy tokens on the token page after launch

    const [isLoading, setIsLoading] = useState(false)
    const [launchStep, setLaunchStep] = useState<string>("")

    // Fix hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])
    const [error, setError] = useState<string | null>(null)

    // Removed handleImageChange as we now use direct URI input

    const derivePDAs = useCallback((symbolStr: string) => {
        // Derive mint PDA - must match program: seeds = [b"mint", symbol.as_bytes(), creator.key().as_ref()]
        const [mint] = PublicKey.findProgramAddressSync(
            [Buffer.from("mint"), Buffer.from(symbolStr), publicKey!.toBuffer()],
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

        try {
            // Create JSON metadata with social links
            const metadata = {
                name,
                symbol,
                image: imageUri || "",
                external_url: website || undefined,
                attributes: [
                    ...(twitter ? [{ trait_type: "twitter", value: twitter }] : []),
                    ...(telegram ? [{ trait_type: "telegram", value: telegram }] : []),
                ].filter(Boolean),
            }
            
            // Encode metadata as data URI (base64 JSON)
            const metadataJson = JSON.stringify(metadata)
            const uri = `data:application/json;base64,${Buffer.from(metadataJson).toString('base64')}`

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

            // All SOL goes to Platform LP
            const lpSolLamports = solLamports

            console.log(`Platform LP: ${Number(lpSolLamports) / LAMPORTS_PER_SOL} SOL`)

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
                    initialSolReserve: lpSolLamports,
                },
                publicKey
            )

            // Add compute budget
            transaction.add(
                ComputeBudgetProgram.setComputeUnitLimit({
                    units: 400000,
                })
            )

            console.log("Transaction built with", transaction.instructions.length, "instructions")
            console.log("Fee payer:", transaction.feePayer?.toBase58())
            console.log("Recent blockhash:", transaction.recentBlockhash)

            // Delay to avoid rate limits from header balance check
            setLaunchStep("Preparing transaction...")
            await new Promise(r => setTimeout(r, 2000))

            // Sign transaction with wallet, then send directly to RPC (bypass wallet's broadcast)
            let signature: string
            try {
                if (!signTransaction) {
                    throw new Error("Wallet does not support signing transactions")
                }
                
                setLaunchStep("Please approve in your wallet...")
                const signedTransaction = await signTransaction(transaction)
                
                setLaunchStep("Broadcasting transaction...")
                // Send directly to our RPC endpoint (bypasses Jupiter/wallet broadcast)
                signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
                    skipPreflight: false,
                    maxRetries: 5,
                    preflightCommitment: 'confirmed',
                })
                console.log("Launch transaction sent:", signature)
            } catch (sendErr: any) {
                // Check if user rejected
                if (sendErr.message?.includes('User rejected') || 
                    sendErr.message?.includes('rejected') ||
                    sendErr.name === 'WalletSignTransactionError') {
                    throw new Error("Transaction cancelled by user")
                }
                // Check for simulation errors
                if (sendErr.logs) {
                    console.error("Transaction logs:", sendErr.logs)
                }
                console.error("Send transaction error:", sendErr)
                throw new Error(`Failed to send transaction: ${sendErr.message || 'Unknown error'}`)
            }

            // Wait for confirmation with simple polling to avoid rate limits
            setLaunchStep("Confirming token creation (may take up to 60s)...")
            let launchConfirmed = false
            for (let i = 0; i < 15; i++) { // 15 attempts, 4 seconds each = 60 seconds max
                await new Promise(r => setTimeout(r, 4000))
                try {
                    const status = await connection.getSignatureStatus(signature)
                    if (status.value?.confirmationStatus === 'confirmed' || status.value?.confirmationStatus === 'finalized') {
                        if (status.value.err) {
                            throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`)
                        }
                        launchConfirmed = true
                        break
                    }
                } catch (e: any) {
                    if (e.message?.includes('Transaction failed')) throw e
                    // Ignore polling errors, keep trying
                }
            }

            if (!launchConfirmed) {
                throw new Error("Transaction sent but confirmation timed out. Check Solana Explorer for status: " + signature)
            }

            console.log("Token launched successfully! Signature:", signature)

            const mintAddress = pdas.mint.toBase58()
            
            // Success! Redirect to token page
            setLaunchStep("Success! Redirecting to token page...")
            await new Promise(r => setTimeout(r, 1500))
            router.push(`/token/${mintAddress}`)

        } catch (err: any) {
            console.error("Launch error:", err)
            setError(err.message || "Failed to launch token")
            setLaunchStep("")
        } finally {
            setIsLoading(false)
        }
    }, [publicKey, connected, name, symbol, imageUri, website, twitter, telegram, initialSol, derivePDAs, connection, signTransaction, router])

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
                                    Create Your Coin
                                </h1>
                                <p className="text-[#9FA6A3] mt-1">
                                    Launch a token with Paper Hand Tax built-in
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Launch Form */}
                    <div className="p-8 rounded-2xl bg-[#141D21] border border-[#2A3338]">

                        {/* Wallet Connection */}
                        {mounted && !connected && (
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

                            {/* Social Links */}
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-[#E9E1D8]">
                                    Social Links (Optional)
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs text-[#5F6A6E] mb-1">Website</label>
                                        <input
                                            type="text"
                                            value={website}
                                            onChange={(e) => setWebsite(e.target.value)}
                                            placeholder="https://mytoken.com"
                                            className="w-full px-3 py-2 rounded-lg bg-[#0E1518] border border-[#2A3338] text-[#E9E1D8] placeholder-[#5F6A6E] focus:outline-none focus:border-[#8C3A32] transition-colors text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-[#5F6A6E] mb-1">X (Twitter)</label>
                                        <input
                                            type="text"
                                            value={twitter}
                                            onChange={(e) => setTwitter(e.target.value)}
                                            placeholder="https://x.com/mytoken"
                                            className="w-full px-3 py-2 rounded-lg bg-[#0E1518] border border-[#2A3338] text-[#E9E1D8] placeholder-[#5F6A6E] focus:outline-none focus:border-[#8C3A32] transition-colors text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-[#5F6A6E] mb-1">Telegram</label>
                                        <input
                                            type="text"
                                            value={telegram}
                                            onChange={(e) => setTelegram(e.target.value)}
                                            placeholder="https://t.me/mytoken"
                                            className="w-full px-3 py-2 rounded-lg bg-[#0E1518] border border-[#2A3338] text-[#E9E1D8] placeholder-[#5F6A6E] focus:outline-none focus:border-[#8C3A32] transition-colors text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Token Specs (Info only, not editable) */}
                            <div className="p-3 rounded-xl bg-[#0E1518] border border-[#2A3338]">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-[#5F6A6E]">Token Supply</span>
                                    <span className="text-[#E9E1D8]">1,000,000,000 (1B)</span>
                                </div>
                                <div className="flex items-center justify-between text-sm mt-2">
                                    <span className="text-[#5F6A6E]">Decimals</span>
                                    <span className="text-[#E9E1D8]">6 (Standard)</span>
                                </div>
                            </div>

                            {/* Initial SOL */}
                            <div>
                                <label className="block text-sm font-medium text-[#E9E1D8] mb-2">
                                    Initial Liquidity (SOL)
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

                            {/* Launch Progress */}
                            {launchStep && (
                                <div className="p-4 rounded-xl bg-blue-900/20 border border-blue-500/30">
                                    <div className="flex items-center gap-3">
                                        <svg className="animate-spin h-5 w-5 text-blue-400" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <p className="text-sm text-blue-400">{launchStep}</p>
                                    </div>
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
                                    "Create PHBT Coin"
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="mt-8 p-6 rounded-2xl bg-[#141D21] border border-[#2A3338]">
                        <h2 className="text-lg font-medium text-[#E9E1D8] mb-4">How It Works</h2>
                        <ul className="space-y-3 text-sm text-[#9FA6A3]">
                            <li className="flex items-start gap-2">
                                <span className="text-[#8C3A32] font-bold">1.</span>
                                <span><strong className="text-[#E9E1D8]">Token Created:</strong> 1B tokens minted to platform pool</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#8C3A32] font-bold">2.</span>
                                <span><strong className="text-[#E9E1D8]">Platform LP (80%):</strong> Creates trading pool on our platform</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#8C3A32] font-bold">3.</span>
                                <span><strong className="text-[#E9E1D8]">Paper Hand Tax:</strong> 50% tax on selling at a loss enforced on all trades</span>
                            </li>
                        </ul>
                        
                        <div className="mt-4 p-3 rounded-lg bg-[#8C3A32]/20 border border-[#8C3A32]/30">
                            <p className="text-xs font-medium text-[#E9E1D8] mb-1">💎 Diamond Hand Protection</p>
                            <p className="text-xs text-[#9FA6A3]">
                                All trading happens on our platform with the Paper Hand Tax enforced.
                                Diamond hands who hold or sell at profit pay no tax!
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </TooltipProvider>
    )
}
