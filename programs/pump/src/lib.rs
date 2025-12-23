use anchor_lang::prelude::*;

pub mod consts;
pub mod errors;
pub mod instructions;
pub mod state;
pub mod utils;

use crate::instructions::*;

declare_id!("J3pvSaDxrBDX38nBG4CcTodGmkaFuRabVW6Erp712GF2");

#[program]
pub mod pump {
    use super::*;

    /// Initialize the bonding curve configuration with fee and PaperHandBitchTax settings
    /// 
    /// # Arguments
    /// * `fee` - Trading fee percentage (0-100)
    /// * `paperhand_tax_bps` - PaperHand tax in basis points (5000 = 50%)
    pub fn initialize(
        ctx: Context<InitializeCurveConfiguration>, 
        fee: f64,
        paperhand_tax_bps: u16,
    ) -> Result<()> {
        instructions::initialize(ctx, fee, paperhand_tax_bps)
    }

    // pub fn create_pool(ctx: Context<CreateLiquidityPool>) -> Result<()> {
    //     instructions::create_pool(ctx)
    // }

    pub fn add_liquidity(
        ctx: Context<AddLiquidity>,
        amount_one: u64,
        amount_two: u64,
    ) -> Result<()> {
        instructions::add_liquidity(ctx, amount_one, amount_two)
    }

    pub fn remove_liquidity(
        ctx: Context<RemoveLiquidity>,
        nonce: u8,
        init_pc_amount: u64,
    ) -> Result<()> {
        instructions::remove_liquidity(ctx, nonce, init_pc_amount)
    }

    /// Swap tokens using the bonding curve
    /// 
    /// # Arguments
    /// * `amount` - Amount to swap (tokens if selling, SOL if buying)
    /// * `style` - 1 for SELL (tokens -> SOL), 2 for BUY (SOL -> tokens)
    /// 
    /// # PaperHandBitchTax
    /// When selling at a loss (SOL received < cost basis), a 50% tax is applied
    /// to the SOL proceeds and sent to the treasury vault.
    pub fn swap(ctx: Context<Swap>, amount: u64, style: u64) -> Result<()> {
        instructions::swap(ctx, amount, style)
    }

// function removed

    /// Launch a new token with Paper Hand Tax enabled
    /// 
    /// Creates a new SPL token, sets Metaplex metadata, initializes the bonding
    /// curve pool, and mints the initial supply.
    /// 
    /// # Arguments
    /// * `name` - Token name (max 32 chars)
    /// * `symbol` - Token symbol (max 10 chars)
    /// * `uri` - Metadata URI (max 200 chars)
    /// * `decimals` - Token decimals (typically 6 or 9)
    /// * `initial_supply` - Total supply to mint
    /// * `initial_sol_reserve` - Initial SOL for bonding curve
    pub fn launch(
        ctx: Context<Launch>,
        name: String,
        symbol: String,
        uri: String,
        decimals: u8,
        initial_supply: u64,
        initial_sol_reserve: u64,
    ) -> Result<()> {
        instructions::launch(ctx, name, symbol, uri, decimals, initial_supply, initial_sol_reserve)
    }

    pub fn update_configuration(
        ctx: Context<UpdateCurveConfiguration>,
        new_treasury: Pubkey,
        new_fees: Option<f64>,
    ) -> Result<()> {
        instructions::update_configuration(ctx, new_treasury, new_fees)
    }
}
