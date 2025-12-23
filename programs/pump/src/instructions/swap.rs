use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount},
};
use std::ops::{Div, Mul, Sub};

use crate::{
    errors::CustomError,
    state::{CurveConfiguration, LiquidityPool, UserPosition},
    utils::{convert_from_float, convert_to_float},
};

/// Events for tracking trades and tax application
#[event]
pub struct TradeExecuted {
    pub user: Pubkey,
    pub pool: Pubkey,
    pub side: String,       // "buy" or "sell"
    pub token_amount: u64,
    pub sol_amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct PaperhandTaxApplied {
    pub user: Pubkey,
    pub pool: Pubkey,
    pub sol_out_before_tax: u64,
    pub cost_basis_for_sale: u64,
    pub tax: u64,
    pub sol_to_user: u64,
}

#[event]
pub struct PositionUpdated {
    pub user: Pubkey,
    pub pool: Pubkey,
    pub total_tokens: u64,
    pub total_sol: u64,
}

pub fn swap(ctx: Context<Swap>, amount: u64, style: u64) -> Result<()> {
    if amount <= 0 {
        return err!(CustomError::InvalidAmount);
    }

    let pool = &mut ctx.accounts.pool;
    let config = &ctx.accounts.dex_configuration_account;
    let position = &mut ctx.accounts.user_position;
    
    let clock = Clock::get()?;

    msg!("Mint: {:?} ", ctx.accounts.mint_token_one.key());
    msg!("Swap: {:?} {:?} {:?}", ctx.accounts.user.key(), style, amount);

    // Compute fee-adjusted amount
    let adjusted_amount_in_float = convert_to_float(amount, ctx.accounts.mint_token_one.decimals)
        .div(100_f64)
        .mul(100_f64.sub(config.fees));
    let adjusted_amount = convert_from_float(adjusted_amount_in_float, ctx.accounts.mint_token_one.decimals);

    if style == 1 {
        // SELL: User sells tokens for SOL
        // style == 1 means user sends tokens to pool and receives SOL
        
        // Calculate SOL output before any tax
        let denominator_sum = pool.reserve_one
            .checked_add(adjusted_amount)
            .ok_or(CustomError::OverflowOrUnderflowOccurred)?;

        let div_amt = convert_to_float(denominator_sum, ctx.accounts.mint_token_one.decimals)
            .div(convert_to_float(adjusted_amount, ctx.accounts.mint_token_one.decimals));

        let amount_out_in_float = convert_to_float(pool.reserve_two, 9_u8).div(div_amt);
        let sol_out_before_tax = convert_from_float(amount_out_in_float, 9_u8);

        // Check if user has sufficient position to sell
        if position.total_tokens < amount {
            return err!(CustomError::InsufficientPosition);
        }

        // Calculate cost basis for this sale
        let cost_basis_for_sale = position.calculate_cost_basis_for_sale(amount)?;

        // Determine if this is a loss (sol_out < cost_basis)
        let (sol_to_user, tax_amount) = if sol_out_before_tax < cost_basis_for_sale {
            // It's a loss! Apply PaperHandBitchTax
            // tax = sol_out_before_tax * paperhand_tax_bps / 10000
            let tax = (sol_out_before_tax as u128)
                .checked_mul(config.paperhand_tax_bps as u128)
                .ok_or(CustomError::MathOverflow)?
                .checked_div(10000_u128)
                .ok_or(CustomError::MathOverflow)? as u64;

            let user_receives = sol_out_before_tax
                .checked_sub(tax)
                .ok_or(CustomError::OverflowOrUnderflowOccurred)?;

            msg!("PaperHandBitchTax applied! Cost basis: {}, SOL out: {}, Tax: {}", 
                cost_basis_for_sale, sol_out_before_tax, tax);

            // Emit tax event
            emit!(PaperhandTaxApplied {
                user: ctx.accounts.user.key(),
                pool: pool.key(),
                sol_out_before_tax,
                cost_basis_for_sale,
                tax,
                sol_to_user: user_receives,
            });

            (user_receives, tax)
        } else {
            // No loss, no tax
            (sol_out_before_tax, 0_u64)
        };

        // Update pool reserves
        let new_reserves_one = pool.reserve_one
            .checked_add(amount)
            .ok_or(CustomError::OverflowOrUnderflowOccurred)?;
        let new_reserves_two = pool.reserve_two
            .checked_sub(sol_out_before_tax)
            .ok_or(CustomError::OverflowOrUnderflowOccurred)?;
        
        pool.reserve_one = new_reserves_one;
        pool.reserve_two = new_reserves_two;

        msg!("Reserves: {:?} {:?}", new_reserves_one, new_reserves_two);

        // Transfer tokens from user to pool
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.user_token_account_one.to_account_info(),
                    to: ctx.accounts.pool_token_account_one.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount,
        )?;

        // Transfer SOL from global account to user
        system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.global_account.to_account_info(),
                    to: ctx.accounts.user.to_account_info(),
                },
                &[&[b"global", &[ctx.bumps.global_account]]],
            ),
            sol_to_user,
        )?;

        // If there's tax, transfer it to treasury
        if tax_amount > 0 {
            system_program::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.system_program.to_account_info(),
                    system_program::Transfer {
                        from: ctx.accounts.global_account.to_account_info(),
                        to: ctx.accounts.treasury_vault.to_account_info(),
                    },
                    &[&[b"global", &[ctx.bumps.global_account]]],
                ),
                tax_amount,
            )?;
        }

        // Update user position
        position.record_sell(amount, cost_basis_for_sale)?;

        // Emit events
        emit!(TradeExecuted {
            user: ctx.accounts.user.key(),
            pool: pool.key(),
            side: "sell".to_string(),
            token_amount: amount,
            sol_amount: sol_to_user,
            timestamp: clock.unix_timestamp,
        });

        emit!(PositionUpdated {
            user: ctx.accounts.user.key(),
            pool: pool.key(),
            total_tokens: position.total_tokens,
            total_sol: position.total_sol,
        });

    } else {
        // BUY: User sends SOL to buy tokens
        // style == 2 (or any other) means user sends SOL and receives tokens
        
        let denominator_sum = pool.reserve_two
            .checked_add(adjusted_amount)
            .ok_or(CustomError::OverflowOrUnderflowOccurred)?;

        let div_amt = convert_to_float(denominator_sum, ctx.accounts.mint_token_one.decimals)
            .div(convert_to_float(adjusted_amount, ctx.accounts.mint_token_one.decimals));

        let amount_out_in_float = convert_to_float(pool.reserve_one, 9_u8).div(div_amt);
        let tokens_out = convert_from_float(amount_out_in_float, 9_u8);

        // Update reserves
        let new_reserves_one = pool.reserve_one
            .checked_sub(tokens_out)
            .ok_or(CustomError::OverflowOrUnderflowOccurred)?;
        let new_reserves_two = pool.reserve_two
            .checked_add(amount)
            .ok_or(CustomError::OverflowOrUnderflowOccurred)?;

        pool.reserve_one = new_reserves_one;
        pool.reserve_two = new_reserves_two;

        msg!("Reserves: {:?} {:?}", new_reserves_one, new_reserves_two);

        // Transfer tokens from pool to user
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.pool_token_account_one.to_account_info(),
                    to: ctx.accounts.user_token_account_one.to_account_info(),
                    authority: ctx.accounts.global_account.to_account_info(),
                },
                &[&[b"global", &[ctx.bumps.global_account]]],
            ),
            tokens_out,
        )?;

        // Transfer SOL from user to global account
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.user.to_account_info(),
                    to: ctx.accounts.global_account.to_account_info(),
                },
            ),
            amount,
        )?;

        // Update user position: record the buy
        // We track the actual SOL spent (before fees go elsewhere, this is the user's cost)
        position.record_buy(tokens_out, amount)?;

        // Emit events
        emit!(TradeExecuted {
            user: ctx.accounts.user.key(),
            pool: pool.key(),
            side: "buy".to_string(),
            token_amount: tokens_out,
            sol_amount: amount,
            timestamp: clock.unix_timestamp,
        });

        emit!(PositionUpdated {
            user: ctx.accounts.user.key(),
            pool: pool.key(),
            total_tokens: position.total_tokens,
            total_sol: position.total_sol,
        });
    }

    Ok(())
}

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(
        mut,
        seeds = [CurveConfiguration::SEED.as_bytes()],
        bump,
    )]
    pub dex_configuration_account: Box<Account<'info, CurveConfiguration>>,

    #[account(
        mut,
        seeds = [LiquidityPool::POOL_SEED_PREFIX.as_bytes(), mint_token_one.key().as_ref()],
        bump = pool.bump
    )]
    pub pool: Box<Account<'info, LiquidityPool>>,

    /// CHECK: Global SOL vault PDA
    #[account(
        mut,
        seeds = [b"global"],
        bump,
    )]
    pub global_account: AccountInfo<'info>,

    /// CHECK: Treasury account that receives paperhand taxes
    #[account(
        mut,
        constraint = treasury_vault.key() == dex_configuration_account.treasury
    )]
    pub treasury_vault: AccountInfo<'info>,

    /// User position account for tracking cost basis (init_if_needed on first buy)
    #[account(
        init_if_needed,
        payer = user,
        space = UserPosition::ACCOUNT_SIZE,
        seeds = [UserPosition::SEED_PREFIX.as_bytes(), pool.key().as_ref(), user.key().as_ref()],
        bump,
    )]
    pub user_position: Box<Account<'info, UserPosition>>,

    #[account(mut)]
    pub mint_token_one: Box<Account<'info, Mint>>,

    #[account(
        mut,
        associated_token::mint = mint_token_one,
        associated_token::authority = global_account
    )]
    pub pool_token_account_one: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = mint_token_one,
        associated_token::authority = user,
    )]
    pub user_token_account_one: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub user: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
