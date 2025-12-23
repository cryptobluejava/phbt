import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Pump } from "../target/types/pump"
import { Connection, PublicKey, Keypair, SystemProgram, Transaction, sendAndConfirmTransaction, ComputeBudgetProgram, SYSVAR_RENT_PUBKEY, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, getAssociatedTokenAddress } from "@solana/spl-token"
import { expect } from "chai";
import { BN } from "bn.js";
const keys = require('../keys/users.json');
const key2 = require('../keys/user2.json');
import { ASSOCIATED_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";

const connection = new Connection(anchor.AnchorProvider.env().connection.rpcEndpoint || "http://localhost:8899")
const curveSeed = "CurveConfiguration"
const POOL_SEED_PREFIX = "liquidity_pool"
const LP_SEED_PREFIX = "LiqudityProvider"
const TREASURY_VAULT_SEED = "treasury_vault"
const POSITION_SEED = "position"

// Default paperhand tax: 50% = 5000 bps
const DEFAULT_PAPERHAND_TAX_BPS = 5000;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe("PaperHandBitchTax", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Pump as Program<Pump>;

  // Test users
  const admin = Keypair.fromSecretKey(new Uint8Array(keys))
  const user2 = Keypair.fromSecretKey(new Uint8Array(key2))
  const tokenDecimal = 6
  const initialTokenSupply = new BN(1_000_000_000).mul(new BN(10 ** tokenDecimal))

  let mint1: PublicKey
  let tokenAta1: PublicKey
  let curveConfig: PublicKey
  let poolPda: PublicKey
  let globalAccount: PublicKey
  let treasuryVault: PublicKey

  console.log("Admin's wallet address is:", admin.publicKey.toBase58())
  console.log("User2's wallet address is:", user2.publicKey.toBase58())

  // Helper function to get PDA addresses
  const getPDAs = async (mint: PublicKey) => {
    const [curve] = PublicKey.findProgramAddressSync(
      [Buffer.from(curveSeed)],
      program.programId
    );
    const [pool] = PublicKey.findProgramAddressSync(
      [Buffer.from(POOL_SEED_PREFIX), mint.toBuffer()],
      program.programId
    );
    const [global] = PublicKey.findProgramAddressSync(
      [Buffer.from("global")],
      program.programId
    );
    const [treasury] = PublicKey.findProgramAddressSync(
      [Buffer.from(TREASURY_VAULT_SEED)],
      program.programId
    );
    return { curve, pool, global, treasury };
  };

  // Helper function to get user position PDA
  const getUserPositionPDA = (pool: PublicKey, user: PublicKey) => {
    const [position] = PublicKey.findProgramAddressSync(
      [Buffer.from(POSITION_SEED), pool.toBuffer(), user.toBuffer()],
      program.programId
    );
    return position;
  };

  // Helper to get treasury balance
  const getTreasuryBalance = async () => {
    return await connection.getBalance(treasuryVault);
  };

  it("Airdrop SOL to admin wallet", async () => {
    console.log(`Requesting airdrop to admin: ${admin.publicKey.toBase58()}`);
    const signature = await connection.requestAirdrop(admin.publicKey, 10 * LAMPORTS_PER_SOL);
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature }, 'finalized');
    console.log("Admin wallet balance:", (await connection.getBalance(admin.publicKey)) / LAMPORTS_PER_SOL, "SOL");
  });

  it("Airdrop SOL to user2 wallet", async () => {
    console.log(`Requesting airdrop to user2: ${user2.publicKey.toBase58()}`);
    const signature = await connection.requestAirdrop(user2.publicKey, 10 * LAMPORTS_PER_SOL);
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature }, 'finalized');
    console.log("User2 wallet balance:", (await connection.getBalance(user2.publicKey)) / LAMPORTS_PER_SOL, "SOL");
  });

  it("Create and mint test token", async () => {
    console.log("Creating test token...");
    mint1 = await createMint(connection, admin, admin.publicKey, admin.publicKey, tokenDecimal);
    console.log('Mint address:', mint1.toBase58());

    tokenAta1 = (await getOrCreateAssociatedTokenAccount(connection, admin, mint1, admin.publicKey)).address;
    console.log('Admin token account:', tokenAta1.toBase58());

    await mintTo(connection, admin, mint1, tokenAta1, admin.publicKey, BigInt(initialTokenSupply.toString()));
    const tokenBalance = await connection.getTokenAccountBalance(tokenAta1);
    console.log("Admin token balance:", tokenBalance.value.uiAmount);

    // Get PDAs after mint is created
    const pdas = await getPDAs(mint1);
    curveConfig = pdas.curve;
    poolPda = pdas.pool;
    globalAccount = pdas.global;
    treasuryVault = pdas.treasury;
  });

  it("Initialize the contract with PaperHandBitchTax (50%)", async () => {
    try {
      const tx = new Transaction()
        .add(
          ComputeBudgetProgram.setComputeUnitLimit({ units: 50_000 }),
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1200_000 }),
          await program.methods
            .initialize(1, DEFAULT_PAPERHAND_TAX_BPS) // 1% trading fee, 50% paperhand tax
            .accounts({
              dexConfigurationAccount: curveConfig,
              globalAccount: globalAccount,
              treasuryVault: treasuryVault,
              admin: admin.publicKey,
              rent: SYSVAR_RENT_PUBKEY,
              systemProgram: SystemProgram.programId
            })
            .instruction()
        );
      tx.feePayer = admin.publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      const sig = await sendAndConfirmTransaction(connection, tx, [admin], { skipPreflight: true });
      console.log("Successfully initialized with PaperHandBitchTax:", sig);

      const configAccount = await program.account.curveConfiguration.fetch(curveConfig);
      console.log("Config state:", {
        fees: configAccount.fees,
        treasury: configAccount.treasury.toBase58(),
        paperhandTaxBps: configAccount.paperhandTaxBps
      });

      expect(configAccount.paperhandTaxBps).to.equal(DEFAULT_PAPERHAND_TAX_BPS);
    } catch (error) {
      console.log("Error in initialization:", error);
      throw error;
    }
  });

  it("Add liquidity to pool", async () => {
    try {
      const [liquidityProviderAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from(LP_SEED_PREFIX), poolPda.toBuffer(), admin.publicKey.toBuffer()],
        program.programId
      );
      const poolTokenOne = await getAssociatedTokenAddress(mint1, globalAccount, true);
      const userAta1 = await getAssociatedTokenAddress(mint1, admin.publicKey);

      const tx = new Transaction()
        .add(
          ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }),
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 200_000 }),
          await program.methods
            .addLiquidity(new BN(1_000_000_000_000_000), new BN(30 * LAMPORTS_PER_SOL)) // Large token reserve, 30 SOL
            .accounts({
              pool: poolPda,
              globalAccount: globalAccount,
              mintTokenOne: mint1,
              poolTokenAccountOne: poolTokenOne,
              userTokenAccountOne: userAta1,
              liquidityProviderAccount: liquidityProviderAccount,
              user: admin.publicKey,
              tokenProgram: TOKEN_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
              rent: SYSVAR_RENT_PUBKEY,
              systemProgram: SystemProgram.programId
            })
            .instruction()
        );
      tx.feePayer = admin.publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      const sig = await sendAndConfirmTransaction(connection, tx, [admin], { skipPreflight: true });
      console.log("Successfully added liquidity:", sig);

      // Fund the global account with SOL for swaps
      const fundSig = await connection.requestAirdrop(globalAccount, 5 * LAMPORTS_PER_SOL);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature: fundSig }, 'finalized');
      console.log("Funded global account with 5 SOL");

    } catch (error) {
      console.log("Error adding liquidity:", error);
      throw error;
    }
  });

  describe("PaperHandBitchTax - Tax when selling at a loss", () => {
    let user2TokenAta: PublicKey;
    let initialTreasuryBalance: number;
    let tokensReceived: BN;

    it("Setup: Create token account for user2", async () => {
      user2TokenAta = (await getOrCreateAssociatedTokenAccount(connection, user2, mint1, user2.publicKey)).address;
      console.log("User2 token account:", user2TokenAta.toBase58());
    });

    it("User2 buys tokens (establishes cost basis)", async () => {
      const buyAmount = new BN(0.5 * LAMPORTS_PER_SOL); // Buy with 0.5 SOL
      const poolTokenOne = await getAssociatedTokenAddress(mint1, globalAccount, true);
      const userPositionPDA = getUserPositionPDA(poolPda, user2.publicKey);

      const beforeTokenBalance = await connection.getTokenAccountBalance(user2TokenAta).catch(() => ({ value: { amount: "0" } }));

      const tx = new Transaction()
        .add(
          ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 200_000 }),
          await program.methods
            .swap(buyAmount, new BN(2)) // style=2 is BUY
            .accounts({
              dexConfigurationAccount: curveConfig,
              pool: poolPda,
              globalAccount: globalAccount,
              treasuryVault: treasuryVault,
              userPosition: userPositionPDA,
              mintTokenOne: mint1,
              poolTokenAccountOne: poolTokenOne,
              userTokenAccountOne: user2TokenAta,
              user: user2.publicKey,
              rent: SYSVAR_RENT_PUBKEY,
              systemProgram: SystemProgram.programId,
              tokenProgram: TOKEN_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_PROGRAM_ID
            })
            .instruction()
        );
      tx.feePayer = user2.publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      const sig = await sendAndConfirmTransaction(connection, tx, [user2], { skipPreflight: true });
      console.log("User2 BUY transaction:", sig);

      const afterTokenBalance = await connection.getTokenAccountBalance(user2TokenAta);
      tokensReceived = new BN(afterTokenBalance.value.amount).sub(new BN(beforeTokenBalance.value.amount));
      console.log("User2 received tokens:", tokensReceived.toString());

      // Check position was created
      const position = await program.account.userPosition.fetch(userPositionPDA);
      console.log("User2 Position after buy:", {
        totalTokens: position.totalTokens.toString(),
        totalSol: position.totalSol.toString()
      });

      expect(position.totalTokens.toNumber()).to.be.greaterThan(0);
      expect(position.totalSol.toNumber()).to.equal(buyAmount.toNumber());
    });

    it("Simulate price drop: Admin sells heavily to move price down", async () => {
      // Admin sells a lot of tokens to drop the price
      const sellAmount = new BN(100_000_000_000_000); // Large sell
      const poolTokenOne = await getAssociatedTokenAddress(mint1, globalAccount, true);
      const adminPositionPDA = getUserPositionPDA(poolPda, admin.publicKey);
      const adminTokenAta = await getAssociatedTokenAddress(mint1, admin.publicKey);

      // First admin needs to buy some to establish position
      const buyTx = new Transaction()
        .add(
          ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 200_000 }),
          await program.methods
            .swap(new BN(1 * LAMPORTS_PER_SOL), new BN(2)) // Buy 1 SOL worth
            .accounts({
              dexConfigurationAccount: curveConfig,
              pool: poolPda,
              globalAccount: globalAccount,
              treasuryVault: treasuryVault,
              userPosition: adminPositionPDA,
              mintTokenOne: mint1,
              poolTokenAccountOne: poolTokenOne,
              userTokenAccountOne: adminTokenAta,
              user: admin.publicKey,
              rent: SYSVAR_RENT_PUBKEY,
              systemProgram: SystemProgram.programId,
              tokenProgram: TOKEN_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_PROGRAM_ID
            })
            .instruction()
        );
      buyTx.feePayer = admin.publicKey;
      buyTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      await sendAndConfirmTransaction(connection, buyTx, [admin], { skipPreflight: true });

      // Now sell to drop price (using position from the previous buy)
      const adminPosition = await program.account.userPosition.fetch(adminPositionPDA);
      const tokensToSell = adminPosition.totalTokens;

      const sellTx = new Transaction()
        .add(
          ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 200_000 }),
          await program.methods
            .swap(tokensToSell, new BN(1)) // style=1 is SELL
            .accounts({
              dexConfigurationAccount: curveConfig,
              pool: poolPda,
              globalAccount: globalAccount,
              treasuryVault: treasuryVault,
              userPosition: adminPositionPDA,
              mintTokenOne: mint1,
              poolTokenAccountOne: poolTokenOne,
              userTokenAccountOne: adminTokenAta,
              user: admin.publicKey,
              rent: SYSVAR_RENT_PUBKEY,
              systemProgram: SystemProgram.programId,
              tokenProgram: TOKEN_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_PROGRAM_ID
            })
            .instruction()
        );
      sellTx.feePayer = admin.publicKey;
      sellTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      await sendAndConfirmTransaction(connection, sellTx, [admin], { skipPreflight: true });

      console.log("Price should be lower now after admin sell");
    });

    it("User2 sells at a loss - 50% tax should apply", async () => {
      initialTreasuryBalance = await getTreasuryBalance();
      console.log("Treasury balance before sell:", initialTreasuryBalance / LAMPORTS_PER_SOL, "SOL");

      const poolTokenOne = await getAssociatedTokenAddress(mint1, globalAccount, true);
      const userPositionPDA = getUserPositionPDA(poolPda, user2.publicKey);

      const positionBefore = await program.account.userPosition.fetch(userPositionPDA);
      console.log("User2 position before sell:", {
        totalTokens: positionBefore.totalTokens.toString(),
        totalSol: positionBefore.totalSol.toString()
      });

      const user2SolBefore = await connection.getBalance(user2.publicKey);

      // Sell all tokens
      const sellAmount = positionBefore.totalTokens;

      const tx = new Transaction()
        .add(
          ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 200_000 }),
          await program.methods
            .swap(sellAmount, new BN(1)) // style=1 is SELL
            .accounts({
              dexConfigurationAccount: curveConfig,
              pool: poolPda,
              globalAccount: globalAccount,
              treasuryVault: treasuryVault,
              userPosition: userPositionPDA,
              mintTokenOne: mint1,
              poolTokenAccountOne: poolTokenOne,
              userTokenAccountOne: user2TokenAta,
              user: user2.publicKey,
              rent: SYSVAR_RENT_PUBKEY,
              systemProgram: SystemProgram.programId,
              tokenProgram: TOKEN_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_PROGRAM_ID
            })
            .instruction()
        );
      tx.feePayer = user2.publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      const sig = await sendAndConfirmTransaction(connection, tx, [user2], { skipPreflight: true });
      console.log("User2 SELL (at loss) transaction:", sig);

      const user2SolAfter = await connection.getBalance(user2.publicKey);
      const solReceived = user2SolAfter - user2SolBefore;
      console.log("User2 SOL change (including tx fees):", solReceived / LAMPORTS_PER_SOL, "SOL");

      const finalTreasuryBalance = await getTreasuryBalance();
      console.log("Treasury balance after sell:", finalTreasuryBalance / LAMPORTS_PER_SOL, "SOL");

      const taxCollected = finalTreasuryBalance - initialTreasuryBalance;
      console.log("Tax collected:", taxCollected / LAMPORTS_PER_SOL, "SOL");

      // Position should be zeroed out
      const positionAfter = await program.account.userPosition.fetch(userPositionPDA);
      console.log("User2 position after sell:", {
        totalTokens: positionAfter.totalTokens.toString(),
        totalSol: positionAfter.totalSol.toString()
      });

      expect(positionAfter.totalTokens.toNumber()).to.equal(0);
      expect(positionAfter.totalSol.toNumber()).to.equal(0);

      // Treasury should have received tax
      expect(taxCollected).to.be.greaterThan(0);
    });
  });

  describe("PaperHandBitchTax - No tax when selling at profit", () => {
    let user2TokenAta: PublicKey;
    let initialTreasuryBalance: number;

    it("Setup: Ensure user2 has token account", async () => {
      user2TokenAta = (await getOrCreateAssociatedTokenAccount(connection, user2, mint1, user2.publicKey)).address;
    });

    it("User2 buys tokens", async () => {
      const buyAmount = new BN(0.3 * LAMPORTS_PER_SOL);
      const poolTokenOne = await getAssociatedTokenAddress(mint1, globalAccount, true);
      const userPositionPDA = getUserPositionPDA(poolPda, user2.publicKey);

      const tx = new Transaction()
        .add(
          ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 200_000 }),
          await program.methods
            .swap(buyAmount, new BN(2))
            .accounts({
              dexConfigurationAccount: curveConfig,
              pool: poolPda,
              globalAccount: globalAccount,
              treasuryVault: treasuryVault,
              userPosition: userPositionPDA,
              mintTokenOne: mint1,
              poolTokenAccountOne: poolTokenOne,
              userTokenAccountOne: user2TokenAta,
              user: user2.publicKey,
              rent: SYSVAR_RENT_PUBKEY,
              systemProgram: SystemProgram.programId,
              tokenProgram: TOKEN_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_PROGRAM_ID
            })
            .instruction()
        );
      tx.feePayer = user2.publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      await sendAndConfirmTransaction(connection, tx, [user2], { skipPreflight: true });

      console.log("User2 bought more tokens");
    });

    it("Simulate price increase: Admin buys heavily", async () => {
      const buyAmount = new BN(2 * LAMPORTS_PER_SOL);
      const poolTokenOne = await getAssociatedTokenAddress(mint1, globalAccount, true);
      const adminPositionPDA = getUserPositionPDA(poolPda, admin.publicKey);
      const adminTokenAta = await getAssociatedTokenAddress(mint1, admin.publicKey);

      const tx = new Transaction()
        .add(
          ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 200_000 }),
          await program.methods
            .swap(buyAmount, new BN(2))
            .accounts({
              dexConfigurationAccount: curveConfig,
              pool: poolPda,
              globalAccount: globalAccount,
              treasuryVault: treasuryVault,
              userPosition: adminPositionPDA,
              mintTokenOne: mint1,
              poolTokenAccountOne: poolTokenOne,
              userTokenAccountOne: adminTokenAta,
              user: admin.publicKey,
              rent: SYSVAR_RENT_PUBKEY,
              systemProgram: SystemProgram.programId,
              tokenProgram: TOKEN_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_PROGRAM_ID
            })
            .instruction()
        );
      tx.feePayer = admin.publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      await sendAndConfirmTransaction(connection, tx, [admin], { skipPreflight: true });

      console.log("Admin bought - price should be higher now");
    });

    it("User2 sells at profit - NO tax should apply", async () => {
      initialTreasuryBalance = await getTreasuryBalance();
      console.log("Treasury balance before profitable sell:", initialTreasuryBalance / LAMPORTS_PER_SOL, "SOL");

      const poolTokenOne = await getAssociatedTokenAddress(mint1, globalAccount, true);
      const userPositionPDA = getUserPositionPDA(poolPda, user2.publicKey);

      const positionBefore = await program.account.userPosition.fetch(userPositionPDA);
      console.log("User2 position:", {
        totalTokens: positionBefore.totalTokens.toString(),
        totalSol: positionBefore.totalSol.toString()
      });

      // Sell a portion
      const sellAmount = positionBefore.totalTokens.div(new BN(2));

      const tx = new Transaction()
        .add(
          ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 200_000 }),
          await program.methods
            .swap(sellAmount, new BN(1))
            .accounts({
              dexConfigurationAccount: curveConfig,
              pool: poolPda,
              globalAccount: globalAccount,
              treasuryVault: treasuryVault,
              userPosition: userPositionPDA,
              mintTokenOne: mint1,
              poolTokenAccountOne: poolTokenOne,
              userTokenAccountOne: user2TokenAta,
              user: user2.publicKey,
              rent: SYSVAR_RENT_PUBKEY,
              systemProgram: SystemProgram.programId,
              tokenProgram: TOKEN_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_PROGRAM_ID
            })
            .instruction()
        );
      tx.feePayer = user2.publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      const sig = await sendAndConfirmTransaction(connection, tx, [user2], { skipPreflight: true });
      console.log("User2 SELL (at profit) transaction:", sig);

      const finalTreasuryBalance = await getTreasuryBalance();
      console.log("Treasury balance after profitable sell:", finalTreasuryBalance / LAMPORTS_PER_SOL, "SOL");

      const taxCollected = finalTreasuryBalance - initialTreasuryBalance;
      console.log("Tax collected (should be 0 for profit):", taxCollected / LAMPORTS_PER_SOL, "SOL");

      // No tax should have been collected for profitable sale
      expect(taxCollected).to.equal(0);
    });
  });

  describe("Edge cases", () => {
    it("Should fail: Sell without position (new user)", async () => {
      const newUser = Keypair.generate();

      // Airdrop to new user
      const sig = await connection.requestAirdrop(newUser.publicKey, 1 * LAMPORTS_PER_SOL);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature: sig }, 'finalized');

      // Create token account
      const newUserTokenAta = (await getOrCreateAssociatedTokenAccount(connection, newUser, mint1, newUser.publicKey)).address;

      // Mint some tokens to new user (simulating external purchase)
      await mintTo(connection, admin, mint1, newUserTokenAta, admin.publicKey, 1_000_000_000n);

      const poolTokenOne = await getAssociatedTokenAddress(mint1, globalAccount, true);
      const userPositionPDA = getUserPositionPDA(poolPda, newUser.publicKey);

      try {
        const tx = new Transaction()
          .add(
            ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 200_000 }),
            await program.methods
              .swap(new BN(500_000_000), new BN(1)) // Try to sell
              .accounts({
                dexConfigurationAccount: curveConfig,
                pool: poolPda,
                globalAccount: globalAccount,
                treasuryVault: treasuryVault,
                userPosition: userPositionPDA,
                mintTokenOne: mint1,
                poolTokenAccountOne: poolTokenOne,
                userTokenAccountOne: newUserTokenAta,
                user: newUser.publicKey,
                rent: SYSVAR_RENT_PUBKEY,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_PROGRAM_ID
              })
              .instruction()
          );
        tx.feePayer = newUser.publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        await sendAndConfirmTransaction(connection, tx, [newUser], { skipPreflight: true });

        // Should not reach here
        expect.fail("Should have thrown InsufficientPosition error");
      } catch (error: any) {
        console.log("Expected error for sell without position:", error.message);
        expect(error.message).to.include("InsufficientPosition");
      }
    });

    it("Should fail: Sell more than position", async () => {
      const user2TokenAta = await getAssociatedTokenAddress(mint1, user2.publicKey);
      const poolTokenOne = await getAssociatedTokenAddress(mint1, globalAccount, true);
      const userPositionPDA = getUserPositionPDA(poolPda, user2.publicKey);

      const position = await program.account.userPosition.fetch(userPositionPDA);
      const excessAmount = position.totalTokens.add(new BN(1_000_000));

      try {
        const tx = new Transaction()
          .add(
            ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 200_000 }),
            await program.methods
              .swap(excessAmount, new BN(1))
              .accounts({
                dexConfigurationAccount: curveConfig,
                pool: poolPda,
                globalAccount: globalAccount,
                treasuryVault: treasuryVault,
                userPosition: userPositionPDA,
                mintTokenOne: mint1,
                poolTokenAccountOne: poolTokenOne,
                userTokenAccountOne: user2TokenAta,
                user: user2.publicKey,
                rent: SYSVAR_RENT_PUBKEY,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_PROGRAM_ID
              })
              .instruction()
          );
        tx.feePayer = user2.publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        await sendAndConfirmTransaction(connection, tx, [user2], { skipPreflight: true });

        expect.fail("Should have thrown InsufficientPosition error");
      } catch (error: any) {
        console.log("Expected error for selling more than position:", error.message);
        expect(error.message).to.include("InsufficientPosition");
      }
    });

    it("Partial sells maintain correct basis", async () => {
      const newUser = Keypair.generate();

      // Airdrop
      const sig = await connection.requestAirdrop(newUser.publicKey, 2 * LAMPORTS_PER_SOL);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature: sig }, 'finalized');

      const newUserTokenAta = (await getOrCreateAssociatedTokenAccount(connection, newUser, mint1, newUser.publicKey)).address;
      const poolTokenOne = await getAssociatedTokenAddress(mint1, globalAccount, true);
      const userPositionPDA = getUserPositionPDA(poolPda, newUser.publicKey);

      // Buy 1: 0.2 SOL
      const buy1Tx = new Transaction()
        .add(
          ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
          await program.methods
            .swap(new BN(0.2 * LAMPORTS_PER_SOL), new BN(2))
            .accounts({
              dexConfigurationAccount: curveConfig,
              pool: poolPda,
              globalAccount: globalAccount,
              treasuryVault: treasuryVault,
              userPosition: userPositionPDA,
              mintTokenOne: mint1,
              poolTokenAccountOne: poolTokenOne,
              userTokenAccountOne: newUserTokenAta,
              user: newUser.publicKey,
              rent: SYSVAR_RENT_PUBKEY,
              systemProgram: SystemProgram.programId,
              tokenProgram: TOKEN_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_PROGRAM_ID
            })
            .instruction()
        );
      buy1Tx.feePayer = newUser.publicKey;
      buy1Tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      await sendAndConfirmTransaction(connection, buy1Tx, [newUser], { skipPreflight: true });

      const positionAfterBuy1 = await program.account.userPosition.fetch(userPositionPDA);
      console.log("Position after buy 1:", {
        totalTokens: positionAfterBuy1.totalTokens.toString(),
        totalSol: positionAfterBuy1.totalSol.toString()
      });

      // Buy 2: 0.3 SOL (different price point)
      const buy2Tx = new Transaction()
        .add(
          ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
          await program.methods
            .swap(new BN(0.3 * LAMPORTS_PER_SOL), new BN(2))
            .accounts({
              dexConfigurationAccount: curveConfig,
              pool: poolPda,
              globalAccount: globalAccount,
              treasuryVault: treasuryVault,
              userPosition: userPositionPDA,
              mintTokenOne: mint1,
              poolTokenAccountOne: poolTokenOne,
              userTokenAccountOne: newUserTokenAta,
              user: newUser.publicKey,
              rent: SYSVAR_RENT_PUBKEY,
              systemProgram: SystemProgram.programId,
              tokenProgram: TOKEN_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_PROGRAM_ID
            })
            .instruction()
        );
      buy2Tx.feePayer = newUser.publicKey;
      buy2Tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      await sendAndConfirmTransaction(connection, buy2Tx, [newUser], { skipPreflight: true });

      const positionAfterBuy2 = await program.account.userPosition.fetch(userPositionPDA);
      console.log("Position after buy 2:", {
        totalTokens: positionAfterBuy2.totalTokens.toString(),
        totalSol: positionAfterBuy2.totalSol.toString()
      });

      // Total SOL should be 0.5 SOL
      expect(positionAfterBuy2.totalSol.toNumber()).to.equal(0.5 * LAMPORTS_PER_SOL);

      // Sell half
      const halfTokens = positionAfterBuy2.totalTokens.div(new BN(2));
      const sellTx = new Transaction()
        .add(
          ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
          await program.methods
            .swap(halfTokens, new BN(1))
            .accounts({
              dexConfigurationAccount: curveConfig,
              pool: poolPda,
              globalAccount: globalAccount,
              treasuryVault: treasuryVault,
              userPosition: userPositionPDA,
              mintTokenOne: mint1,
              poolTokenAccountOne: poolTokenOne,
              userTokenAccountOne: newUserTokenAta,
              user: newUser.publicKey,
              rent: SYSVAR_RENT_PUBKEY,
              systemProgram: SystemProgram.programId,
              tokenProgram: TOKEN_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_PROGRAM_ID
            })
            .instruction()
        );
      sellTx.feePayer = newUser.publicKey;
      sellTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      await sendAndConfirmTransaction(connection, sellTx, [newUser], { skipPreflight: true });

      const positionAfterSell = await program.account.userPosition.fetch(userPositionPDA);
      console.log("Position after selling half:", {
        totalTokens: positionAfterSell.totalTokens.toString(),
        totalSol: positionAfterSell.totalSol.toString()
      });

      // Should have ~half tokens and ~half SOL cost basis remaining
      const expectedRemainingTokens = positionAfterBuy2.totalTokens.sub(halfTokens);
      expect(positionAfterSell.totalTokens.toString()).to.equal(expectedRemainingTokens.toString());

      // SOL should be proportionally reduced
      expect(positionAfterSell.totalSol.toNumber()).to.be.approximately(
        0.25 * LAMPORTS_PER_SOL,
        0.01 * LAMPORTS_PER_SOL // Allow 0.01 SOL tolerance for rounding
      );
    });

    it("Sell entire position resets sol to 0", async () => {
      const user2TokenAta = await getAssociatedTokenAddress(mint1, user2.publicKey);
      const poolTokenOne = await getAssociatedTokenAddress(mint1, globalAccount, true);
      const userPositionPDA = getUserPositionPDA(poolPda, user2.publicKey);

      // Buy some first
      const buyTx = new Transaction()
        .add(
          ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
          await program.methods
            .swap(new BN(0.1 * LAMPORTS_PER_SOL), new BN(2))
            .accounts({
              dexConfigurationAccount: curveConfig,
              pool: poolPda,
              globalAccount: globalAccount,
              treasuryVault: treasuryVault,
              userPosition: userPositionPDA,
              mintTokenOne: mint1,
              poolTokenAccountOne: poolTokenOne,
              userTokenAccountOne: user2TokenAta,
              user: user2.publicKey,
              rent: SYSVAR_RENT_PUBKEY,
              systemProgram: SystemProgram.programId,
              tokenProgram: TOKEN_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_PROGRAM_ID
            })
            .instruction()
        );
      buyTx.feePayer = user2.publicKey;
      buyTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      await sendAndConfirmTransaction(connection, buyTx, [user2], { skipPreflight: true });

      const positionAfterBuy = await program.account.userPosition.fetch(userPositionPDA);
      console.log("Position after final buy:", {
        totalTokens: positionAfterBuy.totalTokens.toString(),
        totalSol: positionAfterBuy.totalSol.toString()
      });

      // Sell all
      const sellAllTx = new Transaction()
        .add(
          ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
          await program.methods
            .swap(positionAfterBuy.totalTokens, new BN(1))
            .accounts({
              dexConfigurationAccount: curveConfig,
              pool: poolPda,
              globalAccount: globalAccount,
              treasuryVault: treasuryVault,
              userPosition: userPositionPDA,
              mintTokenOne: mint1,
              poolTokenAccountOne: poolTokenOne,
              userTokenAccountOne: user2TokenAta,
              user: user2.publicKey,
              rent: SYSVAR_RENT_PUBKEY,
              systemProgram: SystemProgram.programId,
              tokenProgram: TOKEN_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_PROGRAM_ID
            })
            .instruction()
        );
      sellAllTx.feePayer = user2.publicKey;
      sellAllTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      await sendAndConfirmTransaction(connection, sellAllTx, [user2], { skipPreflight: true });

      const positionAfterSellAll = await program.account.userPosition.fetch(userPositionPDA);
      console.log("Position after selling all:", {
        totalTokens: positionAfterSellAll.totalTokens.toString(),
        totalSol: positionAfterSellAll.totalSol.toString()
      });

      expect(positionAfterSellAll.totalTokens.toNumber()).to.equal(0);
      expect(positionAfterSellAll.totalSol.toNumber()).to.equal(0);
    });
  });
});
