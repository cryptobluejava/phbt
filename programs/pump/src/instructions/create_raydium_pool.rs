use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

use crate::state::LiquidityPool;

pub fn create_raydium_pool(
    _ctx: Context<CreateRaydiumPool>,
    _nonce: u8,
    _init_pc_amount: u64,
    _init_coin_amount: u64,
) -> Result<()> {
    // Raydium pool creation logic
    // If you want to interact with CPI, contact the original developer
    Ok(())
}

#[derive(Accounts)]
pub struct CreateRaydiumPool<'info> {
    #[account(
        mut,
        seeds = [LiquidityPool::POOL_SEED_PREFIX.as_bytes(), coin_mint.key().as_ref()],
        bump = pool.bump
    )]
    pub pool: Box<Account<'info, LiquidityPool>>,

    /// CHECK: Global account PDA
    #[account(
        mut,
        seeds = [b"global"],
        bump,
    )]
    pub global_account: AccountInfo<'info>,

    #[account(mut)]
    pub coin_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

