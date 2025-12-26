import { Connection, PublicKey, Transaction, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Program, AnchorProvider, Idl, BN } from "@coral-xyz/anchor";
import IDL from "../app/src/lib/idl/pump.json";

const RPC = "https://small-twilight-sponge.solana-mainnet.quiknode.pro/71bdb31dd3e965467b1393cebaaebe69d481dbeb/";
const PROGRAM_ID = new PublicKey("Gctn6rSF7vnZoPTDWKfoa9B9f2BKLK46SySeksdp4QhL");
const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

async function main() {
    const connection = new Connection(RPC, "confirmed");
    
    // Use a test creator (won't actually sign, just for simulation)
    const testCreator = new PublicKey("HKH4j948aeCsr5kETMeshsDwRvFTuL6gWy4hLSKhqN27");
    const testSymbol = "TSTSYM";
    
    // Derive all PDAs
    const [mint] = PublicKey.findProgramAddressSync(
        [Buffer.from("mint"), Buffer.from(testSymbol), testCreator.toBuffer()],
        PROGRAM_ID
    );
    const [curveConfig] = PublicKey.findProgramAddressSync(
        [Buffer.from("CurveConfiguration")],
        PROGRAM_ID
    );
    const [pool] = PublicKey.findProgramAddressSync(
        [Buffer.from("liquidity_pool"), mint.toBuffer()],
        PROGRAM_ID
    );
    const [global] = PublicKey.findProgramAddressSync(
        [Buffer.from("global")],
        PROGRAM_ID
    );
    const [metadata] = PublicKey.findProgramAddressSync(
        [Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
        TOKEN_METADATA_PROGRAM_ID
    );
    const poolTokenAccount = getAssociatedTokenAddressSync(mint, global, true);
    
    console.log("PDAs:");
    console.log("  mint:", mint.toBase58());
    console.log("  curveConfig:", curveConfig.toBase58());
    console.log("  pool:", pool.toBase58());
    console.log("  global:", global.toBase58());
    console.log("  metadata:", metadata.toBase58());
    console.log("  poolTokenAccount:", poolTokenAccount.toBase58());
    
    // Create provider with dummy wallet
    const provider = new AnchorProvider(
        connection,
        {
            publicKey: testCreator,
            signTransaction: async (tx) => tx,
            signAllTransactions: async (txs) => txs,
        },
        { commitment: "confirmed" }
    );
    
    // Create program
    const program = new Program(IDL as Idl, provider);
    console.log("\nProgram ID from IDL:", (IDL as any).address);
    
    // Build the instruction
    try {
        const instruction = await program.methods
            .launch(
                "Test Token",
                testSymbol,
                "https://example.com/test.json",
                6,
                new BN("1000000000000000"), // 1 billion with 6 decimals
                new BN("100000000") // 0.1 SOL
            )
            .accounts({
                dexConfigurationAccount: curveConfig,
                mint: mint,
                metadata: metadata,
                pool: pool,
                globalAccount: global,
                poolTokenAccount: poolTokenAccount,
                creator: testCreator,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                metadataProgram: TOKEN_METADATA_PROGRAM_ID,
                rent: SYSVAR_RENT_PUBKEY,
            })
            .instruction();
        
        console.log("\n✅ Instruction built successfully");
        console.log("Instruction program ID:", instruction.programId.toBase58());
        console.log("Number of accounts:", instruction.keys.length);
        
        // Create transaction
        const tx = new Transaction().add(instruction);
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        tx.feePayer = testCreator;
        
        // Simulate
        console.log("\nSimulating transaction...");
        const simResult = await connection.simulateTransaction(tx);
        
        if (simResult.value.err) {
            console.log("\n❌ Simulation FAILED:");
            console.log("Error:", JSON.stringify(simResult.value.err));
            console.log("\nLogs:");
            simResult.value.logs?.forEach(log => console.log("  ", log));
        } else {
            console.log("\n✅ Simulation succeeded!");
            console.log("Units consumed:", simResult.value.unitsConsumed);
        }
        
    } catch (err: any) {
        console.error("\n❌ Error building instruction:", err.message);
        if (err.logs) {
            console.log("Logs:", err.logs);
        }
    }
}

main().catch(console.error);



