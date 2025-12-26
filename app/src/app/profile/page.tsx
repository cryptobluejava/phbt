"use client"

import { useState, useEffect, useCallback } from "react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js"
import Link from "next/link"
import { 
    Trophy, Star, Flame, Diamond, Skull, Rocket, 
    TrendingUp, TrendingDown, Coins, Clock, Target,
    Award, Medal, Crown, Zap, Heart, Shield
} from "lucide-react"
import { 
    ACHIEVEMENTS, 
    Achievement, 
    UserStats,
    getLocalAchievements,
    isDatabaseConfigured,
    fetchUserProfile
} from "@/lib/database"

// Achievement icon mapping
const ACHIEVEMENT_ICONS: Record<string, React.ReactNode> = {
    '🩸': <Flame className="w-6 h-6" />,
    '📄': <TrendingDown className="w-6 h-6" />,
    '🚀': <Rocket className="w-6 h-6" />,
    '📈': <TrendingUp className="w-6 h-6" />,
    '🤖': <Zap className="w-6 h-6" />,
    '👑': <Crown className="w-6 h-6" />,
    '🐟': <Coins className="w-6 h-6" />,
    '🐠': <Coins className="w-6 h-6" />,
    '🐋': <Coins className="w-6 h-6" />,
    '🐳': <Coins className="w-6 h-6" />,
    '✨': <Star className="w-6 h-6" />,
    '🏭': <Target className="w-6 h-6" />,
    '🏰': <Shield className="w-6 h-6" />,
    '💎': <Diamond className="w-6 h-6" />,
    '🗿': <Shield className="w-6 h-6" />,
    '🔥': <Flame className="w-6 h-6" />,
    '🌋': <Flame className="w-6 h-6" />,
    '🧻': <Skull className="w-6 h-6" />,
    '😢': <Skull className="w-6 h-6" />,
    '💸': <Coins className="w-6 h-6" />,
    '🏦': <Coins className="w-6 h-6" />,
    '👀': <Star className="w-6 h-6" />,
    '🔭': <Target className="w-6 h-6" />,
    '🌅': <Award className="w-6 h-6" />,
    '🏆': <Trophy className="w-6 h-6" />,
}

