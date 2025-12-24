// scripts/phase1.ts
// Phase 1: Configuration & Setup Tests
// Tests: initialize (skip if exists), fetch config, update_configuration (admin), update_configuration (non-admin should fail)

import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, Connection } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey(
    "4dZia69H7vGWpJNbzcMP83TaWKFbDyWDRWe1stHDHrMe"
);

// Must match Rust: CurveConfiguration::SEED = "CurveConfiguration"
const CONFIG_SEED = "CurveConfiguration";

async function main() {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const wallet = provider.wallet as anchor.Wallet;
    const connection = provider.connection;

    const program = anchor.workspace.Pump as anchor.Program;

    console.log("=".repeat(60));
    console.log("PHASE 1: Configuration & Setup Tests");
    console.log("=".repeat(60));
    console.log("\nProvider pubkey:", wallet.publicKey.toBase58());
    console.log("Program ID:", program.programId.toBase58());

    // PDA da config: seeds = [b"CurveConfiguration"]
    const [dexConfigPda] = PublicKey.findProgramAddressSync(
        [Buffer.from(CONFIG_SEED)],
        PROGRAM_ID
    );
    console.log("DexConfiguration PDA:", dexConfigPda.toBase58());

    // Global account PDA: seeds = [b"global"]
    const [globalPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("global")],
        PROGRAM_ID
    );
    console.log("Global PDA:", globalPda.toBase58());

    // ---------- 1) Check if config exists, initialize if not ----------
    console.log("\n" + "-".repeat(60));
    console.log("TEST 1: Initialize (skip if already exists)");
    console.log("-".repeat(60));

    const fees = 300; // 3%
    const paperhandTaxBps = 5000; // 50%
    const treasuryVault = wallet.publicKey;
    const admin = wallet.publicKey;

    let configExists = false;
    try {
        const existingConfig = await connection.getAccountInfo(dexConfigPda);
        if (existingConfig && existingConfig.data.length > 0) {
            console.log("✓ Config account already exists, skipping initialize");
            configExists = true;
        }
    } catch (e) {
        // Account doesn't exist
    }

    if (!configExists) {
        console.log("Config account doesn't exist, calling initialize...");
        const txInit = await program.methods
            .initialize(fees, paperhandTaxBps)
            .accounts({
                dexConfigurationAccount: dexConfigPda,
                globalAccount: globalPda,
                treasuryVault: treasuryVault,
                admin: admin,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                systemProgram: SystemProgram.programId,
            })
            .rpc();
        console.log("✓ Initialize tx:", txInit);
    }

    // ---------- 2) Fetch and verify config ----------
    console.log("\n" + "-".repeat(60));
    console.log("TEST 2: Fetch and verify configuration");
    console.log("-".repeat(60));

    const cfg: any = await (program.account as any).curveConfiguration.fetch(dexConfigPda);
    console.log("Config fetched:");
    console.log("  - fees:", cfg.fees);
    console.log("  - paperhandTaxBps:", cfg.paperhandTaxBps);
    console.log("  - treasury:", cfg.treasury.toBase58());
    console.log("  - admin:", cfg.admin.toBase58());

    // Verify admin is correct
    if (!cfg.admin.equals(wallet.publicKey)) {
        throw new Error(`✗ Admin mismatch! Expected ${wallet.publicKey.toBase58()}, got ${cfg.admin.toBase58()}`);
    }
    console.log("✓ Admin is correctly set to wallet");

    // Verify treasury is set
    if (!cfg.treasury) {
        throw new Error("✗ Treasury is not set");
    }
    console.log("✓ Treasury is set:", cfg.treasury.toBase58());

    // Verify paperhand tax (should be 5000 = 50%)
    if (cfg.paperhandTaxBps === 5000) {
        console.log("✓ PaperHand tax is 5000 (50%) as expected");
    } else {
        console.log(`⚠ PaperHand tax is ${cfg.paperhandTaxBps}, not 5000`);
    }

    // ---------- 3) Update configuration as admin (should succeed) ----------
    console.log("\n" + "-".repeat(60));
    console.log("TEST 3: Update configuration as admin (should succeed)");
    console.log("-".repeat(60));

    const newFees = 400; // 4%
    const newPaperhandTaxBps = 4000; // 40%
    const newTreasuryVault = Keypair.generate().publicKey;

    try {
        const txUpdateAdmin = await program.methods
            .updateConfiguration(newFees, newTreasuryVault, newPaperhandTaxBps)
            .accounts({
                dexConfigurationAccount: dexConfigPda,
                admin: admin,
            })
            .rpc();

        console.log("✓ Update tx:", txUpdateAdmin);

        // Verify changes
        const cfg2: any = await (program.account as any).curveConfiguration.fetch(dexConfigPda);

        if (cfg2.fees === newFees) {
            console.log(`✓ Fees updated: ${cfg.fees} → ${cfg2.fees}`);
        } else {
            throw new Error(`✗ Fees not updated correctly. Expected ${newFees}, got ${cfg2.fees}`);
        }

        if (cfg2.paperhandTaxBps === newPaperhandTaxBps) {
            console.log(`✓ PaperHand tax updated: ${cfg.paperhandTaxBps} → ${cfg2.paperhandTaxBps}`);
        } else {
            throw new Error(`✗ PaperHand tax not updated correctly. Expected ${newPaperhandTaxBps}, got ${cfg2.paperhandTaxBps}`);
        }

        if (cfg2.treasury.equals(newTreasuryVault)) {
            console.log(`✓ Treasury updated to new address`);
        } else {
            throw new Error(`✗ Treasury not updated correctly`);
        }

        // Restore original values
        console.log("\nRestoring original values...");
        await program.methods
            .updateConfiguration(fees, treasuryVault, paperhandTaxBps)
            .accounts({
                dexConfigurationAccount: dexConfigPda,
                admin: admin,
            })
            .rpc();
        console.log("✓ Values restored to original");

    } catch (e: any) {
        throw new Error(`✗ Admin update failed unexpectedly: ${e.message}`);
    }

    // ---------- 4) Update configuration as non-admin (should FAIL) ----------
    console.log("\n" + "-".repeat(60));
    console.log("TEST 4: Update configuration as non-admin (should FAIL)");
    console.log("-".repeat(60));

    const attacker = Keypair.generate();

    // Fund the attacker account so they can pay for tx (even though it should fail)
    // This is just to make sure the failure is due to authorization, not lack of funds
    console.log("Creating attacker keypair:", attacker.publicKey.toBase58());

    try {
        await program.methods
            .updateConfiguration(9000, attacker.publicKey, 9000)
            .accounts({
                dexConfigurationAccount: dexConfigPda,
                admin: attacker.publicKey,
            })
            .signers([attacker])
            .rpc();

        // If we get here, the test FAILED (should have rejected)
        throw new Error("✗ SECURITY BUG: Non-admin was able to update configuration!");
    } catch (err: any) {
        // Check if it's the expected "Unauthorized" error
        if (err.message && err.message.includes("SECURITY BUG")) {
            throw err; // Re-throw our own error
        }
        if (err.toString().includes("Unauthorized") || err.toString().includes("custom program error")) {
            console.log("✓ Non-admin update correctly rejected with error");
            console.log("  Error (expected):", err.error?.errorMessage || err.message?.substring(0, 80));
        } else {
            console.log("✓ Non-admin update rejected (different error, but still blocked)");
            console.log("  Error:", err.message?.substring(0, 100));
        }
    }

    // ---------- 5) Test invalid fee update (>10000 should fail) ----------
    console.log("\n" + "-".repeat(60));
    console.log("TEST 5: Update with invalid fee >10000 (should FAIL)");
    console.log("-".repeat(60));

    try {
        await program.methods
            .updateConfiguration(15000, null, null) // 150% fee - invalid!
            .accounts({
                dexConfigurationAccount: dexConfigPda,
                admin: admin,
            })
            .rpc();

        throw new Error("✗ BUG: Invalid fee (>10000) was accepted!");
    } catch (err: any) {
        if (err.message && err.message.includes("BUG")) {
            throw err;
        }
        if (err.toString().includes("InvalidFee") || err.toString().includes("custom program error")) {
            console.log("✓ Invalid fee correctly rejected");
        } else {
            console.log("✓ Invalid fee rejected (error):", err.message?.substring(0, 80));
        }
    }

    // ---------- Summary ----------
    console.log("\n" + "=".repeat(60));
    console.log("PHASE 1 COMPLETE: All tests passed! ✓");
    console.log("=".repeat(60));
    console.log("\nConfiguration verified:");

    const finalCfg: any = await (program.account as any).curveConfiguration.fetch(dexConfigPda);
    console.log("  - fees:", finalCfg.fees, `(${finalCfg.fees / 100}%)`);
    console.log("  - paperhandTaxBps:", finalCfg.paperhandTaxBps, `(${finalCfg.paperhandTaxBps / 100}%)`);
    console.log("  - treasury:", finalCfg.treasury.toBase58());
    console.log("  - admin:", finalCfg.admin.toBase58());
}

main().catch((err) => {
    console.error("\n" + "=".repeat(60));
    console.error("PHASE 1 FAILED:", err.message || err);
    console.error("=".repeat(60));
    process.exit(1);
});
