use crate::errors::CustomError;
// Imports removed

use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::token::{self, Mint, Token, TokenAccount};
// Unused imports removed
use std::cmp;


#[account]
pub struct CurveConfiguration {
    pub fees: u16,
    /// Treasury wallet that receives the PaperHand tax
    pub treasury: Pubkey,
    /// Tax rate in basis points (e.g., 5000 = 50%)
    pub paperhand_tax_bps: u16,
    /// Admin authority for updating config
    pub admin: Pubkey,
    /// Default virtual SOL reserve for new pools (in lamports)
    /// This creates virtual liquidity for better price curves
    /// 50 SOL = 50_000_000_000 lamports
    pub default_virtual_sol: u64,
}

impl CurveConfiguration {
    pub const SEED: &'static str = "CurveConfiguration";
    pub const TREASURY_VAULT_SEED: &'static str = "treasury_vault";

    // Discriminator (8) + u16 (2) + Pubkey (32) + u16 (2) + Pubkey (32) + u64 (8) + padding (2)
    // 8 + 2 + 32 + 2 + 32 + 8 + 2 = 86
    pub const ACCOUNT_SIZE: usize = 8 + 2 + 32 + 2 + 32 + 8 + 2;

    pub fn new(fees: u16, treasury: Pubkey, paperhand_tax_bps: u16, admin: Pubkey) -> Self {
        Self { 
            fees, 
            treasury,
            paperhand_tax_bps,
            admin,
            default_virtual_sol: 50_000_000_000, // 50 SOL default
        }
    }
}

/// Tracks a user's cost basis for a specific pool
/// Used to determine if a sell is at a loss for PaperHandBitchTax
#[account]
pub struct UserPosition {
    /// The pool this position is for
    pub pool: Pubkey,
    /// The owner of this position
    pub owner: Pubkey,
    /// Total tokens bought through the bonding curve (in smallest units)
    pub total_tokens: u64,
    /// Total SOL spent buying tokens (in lamports)
    pub total_sol: u64,
    /// PDA bump seed
    pub bump: u8,
}

impl UserPosition {
    pub const SEED_PREFIX: &'static str = "position";

    // Discriminator (8) + Pubkey (32) + Pubkey (32) + u64 (8) + u64 (8) + u8 (1)
    pub const ACCOUNT_SIZE: usize = 8 + 32 + 32 + 8 + 8 + 1;

    pub fn new(pool: Pubkey, owner: Pubkey, bump: u8) -> Self {
        Self {
            pool,
            owner,
            total_tokens: 0,
            total_sol: 0,
            bump,
        }
    }

    /// Calculate cost basis for a given token amount using u128 for overflow safety
    /// Returns the proportional SOL cost for the tokens being sold
    pub fn calculate_cost_basis_for_sale(&self, token_amount: u64) -> Result<u64> {
        if self.total_tokens == 0 {
            return Ok(0);
        }
        
        // Use u128 to prevent overflow: (total_sol * token_amount) / total_tokens
        let cost = (self.total_sol as u128)
            .checked_mul(token_amount as u128)
            .ok_or(CustomError::MathOverflow)?
            .checked_div(self.total_tokens as u128)
            .ok_or(CustomError::MathOverflow)?;
        
        // Ensure result fits in u64
        if cost > u64::MAX as u128 {
            return Err(CustomError::MathOverflow.into());
        }
        
        Ok(cost as u64)
    }

    /// Update position after a buy
    pub fn record_buy(&mut self, tokens_received: u64, sol_spent: u64) -> Result<()> {
        self.total_tokens = self.total_tokens
            .checked_add(tokens_received)
            .ok_or(CustomError::MathOverflow)?;
        self.total_sol = self.total_sol
            .checked_add(sol_spent)
            .ok_or(CustomError::MathOverflow)?;
        Ok(())
    }

    /// Update position after a sell
    /// Reduces total_tokens by token_amount and total_sol by cost_basis proportionally
    pub fn record_sell(&mut self, token_amount: u64, cost_basis: u64) -> Result<()> {
        self.total_tokens = self.total_tokens
            .checked_sub(token_amount)
            .ok_or(CustomError::InsufficientPosition)?;
        self.total_sol = self.total_sol
            .checked_sub(cost_basis)
            .ok_or(CustomError::MathOverflow)?;
        
        // Clean up dust when position is empty
        if self.total_tokens == 0 {
            self.total_sol = 0;
        }
        
        Ok(())
    }
}

