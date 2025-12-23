import { LAMPORTS_PER_SOL } from "./constants";

/**
 * Format lamports to SOL with specified decimals
 */
export function formatLamportsToSol(lamports: number | bigint, decimals: number = 4): string {
  const sol = Number(lamports) / LAMPORTS_PER_SOL;
  return sol.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format token amount with decimals
 */
export function formatTokenAmount(amount: number | bigint, tokenDecimals: number = 6, displayDecimals: number = 2): string {
  const formatted = Number(amount) / Math.pow(10, tokenDecimals);
  return formatted.toLocaleString('en-US', {
    minimumFractionDigits: displayDecimals,
    maximumFractionDigits: displayDecimals,
  });
}

/**
 * Format a public key to shortened form
 */
export function shortenPubkey(pubkey: string, chars: number = 4): string {
  if (pubkey.length <= chars * 2 + 3) return pubkey;
  return `${pubkey.slice(0, chars)}...${pubkey.slice(-chars)}`;
}

/**
 * Parse SOL input to lamports
 */
export function solToLamports(sol: string | number): number {
  return Math.floor(Number(sol) * LAMPORTS_PER_SOL);
}

/**
 * Parse token input to raw amount
 */
export function parseTokenAmount(amount: string | number, decimals: number = 6): number {
  return Math.floor(Number(amount) * Math.pow(10, decimals));
}

/**
 * Calculate cost basis for a sale
 */
export function calculateCostBasisForSale(
  totalSol: number,
  totalTokens: number,
  tokenAmount: number
): number {
  if (totalTokens === 0) return 0;
  return Math.floor((totalSol * tokenAmount) / totalTokens);
}

/**
 * Calculate if sale is at a loss
 */
export function isLoss(solOut: number, costBasis: number): boolean {
  return solOut < costBasis;
}

/**
 * Calculate tax amount
 */
export function calculateTax(solAmount: number, taxBps: number): number {
  return Math.floor((solAmount * taxBps) / 10000);
}

/**
 * Format percentage
 */
export function formatPercentage(bps: number): string {
  return `${(bps / 100).toFixed(1)}%`;
}

/**
 * Format timestamp to relative time
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/**
 * Get Solscan base URL for current network
 */
export function getSolscanCluster(): string {
  // Import dynamically to avoid circular dependencies
  const network = process.env.NEXT_PUBLIC_NETWORK || "mainnet-beta";
  return network === "mainnet-beta" ? "" : "?cluster=devnet";
}

/**
 * Get Solscan URL for a transaction
 */
export function getSolscanTxUrl(signature: string): string {
  return `https://solscan.io/tx/${signature}${getSolscanCluster()}`;
}

/**
 * Get Solscan URL for an account/wallet
 */
export function getSolscanAccountUrl(address: string): string {
  return `https://solscan.io/account/${address}${getSolscanCluster()}`;
}

/**
 * Get Solscan URL for a token
 */
export function getSolscanTokenUrl(mint: string): string {
  return `https://solscan.io/token/${mint}${getSolscanCluster()}`;
}

