/**
 * Standalone initialization script for phbt program
 * Uses the IDL directly - no Anchor build required
 */

import { Connection, PublicKey, Keypair, SYSVAR_RENT_PUBKEY, SystemProgram } from "@solana/web3.js";
import { AnchorProvider, Program, Idl, Wallet } from "@coral-xyz/anchor";
import * as fs from "fs";

// Import the IDL
import IDL from "../app/src/lib/idl/pump.json";

// ============================================================================
// CONFIGURATION - MAINNET (QuickNode)
// ============================================================================
const RPC_URL = "https://small-twilight-sponge.solana-mainnet.quiknode.pro/71bdb31dd3e965467b1393cebaaebe69d481dbeb/";
const WALLET_PATH = "./id.json"; // Path to your mainnet wallet keypair

// Program ID - MAINNET
const PROGRAM_ID = new PublicKey("Gctn6rSF7vnZoPTDWKfoa9B9f2BKLK46SySeksdp4QhL");

// Initialization parameters (in basis points: 100 = 1%, 5000 = 50%)
const FEE_BPS = 100; // 1% trading fee
const PAPERHAND_TAX_BPS = 5000; // 50% paper hand tax

// Treasury wallet (where taxes go) - MAINNET
const TREASURY_WALLET = new PublicKey("HKH4j948aeCsr5kETMeshsDwRvFTuL6gWy4hLSKhqN27");

async function main() {
    console.log("=".repeat(60));
    console.log("PHBT Program Initialization Script");
    console.log("=".repeat(60));

    // 1. Setup connection
    console.log("\n1. Connecting to:", RPC_URL);
    const connection = new Connection(RPC_URL, "confirmed");

    // 2. Load wallet
    console.log("\n2. Loading wallet from:", WALLET_PATH);
    if (!fs.existsSync(WALLET_PATH)) {
        console.error("❌ Wallet file not found at", WALLET_PATH);
        console.log("Please copy your wallet keypair to", WALLET_PATH);
        process.exit(1);
    }

    const walletKeypair = Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(fs.readFileSync(WALLET_PATH, "utf-8")))
    );
    const wallet = new Wallet(walletKeypair);
    console.log("   Admin Wallet:", wallet.publicKey.toBase58());

    // Check balance
    const balance = await connection.getBalance(wallet.publicKey);
    console.log("   Balance:", balance / 1e9, "SOL");
    if (balance < 0.1 * 1e9) {
        console.error("❌ Insufficient balance. Need at least 0.1 SOL");
        console.log("   Run: solana airdrop 2 --url devnet");
        process.exit(1);
    }

    // 3. Setup Anchor provider
    const provider = new AnchorProvider(connection, wallet, {
        commitment: "confirmed",
    });

    // 4. Initialize Program with IDL
    console.log("\n3. Program ID:", PROGRAM_ID.toBase58());
    const program = new Program(IDL as Idl, provider);

    // 5. Derive PDAs
    console.log("\n4. Deriving PDAs...");
    const [curveConfig] = PublicKey.findProgramAddressSync(
        [Buffer.from("CurveConfiguration")],
        PROGRAM_ID
    );
    console.log("   CurveConfiguration PDA:", curveConfig.toBase58());

    const [globalAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("global")],
        PROGRAM_ID
    );
    console.log("   Global Account PDA:", globalAccount.toBase58());

    console.log("   Treasury Wallet:", TREASURY_WALLET.toBase58());

    // 6. Check if already initialized
    console.log("\n5. Checking existing state...");
    const configInfo = await connection.getAccountInfo(curveConfig);
    if (configInfo) {
        console.log("⚠️  CurveConfiguration already exists!");
        console.log("   Account size:", configInfo.data.length, "bytes");
        console.log("   Owner:", configInfo.owner.toBase58());
        console.log("\n   Program is already initialized. Exiting.");
        return;
    }
    console.log("   CurveConfiguration does not exist - ready to initialize");

    // 7. Initialize
    console.log("\n6. Initializing program...");
    console.log("   Fee:", FEE_BPS, "bps (", FEE_BPS / 100, "%)");
    console.log("   PaperHand Tax:", PAPERHAND_TAX_BPS, "bps (", PAPERHAND_TAX_BPS / 100, "%)");

    try {
        const tx = await program.methods
            .initialize(FEE_BPS, PAPERHAND_TAX_BPS)
            .accounts({
                dexConfigurationAccount: curveConfig,
                globalAccount: globalAccount,
                treasuryVault: TREASURY_WALLET,
                admin: wallet.publicKey,
                rent: SYSVAR_RENT_PUBKEY,
                systemProgram: SystemProgram.programId,
            })
            .rpc();

        console.log("\n" + "=".repeat(60));
        console.log("✅ SUCCESS! Program initialized!");
        console.log("=".repeat(60));
        console.log("\nTransaction Signature:", tx);
        console.log("Explorer: https://explorer.solana.com/tx/" + tx + "?cluster=devnet");
        console.log("\nPDAs Created:");
        console.log("  - CurveConfiguration:", curveConfig.toBase58());
        console.log("  - Global Account:", globalAccount.toBase58());
        console.log("\nYou can now launch tokens!");
    } catch (error: any) {
        console.error("\n❌ Initialization failed:");
        console.error(error.message || error);
        
        if (error.logs) {
            console.log("\nProgram logs:");
            error.logs.forEach((log: string) => console.log("  ", log));
        }
    }
}

main().catch(console.error);

