import { PublicKey } from "@solana/web3.js";

// ============================================================================
// ENVIRONMENT CONFIGURATION
// For Vercel: Set these in your Vercel project settings under Environment Variables
// For local dev: Create a .env.local file with these values
// ============================================================================

// Network: "mainnet-beta", "devnet", or "localnet"
// MAINNET ONLY
export const NETWORK = process.env.NEXT_PUBLIC_NETWORK || "mainnet-beta";

// RPC endpoint - QuickNode for mainnet (no rate limits)
export const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT || 
    "https://small-twilight-sponge.solana-mainnet.quiknode.pro/71bdb31dd3e965467b1393cebaaebe69d481dbeb/";

// WebSocket endpoint - QuickNode
export const WS_ENDPOINT = process.env.NEXT_PUBLIC_WS_ENDPOINT || 
    "wss://small-twilight-sponge.solana-mainnet.quiknode.pro/71bdb31dd3e965467b1393cebaaebe69d481dbeb/";

// ============================================================================
// PROGRAM CONFIGURATION
// These are your deployed program addresses
// ============================================================================

// Program ID - MAINNET
export const PROGRAM_ID = new PublicKey(
    process.env.NEXT_PUBLIC_PROGRAM_ID || "Gctn6rSF7vnZoPTDWKfoa9B9f2BKLK46SySeksdp4QhL"
);

// Treasury wallet - where Paper Hand Tax goes
export const TREASURY_WALLET = new PublicKey(
    process.env.NEXT_PUBLIC_TREASURY_WALLET || "HKH4j948aeCsr5kETMeshsDwRvFTuL6gWy4hLSKhqN27"
);

// Default token mint (optional, used for initial display)
export const TOKEN_MINT = new PublicKey(
    process.env.NEXT_PUBLIC_TOKEN_MINT || "ydDccyq66xKtfqn5bsRpfFXz4WeF4fh3bgQBx1npump"
);

// ============================================================================
// TOKEN VISIBILITY CONFIG
// ============================================================================

// Set to false to show all tokens (except those in HIDDEN_TOKENS)
export const HIDE_OLD_TOKENS = false;

// Tokens to ALWAYS show (even if they don't have new metadata)
export const ALLOWED_TOKENS: string[] = [];

// Tokens to ALWAYS hide - test tokens
export const HIDDEN_TOKENS: string[] = [
    "3zgqFV8VtuepFEgUQ6wNhSakSQ6XB1WfpS6XT8zjeDkp",
    "FRjiRVWLqLuxYTRRhSJ1HzQSrS513bssuoJomxdw5PoJ",
    "FKgmk6m8NGvYadit2Dg8M7w8sg9XFKKHoHd1ADeEz3ty",
    "EBHULh39GCWnFSxooRYP1QgagQW5myXCj83osLR7xkUZ",
    "AozoMbDd32HqQ2VNhpXjdaQjq8YkCZ7tGmgpiEA5enjN",
    "9VTTWo9thQYZbFVkudoSzoWPbXMFF72CAcGaMrKEJSRb",
    "Estv2D8YaM7rfx3CfSBwxci18ean6M4D3WPgm3DqfDEE",
    "EyPsGXg7xemEXqWApwvvUswESV5fm5SoD7TYjFtU3nYr",
    "27kLi6kZW6ppbLRTc9mmmAJnYseWq8soViBdSyhHhhEH",
    "53f86n8b6g73PQY3xZH7h2CVadq1KnY23Le1FH3WCmBe",
    "7vqrevF393C2rm3fmqDewrf3TzMPYft1oeceLVPN1k4c",
    "Gp8EJA3s2Q4rfiWYRbWHP62WSi22qRuwtuiqZaLABBEk",
];

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
// REFRESH INTERVALS - Longer intervals to avoid 429 rate limits
// ============================================================================

export const REFRESH_INTERVALS = {
    // Balance refresh (header)
    BALANCE: 30_000,              // 30s
    // Trade panel data
    TRADE_PANEL: 60_000,          // 60s
    // Position card
    POSITION: 60_000,             // 60s
    // Token page data (chart, trades, holdings)
    TOKEN_PAGE: 60_000,           // 60s
    // Treasury card
    TREASURY: 120_000,            // 2 min
    // Activity feed
    ACTIVITY: 120_000,            // 2 min
    // Explore section (coin list)
    EXPLORE: 180_000,             // 3 min
    // SOL price from CoinGecko
    SOL_PRICE: 120_000,           // 2 min
    // Leaderboard
    LEADERBOARD: 120_000,         // 2 min
};