export default function ProfilePage() {
    const { connection } = useConnection()
    const { connected, publicKey } = useWallet()
    const [mounted, setMounted] = useState(false)
    const [achievements, setAchievements] = useState<Achievement[]>([])
    const [stats, setStats] = useState<UserStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [walletBalance, setWalletBalance] = useState<number | null>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Fetch wallet balance
    useEffect(() => {
        if (!connected || !publicKey) {
            setWalletBalance(null)
            return
        }

        const fetchBalance = async () => {
            try {
                const balance = await connection.getBalance(publicKey)
                setWalletBalance(balance / LAMPORTS_PER_SOL)
            } catch (e) {
                console.error("Failed to fetch balance:", e)
            }
        }

        fetchBalance()
    }, [connected, publicKey, connection])

    // Fetch user profile and achievements
    const fetchProfile = useCallback(async () => {
        if (!publicKey) return

        setIsLoading(true)
        try {
            // Try database first (fast)
            if (isDatabaseConfigured()) {
                const profile = await fetchUserProfile(publicKey.toBase58())
                if (profile) {
                    setAchievements(profile.achievements || [])
                    setStats(profile.stats as UserStats || null)
                    setIsLoading(false)
                    return
                }
            }

            // Fall back to local storage (instant)
            const localAchievements = getLocalAchievements()
            
            // Use default empty stats - achievements will be populated as user trades
            const emptyStats: UserStats = {
                totalTrades: 0,
                totalBuys: 0,
                totalSells: 0,
                totalVolumeSol: 0,
                tokensCreated: 0,
                profitableTrades: 0,
                paperHandTaxPaid: 0,
                diamondHandHolds: 0,
                firstTradeAt: null,
            }
            setStats(emptyStats)

            // Calculate achievements based on local data
            const calculatedAchievements = calculateAchievements(emptyStats, localAchievements)
            setAchievements(calculatedAchievements)

        } catch (error) {
            console.error("Failed to fetch profile:", error)
        } finally {
            setIsLoading(false)
        }
    }, [publicKey])

    // Calculate achievements based on stats
    const calculateAchievements = (stats: UserStats, existing: Achievement[]): Achievement[] => {
        const now = new Date().toISOString()
        
        return ACHIEVEMENTS.map(def => {
            const existingAchievement = existing.find(a => a.id === def.id)
            let unlockedAt = existingAchievement?.unlockedAt || null
            let progress = 0

            // Calculate progress based on achievement type
            if (def.id === 'first_buy' && stats.totalBuys >= 1) {
                unlockedAt = unlockedAt || now
                progress = 1
            } else if (def.id === 'first_sell' && stats.totalSells >= 1) {
                unlockedAt = unlockedAt || now
                progress = 1
            } else if (def.id.startsWith('trades_')) {
                const target = def.target || 1
                progress = Math.min(stats.totalTrades, target)
                if (stats.totalTrades >= target) {
                    unlockedAt = unlockedAt || now
                }
            } else if (def.id.startsWith('volume_')) {
                const target = def.target || 1
                progress = Math.min(stats.totalVolumeSol, target)
                if (stats.totalVolumeSol >= target) {
                    unlockedAt = unlockedAt || now
                }
            } else if (def.id === 'first_token' && stats.tokensCreated >= 1) {
                unlockedAt = unlockedAt || now
                progress = 1
            } else if (def.id.startsWith('tokens_')) {
                const target = def.target || 1
                progress = Math.min(stats.tokensCreated, target)
                if (stats.tokensCreated >= target) {
                    unlockedAt = unlockedAt || now
                }
            } else if (def.id.startsWith('paper_tax_')) {
                const target = def.target || 1
                progress = Math.min(stats.paperHandTaxPaid, target)
                if (stats.paperHandTaxPaid >= target) {
                    unlockedAt = unlockedAt || now
                }
            }

            return {
                ...def,
                unlockedAt,
                progress,
            }
        })
    }

    useEffect(() => {
        if (connected && publicKey) {
            fetchProfile()
        }
    }, [connected, publicKey, fetchProfile])

    const unlockedCount = achievements.filter(a => a.unlockedAt).length
    const totalCount = achievements.length

    return (
        <div className="min-h-screen bg-[#0E1518]">
            <div className="max-w-4xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/" className="text-sm text-[#9FA6A3] hover:text-[#E9E1D8] transition-colors">
                        ← Back to Trading
                    </Link>
                    <div className="flex items-center gap-4 mt-4 mb-6">
                        <div className="w-1 h-12 bg-[#8C3A32]" />
                        <div>
                            <h1 className="text-3xl font-medium text-[#E9E1D8] tracking-tight">
                                Your Profile
                            </h1>
                            <p className="text-[#9FA6A3] mt-1">
                                Track your achievements and trading stats
                            </p>
                        </div>
                    </div>
                </div>

                {/* Not Connected State */}
                {mounted && !connected && (
                    <div className="p-12 rounded-2xl bg-[#141D21] border border-[#2A3338] text-center">
                        <Trophy className="w-16 h-16 text-[#5F6A6E] mx-auto mb-4" />
                        <h2 className="text-xl font-medium text-[#E9E1D8] mb-2">Connect Your Wallet</h2>
                        <p className="text-[#9FA6A3] mb-6">Connect your wallet to view your profile and achievements</p>
                        <WalletMultiButton className="!bg-[#8C3A32] !rounded-lg" />
                    </div>
                )}

                {/* Connected State */}
                {mounted && connected && publicKey && (
                    <>
                        {/* Wallet Info */}
                        <div className="p-6 rounded-2xl bg-[#141D21] border border-[#2A3338] mb-6">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#8C3A32] to-[#A04438] flex items-center justify-center">
                                        <span className="text-2xl">👤</span>
                                    </div>
                                    <div>
                                        <p className="text-sm text-[#5F6A6E]">Connected Wallet</p>
                                        <p className="text-[#E9E1D8] font-mono text-sm">
                                            {publicKey.toBase58().slice(0, 8)}...{publicKey.toBase58().slice(-8)}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-[#5F6A6E]">Balance</p>
                                    <p className="text-xl font-bold text-[#E9E1D8]">
                                        {walletBalance !== null ? `${walletBalance.toFixed(4)} SOL` : '...'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        {stats && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <div className="p-4 rounded-xl bg-[#141D21] border border-[#2A3338]">
                                    <TrendingUp className="w-5 h-5 text-[#8C3A32] mb-2" />
                                    <p className="text-2xl font-bold text-[#E9E1D8]">{stats.totalTrades}</p>
                                    <p className="text-xs text-[#5F6A6E]">Total Trades</p>
                                </div>
                                <div className="p-4 rounded-xl bg-[#141D21] border border-[#2A3338]">
                                    <Coins className="w-5 h-5 text-amber-500 mb-2" />
                                    <p className="text-2xl font-bold text-[#E9E1D8]">{stats.totalVolumeSol.toFixed(2)}</p>
                                    <p className="text-xs text-[#5F6A6E]">Volume (SOL)</p>
                                </div>
                                <div className="p-4 rounded-xl bg-[#141D21] border border-[#2A3338]">
                                    <Rocket className="w-5 h-5 text-purple-500 mb-2" />
                                    <p className="text-2xl font-bold text-[#E9E1D8]">{stats.tokensCreated}</p>
                                    <p className="text-xs text-[#5F6A6E]">Tokens Created</p>
                                </div>
                                <div className="p-4 rounded-xl bg-[#141D21] border border-[#2A3338]">
                                    <Skull className="w-5 h-5 text-red-500 mb-2" />
                                    <p className="text-2xl font-bold text-[#E9E1D8]">{stats.paperHandTaxPaid.toFixed(3)}</p>
                                    <p className="text-xs text-[#5F6A6E]">Tax Paid (SOL)</p>
                                </div>
                            </div>
                        )}

                        {/* Achievements Section */}
                        <div className="p-6 rounded-2xl bg-[#141D21] border border-[#2A3338]">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <Trophy className="w-6 h-6 text-amber-500" />
                                    <h2 className="text-xl font-medium text-[#E9E1D8]">Achievements</h2>
                                </div>
                                <div className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm font-medium">
                                    {unlockedCount}/{totalCount} Unlocked
                                </div>
                            </div>

                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin w-8 h-8 border-2 border-[#8C3A32] border-t-transparent rounded-full" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {achievements.map((achievement) => {
                                        const isUnlocked = !!achievement.unlockedAt
                                        const progress = achievement.progress || 0
                                        const target = achievement.target || 1
                                        const progressPercent = Math.min((progress / target) * 100, 100)

                                        return (
                                            <div
                                                key={achievement.id}
                                                className={`p-4 rounded-xl border transition-all ${
                                                    isUnlocked
                                                        ? 'bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/30'
                                                        : 'bg-[#0E1518] border-[#2A3338] opacity-60'
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                                                        isUnlocked ? 'bg-amber-500/20' : 'bg-[#1A2428]'
                                                    }`}>
                                                        {achievement.emoji}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className={`font-medium truncate ${
                                                            isUnlocked ? 'text-amber-400' : 'text-[#9FA6A3]'
                                                        }`}>
                                                            {achievement.name}
                                                        </h3>
                                                        <p className="text-xs text-[#5F6A6E] mt-0.5">
                                                            {achievement.description}
                                                        </p>
                                                        
                                                        {/* Progress bar for non-unlocked achievements */}
                                                        {!isUnlocked && achievement.target && (
                                                            <div className="mt-2">
                                                                <div className="h-1.5 bg-[#1A2428] rounded-full overflow-hidden">
                                                                    <div 
                                                                        className="h-full bg-[#8C3A32] rounded-full transition-all"
                                                                        style={{ width: `${progressPercent}%` }}
                                                                    />
                                                                </div>
                                                                <p className="text-xs text-[#5F6A6E] mt-1">
                                                                    {progress}/{target}
                                                                </p>
                                                            </div>
                                                        )}
                                                        
                                                        {isUnlocked && (
                                                            <p className="text-xs text-amber-500/70 mt-1">
                                                                ✓ Unlocked
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Coming Soon */}
                        <div className="mt-6 p-6 rounded-2xl bg-[#141D21] border border-[#2A3338] border-dashed">
                            <div className="text-center">
                                <Heart className="w-8 h-8 text-[#5F6A6E] mx-auto mb-3" />
                                <h3 className="text-lg font-medium text-[#E9E1D8] mb-1">More Coming Soon</h3>
                                <p className="text-sm text-[#5F6A6E]">
                                    Trading history, leaderboards, and exclusive badges
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

