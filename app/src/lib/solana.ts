import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import { PROGRAM_ID, RPC_ENDPOINT } from "./constants";

// IDL types - simplified for frontend
export interface CurveConfiguration {
  fees: number;
  treasury: PublicKey;
  paperhandTaxBps: number;
}

export interface LiquidityPool {
  tokenOne: PublicKey;
  tokenTwo: PublicKey;
  totalSupply: BN;
  reserveOne: BN;
  reserveTwo: BN;
  virtualSolReserve: BN; // Virtual SOL for price calculations (0 for old pools)
  bump: number;
}

export interface UserPosition {
  pool: PublicKey;
  owner: PublicKey;
  totalTokens: BN;
  totalSol: BN;
  bump: number;
}

// Connection helper - uses QuickNode by default
export function getConnection(): Connection {
  return new Connection(RPC_ENDPOINT, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000,
  });
}

// Minimal IDL for account parsing
export const IDL = {
  version: "0.1.0",
  name: "pump",
  instructions: [],
  accounts: [
    {
      name: "curveConfiguration",
      type: {
        kind: "struct",
        fields: [
          { name: "fees", type: "f64" },
          { name: "treasury", type: "publicKey" },
          { name: "paperhandTaxBps", type: "u16" }
        ]
      }
    },
    {
      name: "liquidityPool",
      type: {
        kind: "struct",
        fields: [
          { name: "tokenOne", type: "publicKey" },
          { name: "tokenTwo", type: "publicKey" },
          { name: "totalSupply", type: "u64" },
          { name: "reserveOne", type: "u64" },
          { name: "reserveTwo", type: "u64" },
          { name: "virtualSolReserve", type: "u64" },
          { name: "bump", type: "u8" }
        ]
      }
    },
    {
      name: "userPosition",
      type: {
        kind: "struct",
        fields: [
          { name: "pool", type: "publicKey" },
          { name: "owner", type: "publicKey" },
          { name: "totalTokens", type: "u64" },
          { name: "totalSol", type: "u64" },
          { name: "bump", type: "u8" }
        ]
      }
    }
  ]
} as const;

/**
 * Get program instance
 */
export function getProgram(provider: AnchorProvider) {
  // @ts-expect-error - simplified IDL type
  return new Program(IDL, PROGRAM_ID, provider);
}

/**
 * Fetch curve configuration
 */
export async function fetchCurveConfig(
  connection: Connection,
  configPDA: PublicKey
): Promise<CurveConfiguration | null> {
  try {
    const accountInfo = await connection.getAccountInfo(configPDA);
    if (!accountInfo) return null;

    // Parse account data (skip 8-byte discriminator)
    // CurveConfiguration layout: fees:u16, treasury:Pubkey, paperhand_tax_bps:u16, admin:Pubkey, default_virtual_sol:u64
    const data = accountInfo.data.slice(8);
    const fees = data.readUInt16LE(0);  // u16, 2 bytes
    const treasury = new PublicKey(data.slice(2, 34));  // Pubkey, 32 bytes
    const paperhandTaxBps = data.readUInt16LE(34);  // u16, 2 bytes

    return { fees, treasury, paperhandTaxBps };
  } catch (e) {
    // Silent fail - account may not exist yet
    return null;
  }
}

/**
 * Fetch liquidity pool - supports both old (97-byte) and new (105-byte) formats
 */
export async function fetchPool(
  connection: Connection,
  poolPDA: PublicKey
): Promise<LiquidityPool | null> {
  try {
    const accountInfo = await connection.getAccountInfo(poolPDA);
    if (!accountInfo) return null;

    const data = accountInfo.data.slice(8);
    const tokenOne = new PublicKey(data.slice(0, 32));
    const tokenTwo = new PublicKey(data.slice(32, 64));
    const totalSupply = new BN(data.slice(64, 72), 'le');
    const reserveOne = new BN(data.slice(72, 80), 'le');
    const reserveTwo = new BN(data.slice(80, 88), 'le');

    // Detect format by account size: old = 97, new = 105
    const isNewFormat = accountInfo.data.length === 105;
    const virtualSolReserve = isNewFormat
      ? new BN(data.slice(88, 96), 'le')
      : new BN(0);
    const bump = isNewFormat ? data[96] : data[88];

    return { tokenOne, tokenTwo, totalSupply, reserveOne, reserveTwo, virtualSolReserve, bump };
  } catch (e) {
    // Silent fail - account may not exist yet
    return null;
  }
}

/**
 * Fetch user position
 */
export async function fetchUserPosition(
  connection: Connection,
  positionPDA: PublicKey
): Promise<UserPosition | null> {
  try {
    const accountInfo = await connection.getAccountInfo(positionPDA);
    if (!accountInfo) return null;

    const data = accountInfo.data.slice(8);
    const pool = new PublicKey(data.slice(0, 32));
    const owner = new PublicKey(data.slice(32, 64));
    const totalTokens = new BN(data.slice(64, 72), 'le');
    const totalSol = new BN(data.slice(72, 80), 'le');
    const bump = data[80];

    return { pool, owner, totalTokens, totalSol, bump };
  } catch (e) {
    // Silent fail - account may not exist yet
    return null;
  }
}

/**
 * Calculate swap output using bonding curve formula
 * dy = ydx / (x + dx)
 */
export function calculateSwapOutput(
  amountIn: number,
  reserveIn: number,
  reserveOut: number,
  feePct: number = 1
): number {
  if (reserveIn === 0 || reserveOut === 0) return 0;

  // Apply fee
  const adjustedAmountIn = amountIn * (1 - feePct / 100);

  // Constant product formula
  const numerator = reserveOut * adjustedAmountIn;
  const denominator = reserveIn + adjustedAmountIn;

  return Math.floor(numerator / denominator);
}

/**
 * Calculate tokens received for SOL input (buy)
 */
export function calculateBuyOutput(
  solAmount: number,
  solReserve: number,
  tokenReserve: number,
  feePct: number = 1
): number {
  return calculateSwapOutput(solAmount, solReserve, tokenReserve, feePct);
}

/**
 * Calculate SOL received for token input (sell)
 */
export function calculateSellOutput(
  tokenAmount: number,
  tokenReserve: number,
  solReserve: number,
  feePct: number = 1
): number {
  return calculateSwapOutput(tokenAmount, tokenReserve, solReserve, feePct);
}
