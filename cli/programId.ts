import { PublicKey } from "@solana/web3.js"

// Program ID defined in the environment or IDL.
// This matches the deployed program ID.
export const PROGRAM_ID_IDL = new PublicKey(
  process.env.PROGRAM_ID || "11111111111111111111111111111111"
)

// This constant will not get overwritten on subsequent code generations and it's safe to modify it's value.
export const PROGRAM_ID: PublicKey = PROGRAM_ID_IDL
