/**
 * Check mainnet program status for all known program IDs
 */
import { Connection, PublicKey } from "@solana/web3.js";

const PROGRAMS = [
    { name: "README mainnet", id: "J3pvSaDxrBDX38nBG4CcTodGmkaFuRabVW6Erp712GF2" },
    { name: "Constants mainnet (old)", id: "8XQAVjtT1QSYgVp8WzhVdwuSvGfDX9UifZupiLvBe2Lh" },
];

async function checkProgram(connection: Connection, name: string, programId: string) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Checking: ${name}`);
    console.log(`Program ID: ${programId}`);
    console.log("=".repeat(60));
    
    const pubkey = new PublicKey(programId);
    
    // Check program account
    const programInfo = await connection.getAccountInfo(pubkey);
    console.log("\nProgram exists:", !!programInfo);
    if (programInfo) {
        console.log("  Owner:", programInfo.owner.toBase58());
        console.log("  Executable:", programInfo.executable);
        
        // Check CurveConfiguration PDA
        const [curveConfig] = PublicKey.findProgramAddressSync(
            [Buffer.from("CurveConfiguration")],
            pubkey
        );
        console.log("\nCurveConfiguration PDA:", curveConfig.toBase58());
        
        const configInfo = await connection.getAccountInfo(curveConfig);
        console.log("Config initialized:", !!configInfo);
        if (configInfo) {
            console.log("  Size:", configInfo.data.length, "bytes");
        }
        
        // Check Global PDA
        const [globalAccount] = PublicKey.findProgramAddressSync(
            [Buffer.from("global")],
            pubkey
        );
        console.log("\nGlobal PDA:", globalAccount.toBase58());
        
        const globalInfo = await connection.getAccountInfo(globalAccount);
        console.log("Global exists:", !!globalInfo);
        if (globalInfo) {
            console.log("  Balance:", globalInfo.lamports / 1e9, "SOL");
        }
        
        return { exists: true, initialized: !!configInfo };
    }
    
    return { exists: false, initialized: false };
}

async function main() {
    const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
    
    console.log("Checking MAINNET program status...\n");
    
    for (const prog of PROGRAMS) {
        await checkProgram(connection, prog.name, prog.id);
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("SUMMARY");
    console.log("=".repeat(60));
    console.log("If no programs exist, you need to DEPLOY to mainnet first.");
    console.log("If program exists but not initialized, run initialize script.");
}

main().catch(console.error);
