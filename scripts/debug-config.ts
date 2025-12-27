import { Connection, PublicKey } from "@solana/web3.js";

const RPC = "https://small-twilight-sponge.solana-mainnet.quiknode.pro/71bdb31dd3e965467b1393cebaaebe69d481dbeb/";
const PROGRAM_ID = new PublicKey("Gctn6rSF7vnZoPTDWKfoa9B9f2BKLK46SySeksdp4QhL");

async function main() {
    const connection = new Connection(RPC, "confirmed");
    
    const [curveConfig] = PublicKey.findProgramAddressSync(
        [Buffer.from("CurveConfiguration")],
        PROGRAM_ID
    );
    const [global] = PublicKey.findProgramAddressSync(
        [Buffer.from("global")],
        PROGRAM_ID
    );
    
    console.log("curveConfig PDA:", curveConfig.toBase58());
    console.log("global PDA:", global.toBase58());
    
    const configInfo = await connection.getAccountInfo(curveConfig);
    if (configInfo) {
        console.log("\n✅ curveConfig EXISTS");
        console.log("   - bytes:", configInfo.data.length);
        console.log("   - owner:", configInfo.owner.toBase58());
        console.log("   - discriminator:", Array.from(configInfo.data.slice(0, 8)));
        
        // Parse config
        const data = configInfo.data;
        const fees = data.readUInt16LE(8);
        const treasury = new PublicKey(data.slice(10, 42));
        const taxBps = data.readUInt16LE(42);
        const admin = new PublicKey(data.slice(44, 76));
        
        console.log("   - fees:", fees, "bps");
        console.log("   - treasury:", treasury.toBase58());
        console.log("   - taxBps:", taxBps);
        console.log("   - admin:", admin.toBase58());
    } else {
        console.log("\n❌ curveConfig DOES NOT EXIST");
    }
    
    const globalInfo = await connection.getAccountInfo(global);
    if (globalInfo) {
        console.log("\n✅ global EXISTS");
        console.log("   - bytes:", globalInfo.data.length);
        console.log("   - owner:", globalInfo.owner.toBase58());
        if (globalInfo.data.length > 0) {
            console.log("   - discriminator:", Array.from(globalInfo.data.slice(0, 8)));
        }
    } else {
        console.log("\n❌ global DOES NOT EXIST");
    }
}

main().catch(console.error);







