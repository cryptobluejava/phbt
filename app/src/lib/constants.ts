import { PublicKey } from "@solana/web3.js";

// ============================================================================
// ENVIRONMENT CONFIGURATION
// For Vercel: Set these in your Vercel project settings under Environment Variables
// For local dev: Create a .env.local file with these values
// ============================================================================

// Network: "mainnet-beta", "devnet", or "localnet"
// If NEXT_PUBLIC_NETWORK is not set, default based on NODE_ENV:
// - development -> localnet
// - production -> mainnet-beta
export const NETWORK = process.env.NEXT_PUBLIC_NETWORK || (
    process.env.NODE_ENV === "development" ? "localnet" : "mainnet-beta"
);

// RPC endpoint
export const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT || (
    NETWORK === "mainnet-beta" ? "https://api.mainnet-beta.solana.com" :
        NETWORK === "devnet" ? "https://api.devnet.solana.com" :
            "http://127.0.0.1:8899" // localnet default
);

// WebSocket endpoint
export const WS_ENDPOINT = process.env.NEXT_PUBLIC_WS_ENDPOINT || (
    NETWORK === "mainnet-beta" ? "wss://api.mainnet-beta.solana.com" :
        NETWORK === "devnet" ? "wss://api.devnet.solana.com" :
            "ws://127.0.0.1:8900" // localnet default
);

// ============================================================================
// PROGRAM CONFIGURATION
// These are your deployed program addresses
// ============================================================================

// Program ID (your deployed Solana program)
// Devnet (NEW): DorUpzxXyF9VMGxdaVmBtCtg2SDnnm4pY3Bf9FFFKK6a (with virtual liquidity, clean state)
// Devnet (OLD): 4dZia69H7vGWpJNbzcMP83TaWKFbDyWDRWe1stHDHrMe (config issue)
// Mainnet: 8XQAVjtT1QSYgVp8WzhVdwuSvGfDX9UifZupiLvBe2Lh (old version)
export const PROGRAM_ID = new PublicKey(
    process.env.NEXT_PUBLIC_PROGRAM_ID || "DorUpzxXyF9VMGxdaVmBtCtg2SDnnm4pY3Bf9FFFKK6a"
);

// Treasury wallet - where Paper Hand Tax goes
export const TREASURY_WALLET = new PublicKey(
    process.env.NEXT_PUBLIC_TREASURY_WALLET || "Gi2GLxRgXgtd6pyb378AhA4hcBEjbP6aNFWCfFgaAGoS"
);

// Default token mint (optional, used for initial display)
export const TOKEN_MINT = new PublicKey(
    process.env.NEXT_PUBLIC_TOKEN_MINT || "ydDccyq66xKtfqn5bsRpfFXz4WeF4fh3bgQBx1npump"
);

// ============================================================================
// SUPABASE (Optional - for analytics/tracking)
// ============================================================================

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// ============================================================================
// SEEDS FOR PDAs - Do not change
// ============================================================================

export const CURVE_CONFIG_SEED = "CurveConfiguration";
export const POOL_SEED_PREFIX = "liquidity_pool";
export const POSITION_SEED = "position";
export const TREASURY_VAULT_SEED = "treasury_vault";
export const GLOBAL_SEED = "global";

// ============================================================================
// OTHER CONSTANTS
// ============================================================================

// Default paperhand tax: 50% = 5000 bps
export const DEFAULT_PAPERHAND_TAX_BPS = 5000;

// Lamports per SOL
export const LAMPORTS_PER_SOL = 1_000_000_000;

// Metaplex Token Metadata Program ID (standard, never changes)
export const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

// ============================================================================
// HELPER: Check if we're on mainnet
// ============================================================================
export const IS_MAINNET = NETWORK === "mainnet-beta";

// ============================================================================
// REFRESH INTERVALS (slower on devnet to avoid rate limiting)
// ============================================================================
const IS_DEVNET = NETWORK === "devnet";

export const REFRESH_INTERVALS = {
    // Balance refresh (header)
    BALANCE: IS_DEVNET ? 30_000 : 10_000,           // 30s devnet, 10s mainnet
    // Trade panel data
    TRADE_PANEL: IS_DEVNET ? 45_000 : 15_000,        // 45s devnet, 15s mainnet
    // Position card
    POSITION: IS_DEVNET ? 45_000 : 15_000,           // 45s devnet, 15s mainnet
    // Token page data (chart, trades, holdings)
    TOKEN_PAGE: IS_DEVNET ? 60_000 : 30_000,         // 60s devnet, 30s mainnet
    // Treasury card
    TREASURY: IS_DEVNET ? 60_000 : 30_000,           // 60s devnet, 30s mainnet
    // Activity feed
    ACTIVITY: IS_DEVNET ? 60_000 : 30_000,           // 60s devnet, 30s mainnet
    // Explore section (coin list)
    EXPLORE: IS_DEVNET ? 120_000 : 60_000,           // 120s devnet, 60s mainnet
    // SOL price from CoinGecko
    SOL_PRICE: IS_DEVNET ? 120_000 : 60_000,         // 120s devnet, 60s mainnet
    // Leaderboard
    LEADERBOARD: IS_DEVNET ? 60_000 : 30_000,        // 60s devnet, 30s mainnet
};
