import { Connection, PublicKey, Transaction, TransactionInstruction, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { BN } from "bn.js";
import { PROGRAM_ID, CURVE_CONFIG_SEED, POOL_SEED_PREFIX, GLOBAL_SEED, TREASURY_WALLET, TOKEN_METADATA_PROGRAM_ID } from "./constants";
import { getCurveConfigPDA } from "./pdas";

// Metaplex Token Metadata Program ID - imported from constants

// Instruction discriminators (first 8 bytes of sha256 hash of "global:launch")
const LAUNCH_DISCRIMINATOR = Buffer.from([153, 241, 93, 225, 22, 69, 74, 61]);

export interface LaunchParams {
    name: string;
    symbol: string;
    uri: string;
    decimals: number;
    initialSupply: bigint;
    initialSolReserve: bigint;
}

/**
 * Derive all PDAs needed for the launch instruction
 */
export function getLaunchPDAs(symbol: string, creator: PublicKey) {
    // Mint PDA
    const [mint, mintBump] = PublicKey.findProgramAddressSync(
        [Buffer.from("mint"), Buffer.from(symbol)],
        PROGRAM_ID
    );

    // Metadata PDA
    const [metadata, metadataBump] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("metadata"),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            mint.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
    );

    // Pool PDA
    const [pool, poolBump] = PublicKey.findProgramAddressSync(
        [Buffer.from(POOL_SEED_PREFIX), mint.toBuffer()],
        PROGRAM_ID
    );

    // Global PDA
    const [global, globalBump] = PublicKey.findProgramAddressSync(
        [Buffer.from(GLOBAL_SEED)],
        PROGRAM_ID
    );

    // Curve Config PDA
    const [curveConfig, curveConfigBump] = PublicKey.findProgramAddressSync(
        [Buffer.from(CURVE_CONFIG_SEED)],
        PROGRAM_ID
    );

    // Pool token account (ATA for global)
    const poolTokenAccount = getAssociatedTokenAddressSync(mint, global, true);

    return {
        mint,
        mintBump,
        metadata,
        metadataBump,
        pool,
        poolBump,
        global,
        globalBump,
        curveConfig,
        curveConfigBump,
        poolTokenAccount,
    };
}

// Import full IDL json
import IDL from "./idl/pump.json";
import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";

/**
 * Create a launch transaction
 */
export async function createLaunchTransaction(
    connection: Connection,
    params: LaunchParams,
    creator: PublicKey
): Promise<Transaction> {
    // 1. Setup minimal Anchor Provider (read-only is fine for building instruction)
    const provider = new AnchorProvider(
        connection,
        {
            publicKey: creator,
            signTransaction: async (tx) => tx,
            signAllTransactions: async (txs) => txs,
        },
        AnchorProvider.defaultOptions()
    );

    // 2. Initialize Program
    const program = new Program(IDL as Idl, provider);

    // 3. Derive PDAs (still needed for accounts)
    const pdas = getLaunchPDAs(params.symbol, creator);

    // 4. Build Instruction using Anchor
    // program.methods.launch(name, symbol, uri, decimals, initialSupply, initialSolReserve)
    const instruction = await program.methods
        .launch(
            params.name,
            params.symbol,
            params.uri,
            params.decimals,
            new BN(params.initialSupply.toString()),
            new BN(params.initialSolReserve.toString())
        )
        .accounts({
            dexConfigurationAccount: pdas.curveConfig,
            mint: pdas.mint,
            metadata: pdas.metadata,
            pool: pdas.pool,
            globalAccount: pdas.global,
            poolTokenAccount: pdas.poolTokenAccount,
            creator: creator,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            metadataProgram: TOKEN_METADATA_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
        })
        .instruction();

    const transaction = new Transaction();
    transaction.add(instruction);

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = creator;

    return transaction;
}

// ============================================================================
// SWAP INSTRUCTION
// ============================================================================

// Instruction discriminator for swap (first 8 bytes of sha256 hash of "global:swap")
const SWAP_DISCRIMINATOR = Buffer.from([248, 198, 158, 145, 225, 117, 135, 200]);

export interface SwapParams {
    amount: bigint;
    style: number; // 1 = SELL, 2 = BUY
}

/**
 * Derive all PDAs needed for the swap instruction
 */
