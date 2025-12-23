import { PublicKey } from "@solana/web3.js";

// ============================================================================
// ENVIRONMENT CONFIGURATION
// For Vercel: Set these in your Vercel project settings under Environment Variables
// For local dev: Create a .env.local file with these values
// ============================================================================

// Network: "mainnet-beta" or "devnet"
export const NETWORK = process.env.NEXT_PUBLIC_NETWORK || "mainnet-beta";

// RPC endpoint - Use a reliable RPC provider for mainnet (Helius, QuickNode, etc.)
export const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT || (
    NETWORK === "mainnet-beta"
        ? "https://api.mainnet-beta.solana.com"
        : "https://api.devnet.solana.com"
);

// WebSocket endpoint
export const WS_ENDPOINT = process.env.NEXT_PUBLIC_WS_ENDPOINT || (
    NETWORK === "mainnet-beta"
        ? "wss://api.mainnet-beta.solana.com"
        : "wss://api.devnet.solana.com"
);

// ============================================================================
// PROGRAM CONFIGURATION
// These are your deployed program addresses
// ============================================================================

// Program ID (your deployed Solana program)
export const PROGRAM_ID = new PublicKey(
    process.env.NEXT_PUBLIC_PROGRAM_ID || "8XQAVjtT1QSYgVp8WzhVdwuSvGfDX9UifZupiLvBe2Lh"
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
