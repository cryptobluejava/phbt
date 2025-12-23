import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Pump } from "../target/types/pump";
import { PublicKey, Keypair, Connection, clusterApiUrl } from "@solana/web3.js";
import fs from "fs";

// ============================================================================
// CONFIGURATION
// ============================================================================
const RPC_URL = process.env.RPC_URL || "https://api.mainnet-beta.solana.com";
const WALLET_PATH = "./mainnet-deploy.json"; // Path to your wallet keypair

// Initialization parameters
const FEE_PERCENT = 1.0; // 1% trading fee
const PAPERHAND_TAX_BPS = 5000; // 50% tax (5000 bps)

async function main() {
    // 1. Setup provider
    console.log("Connecting to:", RPC_URL);
    const connection = new Connection(RPC_URL, "confirmed");

    // Load wallet
    const walletKeypair = Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(fs.readFileSync(WALLET_PATH, "utf-8")))
    );
    const wallet = new anchor.Wallet(walletKeypair);

    const provider = new anchor.AnchorProvider(connection, wallet, {
        commitment: "confirmed",
    });
    anchor.setProvider(provider);

    // 2. Load program
    // Ensure you have run 'anchor build' so target/types/pump.ts exists
    const program = anchor.workspace.Pump as Program<Pump>;

    console.log("Program ID:", program.programId.toBase58());
    console.log("Admin Wallet:", wallet.publicKey.toBase58());

    // 3. Derive PDAs
    const [curveConfig] = PublicKey.findProgramAddressSync(
        [Buffer.from("CurveConfiguration")],
        program.programId
    );

    const [globalAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("global")],
        program.programId
    );

    const [treasuryVault] = PublicKey.findProgramAddressSync(
        [Buffer.from("treasury_vault")],
        program.programId
    );

    // 4. Initialize
    console.log("Initializing contract...");

    try {
        const tx = await program.methods
            .initialize(FEE_PERCENT, PAPERHAND_TAX_BPS)
            .accounts({
                dexConfigurationAccount: curveConfig,
                globalAccount: globalAccount,
                treasuryVault: treasuryVault,
                admin: wallet.publicKey,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();

        console.log("✅ Successfully initialized!");
        console.log("Transaction Signature:", tx);
        console.log("Curve Config PDA:", curveConfig.toBase58());
    } catch (error) {
        console.error("❌ Initialization failed:");
        console.error(error);
    }
}

main();