export function getSwapPDAs(mint: PublicKey, user: PublicKey) {
    // Curve Config PDA
    const [curveConfig] = PublicKey.findProgramAddressSync(
        [Buffer.from(CURVE_CONFIG_SEED)],
        PROGRAM_ID
    );

    // Pool PDA
    const [pool] = PublicKey.findProgramAddressSync(
        [Buffer.from(POOL_SEED_PREFIX), mint.toBuffer()],
        PROGRAM_ID
    );

    // Global PDA (holds SOL)
    const [global] = PublicKey.findProgramAddressSync(
        [Buffer.from(GLOBAL_SEED)],
        PROGRAM_ID
    );

    // Treasury Wallet (User provided)
    const treasuryVault = TREASURY_WALLET;

    // User Position PDA
    const [userPosition] = PublicKey.findProgramAddressSync(
        [Buffer.from("position"), pool.toBuffer(), user.toBuffer()],
        PROGRAM_ID
    );

    // Pool token account (ATA for global)
    const poolTokenAccount = getAssociatedTokenAddressSync(mint, global, true);

    // User token account
    const userTokenAccount = getAssociatedTokenAddressSync(mint, user);

    return {
        curveConfig,
        pool,
        global,
        treasuryVault,
        userPosition,
        poolTokenAccount,
        userTokenAccount,
    };
}

/**
 * Build the swap instruction
 */
export function buildSwapInstruction(
    params: SwapParams,
    mint: PublicKey,
    user: PublicKey
): TransactionInstruction {
    const pdas = getSwapPDAs(mint, user);

    // Encode instruction data
    // Format: discriminator (8) + amount (8) + style (8)
    const data = Buffer.alloc(8 + 8 + 8);

    let offset = 0;

    // Discriminator
    SWAP_DISCRIMINATOR.copy(data, offset);
    offset += 8;

    // Amount (u64 little endian)
    const amountBN = new BN(params.amount.toString());
    amountBN.toArrayLike(Buffer, 'le', 8).copy(data, offset);
    offset += 8;

    // Style (u64 little endian)
    const styleBN = new BN(params.style);
    styleBN.toArrayLike(Buffer, 'le', 8).copy(data, offset);

    // Build instruction keys (from test file and Rust struct)
    const keys = [
        { pubkey: pdas.curveConfig, isSigner: false, isWritable: true },    // dex_configuration_account
        { pubkey: pdas.pool, isSigner: false, isWritable: true },           // pool
        { pubkey: pdas.global, isSigner: false, isWritable: true },         // global_account
        { pubkey: pdas.treasuryVault, isSigner: false, isWritable: true },  // treasury_vault
        { pubkey: pdas.userPosition, isSigner: false, isWritable: true },   // user_position
        { pubkey: mint, isSigner: false, isWritable: true },                // mint_token_one
        { pubkey: pdas.poolTokenAccount, isSigner: false, isWritable: true }, // pool_token_account_one
        { pubkey: pdas.userTokenAccount, isSigner: false, isWritable: true }, // user_token_account_one
        { pubkey: user, isSigner: true, isWritable: true },                 // user
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }, // rent
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },   // token_program
        { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // associated_token_program
    ];

    return new TransactionInstruction({
        programId: PROGRAM_ID,
        keys,
        data,
    });
}

/**
 * Create a swap transaction
 * Automatically creates user token account if it doesn't exist
 */
export async function createSwapTransaction(
    connection: Connection,
    params: SwapParams,
    mint: PublicKey,
    user: PublicKey
): Promise<Transaction> {
    const { ComputeBudgetProgram } = await import("@solana/web3.js");
    const { createAssociatedTokenAccountInstruction } = await import("@solana/spl-token");

    const pdas = getSwapPDAs(mint, user);
    const transaction = new Transaction();

    // Add compute budget for complex swap instruction
    transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 200_000 })
    );

    // Check if user token account exists, create if not (for buys)
    if (params.style === 2) { // BUY
        const userTokenAccountInfo = await connection.getAccountInfo(pdas.userTokenAccount);
        if (!userTokenAccountInfo) {
            transaction.add(
                createAssociatedTokenAccountInstruction(
                    user,
                    pdas.userTokenAccount,
                    user,
                    mint
                )
            );
        }
    }

    // Add swap instruction
    const swapInstruction = buildSwapInstruction(params, mint, user);
    transaction.add(swapInstruction);

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = user;

    return transaction;
}

/**
 * Update curve configuration (Admin only)
 */
export async function createUpdateConfigTransaction(
    connection: Connection,
    newTreasury: PublicKey,
    newFees: number | null,
    admin: PublicKey
): Promise<Transaction> {
    // Import dynamically to avoid circular deps if any, matching createSwapTransaction pattern
    const { AnchorProvider, Program } = await import("@coral-xyz/anchor");
    const { default: IDL } = await import("./idl/pump.json");

    const provider = new AnchorProvider(
        connection,
        {
            publicKey: admin,
            signTransaction: async (tx) => tx,
            signAllTransactions: async (txs) => txs,
        },
        AnchorProvider.defaultOptions()
    );

    const program = new Program(IDL as Idl, provider);
    const [curveConfig] = getCurveConfigPDA();

    const instruction = await program.methods
        .updateConfiguration(newTreasury, newFees)
        .accounts({
            dexConfigurationAccount: curveConfig,
            admin: admin,
        })
        .instruction();

    const transaction = new Transaction();
    transaction.add(instruction);

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = admin;

    return transaction;
}
