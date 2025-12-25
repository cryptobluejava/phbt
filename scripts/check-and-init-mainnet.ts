/**
 * Check and Initialize MAINNET program
 * Program ID: Gctn6rSF7vnZoPTDWKfoa9B9f2BKLK46SySeksdp4QhL
 */
import { Connection, PublicKey, Keypair, SYSVAR_RENT_PUBKEY, SystemProgram } from "@solana/web3.js";
import { AnchorProvider, Program, Idl, Wallet } from "@coral-xyz/anchor";
import * as fs from "fs";

// Import the IDL
import IDL from "../app/src/lib/idl/pump.json";

// ============================================================================
// MAINNET CONFIGURATION - QuickNode RPC
// ============================================================================
const RPC_URL = "https://small-twilight-sponge.solana-mainnet.quiknode.pro/71bdb31dd3e965467b1393cebaaebe69d481dbeb/";
const WALLET_PATH = "./id.json";

// THE ACTUAL MAINNET PROGRAM ID
const MAINNET_PROGRAM_ID = new PublicKey("Gctn6rSF7vnZoPTDWKfoa9B9f2BKLK46SySeksdp4QhL");

// Initialization parameters
const FEE_BPS = 100; // 1% trading fee
const PAPERHAND_TAX_BPS = 5000; // 50% tax

// Treasury & Admin wallet
const TREASURY_WALLET = new PublicKey("HKH4j948aeCsr5kETMeshsDwRvFTuL6gWy4hLSKhqN27");

async function main() {
    console.log("=".repeat(60));
    console.log("MAINNET Program Check & Initialize");
    console.log("=".repeat(60));
    
    const connection = new Connection(RPC_URL, "confirmed");
    
    console.log("\nProgram ID:", MAINNET_PROGRAM_ID.toBase58());
    
    // 1. Check if program exists
    console.log("\n1. Checking program...");
    const programInfo = await connection.getAccountInfo(MAINNET_PROGRAM_ID);
    if (!programInfo) {
        console.error("❌ Program does NOT exist on mainnet!");
        return;
    }
    console.log("✅ Program exists!");
    console.log("   Executable:", programInfo.executable);
    console.log("   Owner:", programInfo.owner.toBase58());
    
    // 2. Derive PDAs
    const [curveConfig] = PublicKey.findProgramAddressSync(
        [Buffer.from("CurveConfiguration")],
        MAINNET_PROGRAM_ID
    );
    const [globalAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("global")],
        MAINNET_PROGRAM_ID
    );
    
    console.log("\n2. PDAs:");
    console.log("   CurveConfiguration:", curveConfig.toBase58());
    console.log("   Global Account:", globalAccount.toBase58());
    console.log("   Treasury:", TREASURY_WALLET.toBase58());
    
    // 3. Check if initialized
    console.log("\n3. Checking initialization status...");
    const configInfo = await connection.getAccountInfo(curveConfig);
    
    if (configInfo) {
        console.log("✅ Program is ALREADY INITIALIZED!");
        console.log("   Config size:", configInfo.data.length, "bytes");
        
        const globalInfo = await connection.getAccountInfo(globalAccount);
        if (globalInfo) {
            console.log("   Global balance:", globalInfo.lamports / 1e9, "SOL");
        }
        
        console.log("\n" + "=".repeat(60));
        console.log("READY TO LAUNCH TOKENS!");
        console.log("=".repeat(60));
        console.log("\nUpdate your app constants with:");
        console.log(`  PROGRAM_ID: ${MAINNET_PROGRAM_ID.toBase58()}`);
        return;
    }
    
    // 4. Need to initialize
    console.log("❌ Program is NOT initialized. Initializing now...");
    
    // Load wallet
    if (!fs.existsSync(WALLET_PATH)) {
        console.error("\n❌ Wallet file not found:", WALLET_PATH);
        console.log("Copy your mainnet wallet keypair to", WALLET_PATH);
        return;
    }
    
    const walletKeypair = Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(fs.readFileSync(WALLET_PATH, "utf-8")))
    );
    const wallet = new Wallet(walletKeypair);
    console.log("\n4. Admin wallet:", wallet.publicKey.toBase58());
    
    const balance = await connection.getBalance(wallet.publicKey);
    console.log("   Balance:", balance / 1e9, "SOL");
    
    if (balance < 0.05 * 1e9) {
        console.error("❌ Need at least 0.05 SOL for initialization");
        return;
    }
    
    // Update IDL with correct program ID
    const idlWithCorrectAddress = {
        ...IDL,
        address: MAINNET_PROGRAM_ID.toBase58()
    };
    
    const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
    const program = new Program(idlWithCorrectAddress as Idl, provider);
    
    console.log("\n5. Initializing...");
    console.log("   Fee:", FEE_BPS, "bps");
    console.log("   PaperHand Tax:", PAPERHAND_TAX_BPS, "bps");
    
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
        console.log("✅ SUCCESS! MAINNET INITIALIZED!");
        console.log("=".repeat(60));
        console.log("\nTransaction:", tx);
        console.log("Explorer: https://explorer.solana.com/tx/" + tx);
        console.log("\nYou can now launch tokens on MAINNET!");
        
    } catch (error: any) {
        console.error("\n❌ Initialization failed:", error.message);
        if (error.logs) {
            console.log("\nProgram logs:");
            error.logs.forEach((log: string) => console.log("  ", log));
        }
    }
}

main().catch(console.error);

