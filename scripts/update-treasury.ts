import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Pump } from "../target/types/pump";
import { PublicKey, Keypair, Connection } from "@solana/web3.js";
import fs from "fs";

// ============================================================================
// CONFIGURATION - DEVNET
// ============================================================================
const RPC_URL = "https://api.devnet.solana.com";
const WALLET_PATH = "./id.json"; // Path to your devnet wallet keypair

// The treasury wallet that should receive taxes
// Set via: TREASURY_WALLET="..." npx ts-node scripts/update-treasury.ts
// Or edit this value before running the script
const TREASURY_WALLET_ADDRESS = process.env.TREASURY_WALLET || "Gi2GLxRgXgtd6pyb378AhA4hcBEjbP6aNFWCfFgaAGoS";
const CORRECT_TREASURY_WALLET = new PublicKey(TREASURY_WALLET_ADDRESS);

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
    const program = anchor.workspace.Pump as Program<Pump>;

    console.log("Program ID:", program.programId.toBase58());
    console.log("Admin Wallet:", wallet.publicKey.toBase58());

    // 3. Derive Curve Config PDA
    const [curveConfig] = PublicKey.findProgramAddressSync(
        [Buffer.from("CurveConfiguration")],
        program.programId
    );

    console.log("Curve Config PDA:", curveConfig.toBase58());
    console.log("New Treasury:", CORRECT_TREASURY_WALLET.toBase58());

    // 4. Call update_configuration
    console.log("Updating configuration...");

    try {
        const tx = await program.methods
            .updateConfiguration(
                null, // new_fees (no change)
                CORRECT_TREASURY_WALLET, // new_treasury
                null  // new_paperhand_tax_bps (no change)
            )
            .accountsStrict({
                dexConfigurationAccount: curveConfig,
                admin: wallet.publicKey,
            })
            .rpc();

        console.log("✅ Treasury updated successfully!");
        console.log("Transaction Signature:", tx);
        console.log("New Treasury:", CORRECT_TREASURY_WALLET.toBase58());
    } catch (error) {
        console.error("❌ Update failed:");
        console.error(error);
    }
}

main();