#[account]
pub struct LiquidityProvider {
    pub shares: u64, // The number of shares this provider holds in the liquidity pool ( didnt add to contract now )
}

impl LiquidityProvider {
    pub const SEED_PREFIX: &'static str = "LiqudityProvider"; // Prefix for generating PDAs

    // Discriminator (8) + f64 (8)
    pub const ACCOUNT_SIZE: usize = 8 + 8;
}

#[account]
pub struct LiquidityPool {
    pub token_one: Pubkey, // Public key of the first token in the liquidity pool
    pub token_two: Pubkey, // Public key of the second token in the pool
    pub total_supply: u64, // Total supply of liquidity tokens
    pub reserve_one: u64,  // Reserve amount of token_one in the pool
    pub reserve_two: u64,  // Reserve amount of token_two (SOL) in the pool
    pub virtual_sol_reserve: u64, // Virtual SOL reserve for price calculation
    pub bump: u8,          // Nonce for the program-derived address
}

impl LiquidityPool {
    pub const POOL_SEED_PREFIX: &'static str = "liquidity_pool";

    // Discriminator (8) + Pubkey (32) + Pubkey (32) + totalsupply (8)
    // + reserve one (8) + reserve two (8) + virtual_sol_reserve (8) + Bump (1)
    pub const ACCOUNT_SIZE: usize = 8 + 32 + 32 + 8 + 8 + 8 + 8 + 1;

    // Constructor to initialize a LiquidityPool with two tokens and a bump for the PDA
    pub fn new(token_one: Pubkey, bump: u8, virtual_sol: u64) -> Self {
        Self {
            token_one: token_one,
            token_two: token_one,
            total_supply: 0_u64,
            reserve_one: 0_u64,
            reserve_two: 0_u64,
            virtual_sol_reserve: virtual_sol,
            bump: bump,
        }
    }
    
    /// Get effective SOL reserve (real + virtual) for price calculations
    pub fn effective_sol_reserve(&self) -> u64 {
        self.reserve_two.saturating_add(self.virtual_sol_reserve)
    }
}

pub trait LiquidityPoolAccount<'info> {
    // Grants a specific number of shares to a liquidity provider's account
    fn grant_shares(
        &mut self,
        liquidity_provider_account: &mut Account<'info, LiquidityProvider>,
        hares: u64,
    ) -> Result<()>;

    // Removes a specific number of shares from a liquidity provider's account
    fn remove_shares(
        &mut self,
        liquidity_provider_account: &mut Account<'info, LiquidityProvider>,
        shares: u64,
    ) -> Result<()>;

    // Updates the token reserves in the liquidity pool
    fn update_reserves(&mut self, reserve_one: u64, reserve_two: u64) -> Result<()>;

    // Allows adding liquidity by depositing an amount of two tokens and getting back pool shares
    fn add_liquidity(
        &mut self,
        token_one_accounts: (
            &mut Account<'info, Mint>,
            &mut Account<'info, TokenAccount>,
            &mut Account<'info, TokenAccount>,
        ),
        token_two_accounts: (
            &mut Account<'info, Mint>,
            &mut AccountInfo<'info>,
            &mut AccountInfo<'info>,
        ),
        amount_one: u64,
        amount_two: u64,
        liquidity_provider_account: &mut Account<'info, LiquidityProvider>,
        authority: &Signer<'info>,
        token_program: &Program<'info, Token>,
    ) -> Result<()>;

    // Allows removing liquidity by burning pool shares and receiving back a proportionate amount of tokens
    fn remove_liquidity(
        &mut self,
        token_one_accounts: (
            &mut Account<'info, Mint>,
            &mut Account<'info, TokenAccount>,
            &mut Account<'info, TokenAccount>,
        ),
        token_two_accounts: (
            &mut Account<'info, Mint>,
            &mut AccountInfo<'info>,
            &mut AccountInfo<'info>,
        ),
        shares: u64,
        liquidity_provider_account: &mut Account<'info, LiquidityProvider>,
        authority: &Signer<'info>,
        token_program: &Program<'info, Token>,
    ) -> Result<()>;

    fn swap(
        &mut self,
        bonding_configuration_account: &Account<'info, CurveConfiguration>,
        token_one_accounts: (
            &mut Account<'info, Mint>,
            &mut Account<'info, TokenAccount>,
            &mut Account<'info, TokenAccount>,
        ),
        token_two_accounts: (
            &mut Account<'info, Mint>,
            &mut AccountInfo<'info>,
            &mut Signer<'info>,
        ),
        amount: u64,
        style: u64,
        bump: u8,
        authority: &Signer<'info>,
        token_program: &Program<'info, Token>,
        system_program: &Program<'info, System>,
    ) -> Result<()>;

    fn transfer_token_from_pool(
        &self,
        from: &Account<'info, TokenAccount>,
        to: &Account<'info, TokenAccount>,
        amount: u64,
        token_program: &Program<'info, Token>,
        authority: &AccountInfo<'info>,
        bump: u8
    ) -> Result<()>;

    fn transfer_token_to_pool(
        &self,
        from: &Account<'info, TokenAccount>,
        to: &Account<'info, TokenAccount>,
        amount: u64,
        authority: &Signer<'info>,
        token_program: &Program<'info, Token>,
    ) -> Result<()>;

    fn transfer_sol_to_pool(
        &self,
        from: &Signer<'info>,
        to: &AccountInfo<'info>,
        amount: u64,
        system_program: &Program<'info, System>,
    ) -> Result<()>;

    fn transfer_sol_from_pool(
        &self,
        from: &AccountInfo<'info>,
        to: &AccountInfo<'info>,
        amount: u64,
        system_program: &Program<'info, System>,
        bump: u8
    ) -> Result<()>;
}

