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

    console.log("Curve Config PDA:", curveConfig.toBase58());
    console.log("Global Account PDA:", globalAccount.toBase58());
    console.log("Treasury Vault PDA:", treasuryVault.toBase58());

    // Check if already initialized
    const configInfo = await connection.getAccountInfo(curveConfig);
    if (configInfo) {
        console.log("⚠️ CurveConfiguration already exists!");
        console.log("Account size:", configInfo.data.length, "bytes");
        return;
    }

    // 4. Initialize
    console.log("Initializing contract...");

    try {
        const tx = await program.methods
            .initialize(FEE_PERCENT, PAPERHAND_TAX_BPS)
            .accountsStrict({
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
