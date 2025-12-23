import { PublicKey } from "@solana/web3.js";
import {
  PROGRAM_ID,
  CURVE_CONFIG_SEED,
  POOL_SEED_PREFIX,
  POSITION_SEED,
  TREASURY_VAULT_SEED,
  GLOBAL_SEED,
  TOKEN_METADATA_PROGRAM_ID
} from "./constants";

// Metaplex Token Metadata Program ID - imported from constants

/**
 * Derive the CurveConfiguration PDA
 */
export function getCurveConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(CURVE_CONFIG_SEED)],
    PROGRAM_ID
  );
}

/**
 * Derive the pool PDA for a given mint
 */
export function getPoolPDA(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(POOL_SEED_PREFIX), mint.toBuffer()],
    PROGRAM_ID
  );
}

/**
 * Derive the user position PDA for tracking cost basis
 */
export function getUserPositionPDA(pool: PublicKey, user: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(POSITION_SEED), pool.toBuffer(), user.toBuffer()],
    PROGRAM_ID
  );
}

/**
 * Derive the treasury vault PDA
 */
export function getTreasuryVaultPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(TREASURY_VAULT_SEED)],
    PROGRAM_ID
  );
}

/**
 * Derive the global account PDA (holds pool SOL)
 */
export function getGlobalPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(GLOBAL_SEED)],
    PROGRAM_ID
  );
}

/**
 * Derive the Mint PDA for a new token launch (based on symbol)
 */
export function getMintPDA(symbol: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("mint"), Buffer.from(symbol)],
    PROGRAM_ID
  );
}

/**
 * Derive the Metaplex Metadata PDA for a given mint
 */
export function getMetadataPDA(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
}

/**
 * Get all PDAs for a given mint
 */
export function getAllPDAs(mint: PublicKey) {
  const [curveConfig, curveConfigBump] = getCurveConfigPDA();
  const [pool, poolBump] = getPoolPDA(mint);
  const [treasuryVault, treasuryBump] = getTreasuryVaultPDA();
  const [global, globalBump] = getGlobalPDA();
  const [metadata, metadataBump] = getMetadataPDA(mint);

  return {
    curveConfig,
    curveConfigBump,
    pool,
    poolBump,
    treasuryVault,
    treasuryBump,
    global,
    globalBump,
    metadata,
    metadataBump,
  };
}

/**
 * Get all PDAs for launching a new token (uses symbol to derive mint)
 */
export function getLaunchPDAs(symbol: string, creator: PublicKey) {
  const [mint, mintBump] = getMintPDA(symbol);
  const [curveConfig, curveConfigBump] = getCurveConfigPDA();
  const [pool, poolBump] = getPoolPDA(mint);
  const [treasuryVault, treasuryBump] = getTreasuryVaultPDA();
  const [global, globalBump] = getGlobalPDA();
  const [metadata, metadataBump] = getMetadataPDA(mint);

  // Liquidity provider PDA for creator
  const [liquidityProvider, lpBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("LiqudityProvider"), pool.toBuffer(), creator.toBuffer()],
    PROGRAM_ID
  );

  return {
    mint,
    mintBump,
    curveConfig,
    curveConfigBump,
    pool,
    poolBump,
    treasuryVault,
    treasuryBump,
    global,
    globalBump,
    metadata,
    metadataBump,
    liquidityProvider,
    lpBump,
  };
}