impl<'info> LiquidityPoolAccount<'info> for Account<'info, LiquidityPool> {
    fn grant_shares(
        &mut self,
        liquidity_provider_account: &mut Account<'info, LiquidityProvider>,
        shares: u64,
    ) -> Result<()> {
        liquidity_provider_account.shares = liquidity_provider_account
            .shares
            .checked_add(shares)
            .ok_or(CustomError::FailedToAllocateShares)?;

        self.total_supply = self
            .total_supply
            .checked_add(shares)
            .ok_or(CustomError::OverflowOrUnderflowOccurred)?;

        Ok(())
    }

    fn remove_shares(
        &mut self,
        liquidity_provider_account: &mut Account<'info, LiquidityProvider>,
        shares: u64,
    ) -> Result<()> {
        liquidity_provider_account.shares = liquidity_provider_account
            .shares
            .checked_sub(shares)
            .ok_or(CustomError::FailedToDeallocateShares)?;

        self.total_supply = self
            .total_supply
            .checked_sub(shares)
            .ok_or(CustomError::OverflowOrUnderflowOccurred)?;

        Ok(())
    }

    fn update_reserves(&mut self, reserve_one: u64, reserve_two: u64) -> Result<()> {
        self.reserve_one = reserve_one;
        self.reserve_two = reserve_two;

        Ok(())
    }

    fn add_liquidity(
        &mut self,
        token_one_accounts: (
            &mut Account<'info, Mint>,
            &mut Account<'info, TokenAccount>,
            &mut Account<'info, TokenAccount>,
        ),
        _token_two_accounts: (
            &mut Account<'info, Mint>,
            &mut AccountInfo<'info>,
            &mut AccountInfo<'info>,
        ),
        amount_one: u64,
        amount_two: u64,
        liquidity_provider_account: &mut Account<'info, LiquidityProvider>,
        authority: &Signer<'info>,
        token_program: &Program<'info, Token>,
    ) -> Result<()> {
        let shares_to_allocate;

        if self.total_supply == 0 {
            // Use integer sqrt of raw product (Standard Uniswap V2)
            // shares = sqrt(amount_one * amount_two)
            let product = (amount_one as u128)
                .checked_mul(amount_two as u128)
                .ok_or(CustomError::MathOverflow)?;
            
            // Simple integer sqrt
            let sqrt_shares = {
                if product < 2 {
                    product as u64
                } else {
                    let mut x = product;
                    let mut y = (x + 1) >> 1;
                    while y < x {
                        x = y;
                        y = (x + product / x) >> 1;
                    }
                    x as u64
                }
            };

            shares_to_allocate = sqrt_shares;
        } else {
            let mul_value = amount_one
                .checked_mul(self.total_supply)
                .ok_or(CustomError::OverflowOrUnderflowOccurred)?;
            let shares_one = mul_value
                .checked_div(self.reserve_one)
                .ok_or(CustomError::OverflowOrUnderflowOccurred)?;

            let mul_value = amount_two
                .checked_mul(self.total_supply)
                .ok_or(CustomError::OverflowOrUnderflowOccurred)?;
            let shares_two = mul_value
                .checked_div(self.reserve_two)
                .ok_or(CustomError::OverflowOrUnderflowOccurred)?;

            shares_to_allocate = cmp::min(shares_one, shares_two);
        }

        if shares_to_allocate <= 0 {
            return err!(CustomError::FailedToAddLiquidity);
        }

        self.grant_shares(liquidity_provider_account, shares_to_allocate)?;

        let new_reserves_one = self
            .reserve_one
            .checked_add(amount_one)
            .ok_or(CustomError::OverflowOrUnderflowOccurred)?;
        let new_reserves_two = self
            .reserve_two
            .checked_add(amount_two)
            .ok_or(CustomError::OverflowOrUnderflowOccurred)?;

        self.update_reserves(new_reserves_one, new_reserves_two)?;

        self.transfer_token_to_pool(
            token_one_accounts.2,
            token_one_accounts.1,
            amount_one,
            authority,
            token_program,
        )?;

        Ok(())
    }

    fn remove_liquidity(
        &mut self,
        _token_one_accounts: (
            &mut Account<'info, Mint>,
            &mut Account<'info, TokenAccount>,
            &mut Account<'info, TokenAccount>,
        ),
        _token_two_accounts: (
            &mut Account<'info, Mint>,
            &mut AccountInfo<'info>,
            &mut AccountInfo<'info>,
        ),
        shares: u64,
        liquidity_provider_account: &mut Account<'info, LiquidityProvider>,
        _authority: &Signer<'info>,
        _token_program: &Program<'info, Token>,
    ) -> Result<()> {
        if shares <= 0 {
            return err!(CustomError::FailedToRemoveLiquidity);
        }

        if liquidity_provider_account.shares < shares {
            return err!(CustomError::InsufficientShares);
        }

        let mul_value = shares
            .checked_mul(self.reserve_one)
            .ok_or(CustomError::OverflowOrUnderflowOccurred)?;

        let amount_out_one = mul_value
            .checked_div(self.total_supply)
            .ok_or(CustomError::OverflowOrUnderflowOccurred)?;

        let mul_value = shares
            .checked_mul(self.reserve_two)
            .ok_or(CustomError::OverflowOrUnderflowOccurred)?;

        let amount_out_two = mul_value
            .checked_div(self.total_supply)
            .ok_or(CustomError::OverflowOrUnderflowOccurred)?;

        if amount_out_one <= 0 || amount_out_two <= 0 {
            return err!(CustomError::FailedToRemoveLiquidity);
        }

        self.remove_shares(liquidity_provider_account, shares)?;

        let new_reserves_one = self
            .reserve_one
            .checked_sub(amount_out_one)
            .ok_or(CustomError::OverflowOrUnderflowOccurred)?;
        let new_reserves_two = self
            .reserve_two
            .checked_sub(amount_out_two)
            .ok_or(CustomError::OverflowOrUnderflowOccurred)?;

        self.update_reserves(new_reserves_one, new_reserves_two)?;

        // self.transfer_token_from_pool(
        //     token_one_accounts.1,
        //     token_one_accounts.2,
        //     amount_out_one,
        //     token_program,
        // )?;

        Ok(())
    }

    fn swap(
        &mut self,
        _bonding_configuration_account: &Account<'info, CurveConfiguration>,
        token_one_accounts: (
            &mut Account<'info, Mint>,
            &mut Account<'info, TokenAccount>,
            &mut Account<'info, TokenAccount>,
        ),
        token_two_accounts: (
            &mut Account<'info, Mint>,
            &mut AccountInfo<'info>,
            &mut Signer<'info>,
        ),
        amount: u64,
        style: u64,
        bump: u8,
        authority: &Signer<'info>,
        token_program: &Program<'info, Token>,
        system_program: &Program<'info, System>,
    ) -> Result<()> {
        if amount <= 0 {
            return err!(CustomError::InvalidAmount);
        }
        msg!("Mint: {:?} ", token_one_accounts.0.key());
        msg!(
            "Swap: {:?} {:?} {:?}",
            authority.key(),
            style,
            amount
        );

        // xy = k => Constant product formula
        // (x + dx)(y - dy) = k
        // y - dy = k / (x + dx)
        // y - dy = xy / (x + dx)
        // dy = y - (xy / (x + dx))
        // dy = yx + ydx - xy / (x + dx)
        // formula => dy = ydx / (x + dx)

        // Integer math replacement for swap logic in trait
        // adjusted_amount = amount * (10000 - fees) / 10000
        let fees_bps = _bonding_configuration_account.fees as u128; // fees is u16
        let adjusted_amount = (amount as u128)
            .checked_mul(10000u128.checked_sub(fees_bps).ok_or(CustomError::MathOverflow)?)
            .ok_or(CustomError::MathOverflow)?
            .checked_div(10000)
            .ok_or(CustomError::MathOverflow)? as u64;

        if style == 1 {
             // SELL logic
            let reserve_one = self.reserve_one as u128;
            let reserve_two = self.reserve_two as u128;
            let adjusted_amt = adjusted_amount as u128;

            let denominator = reserve_one.checked_add(adjusted_amt).ok_or(CustomError::OverflowOrUnderflowOccurred)?;
            let k = reserve_one.checked_mul(reserve_two).ok_or(CustomError::MathOverflow)?;
            
            let new_reserve_two = k.checked_div(denominator).ok_or(CustomError::MathOverflow)?;
            let sol_out_before_tax = (reserve_two.checked_sub(new_reserve_two).ok_or(CustomError::MathOverflow)?) as u64;
            
            let amount_out = sol_out_before_tax; // For update_reserves below

             let new_reserves_one = self
                .reserve_one
                .checked_add(amount)
                .ok_or(CustomError::OverflowOrUnderflowOccurred)?;

            let new_reserves_two = self
                .reserve_two
                .checked_sub(amount_out)
                .ok_or(CustomError::OverflowOrUnderflowOccurred)?;

            self.update_reserves(new_reserves_one, new_reserves_two)?;
            msg!{"Reserves: {:?} {:?}", new_reserves_one, new_reserves_two}
            
            self.transfer_token_to_pool(
                token_one_accounts.2,
                token_one_accounts.1,
                amount,
                authority,
                token_program,
            )?;
           
            self.transfer_sol_from_pool(
                token_two_accounts.2,
                token_two_accounts.1,
                amount_out,
                system_program,
                bump
            )?;

        } else {
             // BUY logic
            let reserve_one = self.reserve_one as u128;
            let reserve_two = self.reserve_two as u128;
            let adjusted_amt = adjusted_amount as u128;

            let denominator = reserve_two.checked_add(adjusted_amt).ok_or(CustomError::OverflowOrUnderflowOccurred)?;
            let k = reserve_one.checked_mul(reserve_two).ok_or(CustomError::MathOverflow)?;
            
            let new_reserve_one = k.checked_div(denominator).ok_or(CustomError::MathOverflow)?;
            let tokens_out = (reserve_one.checked_sub(new_reserve_one).ok_or(CustomError::MathOverflow)?) as u64;
            
            let amount_out = tokens_out;

            let new_reserves_one = self
                .reserve_one
                .checked_sub(amount_out)
                .ok_or(CustomError::OverflowOrUnderflowOccurred)?;

            let new_reserves_two = self
                .reserve_two
                .checked_add(amount)
                .ok_or(CustomError::OverflowOrUnderflowOccurred)?;
            
            self.update_reserves(new_reserves_one, new_reserves_two)?;
            
            msg!{"Reserves: {:?} {:?}", new_reserves_one, new_reserves_two}
            
            self.transfer_token_from_pool(
                token_one_accounts.1,
                token_one_accounts.2,
                amount_out,
                token_program,
                token_two_accounts.1,
                bump
            )?;

            self.transfer_sol_to_pool(
                token_two_accounts.2,
                token_two_accounts.1,
                amount,
                system_program,
            )?;
        }
        Ok(())
    }

    fn transfer_token_from_pool(
        &self,
        from: &Account<'info, TokenAccount>,
        to: &Account<'info, TokenAccount>,
        amount: u64,
        token_program: &Program<'info, Token>,
        authority: &AccountInfo<'info>,
        bump: u8
    ) -> Result<()> {
        token::transfer(
            CpiContext::new_with_signer(
                token_program.to_account_info(),
                token::Transfer {
                    from: from.to_account_info(),
                    to: to.to_account_info(),
                    authority: authority.to_account_info(),
                },
                &[&[
                    "global".as_bytes(),
                    &[bump],
                ]],
            ),
            amount,
        )?;

        Ok(())
    }

    // fn execute_token_transfer(
    //     &self,
    //     source: &Account<'info, TokenAccount>,
    //     destination: &Account<'info, TokenAccount>,
    //     transfer_amount: u64,
    //     token_program: &Program<'info, Token>,
    // ) -> Result<()> {
    //     let context = CpiContext::new_with_signer(
    //         token_program.to_account_info(),
    //         token::Transfer {
    //             from: source.to_account_info(),
    //             to: destination.to_account_info(),
    //             authority: self.to_account_info(),
    //         },
    //         &[&[
    //             LiquidityPool::POOL_SEED_PREFIX.as_bytes(),
    //             LiquidityPool::generate_seed(self.token_one.key(), self.token_two.key())
    //                 .as_bytes(),
    //             &[self.bump],
    //         ]],
    //     );

    //     token::transfer(context, transfer_amount)?;

    //     Ok(())
    // }

    fn transfer_token_to_pool(
        &self,
        from: &Account<'info, TokenAccount>,
        to: &Account<'info, TokenAccount>,
        amount: u64,
        authority: &Signer<'info>,
        token_program: &Program<'info, Token>,
    ) -> Result<()> {
        token::transfer(
            CpiContext::new(
                token_program.to_account_info(),
                token::Transfer {
                    from: from.to_account_info(),
                    to: to.to_account_info(),
                    authority: authority.to_account_info(),
                },
            ),
            amount,
        )?;

        Ok(())
    }

    fn transfer_sol_from_pool(
        &self,
        from: &AccountInfo<'info>,
        to: &AccountInfo<'info>,
        amount: u64,
        system_program: &Program<'info, System>,
        bump: u8
    ) -> Result<()> {
        system_program::transfer(
            CpiContext::new_with_signer(
                system_program.to_account_info(),
                system_program::Transfer {
                    from: from.to_account_info().clone(),
                    to: to.clone(),
                },
                &[&[
                    "global".as_bytes(),
                    &[bump],
                ]],
            ),
            amount,
        )?;

        Ok(())
    }

    // fn execute_sol_transfer(
    //     &self,
    //     recipient: &AccountInfo<'info>,
    //     transfer_amount: u64,
    //     system_program: &Program<'info, System>,
    // ) -> Result<()> {
    //     let pool_account = self.to_account_info();

    //     let context = CpiContext::new_with_signer(
    //         system_program.to_account_info(),
    //         system_program::Transfer {
    //             from: pool_account,
    //             to: recipient.clone(),
    //         },
    //         &[&[
    //             LiquidityPool::POOL_SEED_PREFIX.as_bytes(),
    //             LiquidityPool::generate_seed(self.token_one.key(), self.token_two.key())
    //                 .as_bytes(),
    //             &[self.bump],
    //         ]],
    //     );

    //     system_program::transfer(context, transfer_amount)?;

    //     Ok(())
    // }

    fn transfer_sol_to_pool(
        &self,
        from: &Signer<'info>,
        to: &AccountInfo<'info>,
        amount: u64,
        system_program: &Program<'info, System>,
    ) -> Result<()> {
        system_program::transfer(
            CpiContext::new(
                system_program.to_account_info(),
                system_program::Transfer {
                    from: from.to_account_info(),
                    to: to.to_account_info(),
                },
            ),
            amount,
        )?;
        Ok(())
    }
}

pub fn transfer_sol_to_pool<'info>(
    from: AccountInfo<'info>,
    to: AccountInfo<'info>,
    amount: u64,
    system_program: AccountInfo<'info>,
) -> Result<()> {
    system_program::transfer(
        CpiContext::new(
            system_program.to_account_info(),
            system_program::Transfer {
                from: from.to_account_info(),
                to: to.to_account_info(),
            },
        ),
        amount,
    )?;
    Ok(())
}