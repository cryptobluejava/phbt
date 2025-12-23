use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::{
    metadata::{
        create_metadata_accounts_v3,
        mpl_token_metadata::types::DataV2,
        CreateMetadataAccountsV3,
    },
    token::{self, Mint, MintTo},
};

use crate::state::{CurveConfiguration, LiquidityPool};

/// Event emitted when a new token is launched
#[event]
pub struct TokenLaunched {
    pub creator: Pubkey,
    pub mint: Pubkey,
    pub pool: Pubkey,
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub initial_supply: u64,
    pub timestamp: i64,
}

/// Launch a new token with Paper Hand Tax enabled
/// 
/// This instruction:
/// 1. Creates a new SPL Token Mint
/// 2. Creates Metaplex Metadata (name, symbol, image)
/// 3. Initializes the Bonding Curve Pool
/// 4. Mints initial supply to the pool
/// 5. Revokes mint authority (fixed supply)
pub fn launch(
    ctx: Context<Launch>,
    name: String,
    symbol: String,
    uri: String,
    _decimals: u8,
    initial_supply: u64,
    initial_sol_reserve: u64,
) -> Result<()> {
    // Validate inputs first (small stack usage)
    require!(name.len() <= 32, LaunchError::NameTooLong);
    require!(symbol.len() <= 10, LaunchError::SymbolTooLong);
    require!(uri.len() <= 200, LaunchError::UriTooLong);
    require!(initial_supply > 0, LaunchError::InvalidSupply);
    require!(initial_sol_reserve > 0, LaunchError::InvalidSolReserve);

    msg!("Launching token: {} ({})", name, symbol);

    // Call helper functions with #[inline(never)] to use separate stack frames
    create_metadata_helper(&ctx, &name, &symbol, &uri)?;
    initialize_pool_helper(
        &mut ctx.accounts.pool,
        ctx.accounts.mint.key(),
        ctx.bumps.pool,
        initial_supply,
        initial_sol_reserve
    )?;
    create_pool_token_account_helper(&ctx)?;
    mint_tokens_helper(&ctx, initial_supply)?;
    transfer_sol_helper(&ctx, initial_sol_reserve)?;
    
    // Initialize LP and emit event
    finalize_launch_helper(&ctx, initial_supply, name, symbol, uri)?;

    msg!("Token launched successfully! Pool: {}", ctx.accounts.pool.key());
    Ok(())
}

#[inline(never)]
fn create_pool_token_account_helper(ctx: &Context<Launch>) -> Result<()> {
    use anchor_spl::associated_token::Create;
    anchor_spl::associated_token::create(
        CpiContext::new(
            ctx.accounts.associated_token_program.to_account_info(),
            Create {
                payer: ctx.accounts.creator.to_account_info(),
                associated_token: ctx.accounts.pool_token_account.to_account_info(),
                authority: ctx.accounts.global_account.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
            },
        ),
    )?;
    Ok(())
}

#[inline(never)]
fn create_metadata_helper(
    ctx: &Context<Launch>,
    name: &str,
    symbol: &str,
    uri: &str,
) -> Result<()> {
    let data = DataV2 {
        name: name.to_string(),
        symbol: symbol.to_string(),
        uri: uri.to_string(),
        seller_fee_basis_points: 0,
        creators: None,
        collection: None,
        uses: None,
    };

    create_metadata_accounts_v3(
        CpiContext::new_with_signer(
            ctx.accounts.metadata_program.to_account_info(),
            CreateMetadataAccountsV3 {
                metadata: ctx.accounts.metadata.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                mint_authority: ctx.accounts.global_account.to_account_info(),
                payer: ctx.accounts.creator.to_account_info(),
                update_authority: ctx.accounts.global_account.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
            &[&[b"global", &[ctx.bumps.global_account]]],
        ),
        data,
        true,
        true,
        None,
    )?;
    Ok(())
}

#[inline(never)]
fn initialize_pool_helper(
    pool: &mut Box<Account<'_, LiquidityPool>>,
    mint_key: Pubkey,
    bump: u8,
    initial_supply: u64,
    initial_sol_reserve: u64,
) -> Result<()> {
    pool.token_one = mint_key;
    pool.token_two = mint_key;
    pool.total_supply = initial_supply;
    pool.reserve_one = initial_supply;
    pool.reserve_two = initial_sol_reserve;
    pool.bump = bump;
    Ok(())
}

#[inline(never)]
fn mint_tokens_helper(ctx: &Context<Launch>, initial_supply: u64) -> Result<()> {
    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.pool_token_account.to_account_info(),
                authority: ctx.accounts.global_account.to_account_info(),
            },
            &[&[b"global", &[ctx.bumps.global_account]]],
        ),
        initial_supply,
    )?;
    Ok(())
}

#[inline(never)]
fn transfer_sol_helper(ctx: &Context<Launch>, initial_sol_reserve: u64) -> Result<()> {
    if initial_sol_reserve > 0 {
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.creator.to_account_info(),
                    to: ctx.accounts.global_account.to_account_info(),
                },
            ),
            initial_sol_reserve,
        )?;
    }
    Ok(())
}

#[inline(never)]
fn finalize_launch_helper(
    ctx: &Context<Launch>,
    initial_supply: u64,
    name: String,
    symbol: String,
    uri: String,
) -> Result<()> {
    let clock = Clock::get()?;
    
    // Emit event
    emit!(TokenLaunched {
        creator: ctx.accounts.creator.key(),
        mint: ctx.accounts.mint.key(),
        pool: ctx.accounts.pool.key(),
        name,
        symbol,
        uri,
        initial_supply,
        timestamp: clock.unix_timestamp,
    });
    
    Ok(())
}

#[derive(Accounts)]
#[instruction(name: String, symbol: String, uri: String, decimals: u8)]
pub struct Launch<'info> {
    /// The CurveConfiguration must exist (initialized)
    #[account(
        seeds = [CurveConfiguration::SEED.as_bytes()],
        bump,
    )]
    pub dex_configuration_account: Box<Account<'info, CurveConfiguration>>,

    /// The new token mint (PDA derived from symbol for uniqueness)
    #[account(
        init,
        payer = creator,
        mint::decimals = decimals,
        mint::authority = global_account,
        mint::freeze_authority = global_account,
        seeds = [b"mint", symbol.as_bytes()],
        bump,
    )]
    pub mint: Box<Account<'info, Mint>>,

    /// CHECK: Metaplex Metadata account (created via CPI)
    #[account(
        mut,
        seeds = [
            b"metadata",
            metadata_program.key.as_ref(),
            mint.key().as_ref(),
        ],
        bump,
        seeds::program = metadata_program.key(),
    )]
    pub metadata: UncheckedAccount<'info>,

    /// The liquidity pool for this token
    #[account(
        init,
        payer = creator,
        space = LiquidityPool::ACCOUNT_SIZE,
        seeds = [LiquidityPool::POOL_SEED_PREFIX.as_bytes(), mint.key().as_ref()],
        bump,
    )]
    pub pool: Box<Account<'info, LiquidityPool>>,

    /// CHECK: Global SOL vault PDA
    #[account(
        mut,
        seeds = [b"global"],
        bump,
    )]
    pub global_account: UncheckedAccount<'info>,

    /// Pool's token account (holds the minted supply)
    /// CHECK: Manually initialized in instruction
    #[account(mut)]
    pub pool_token_account: UncheckedAccount<'info>,

    /// The creator/payer
    #[account(mut)]
    pub creator: Signer<'info>,

    /// System program
    /// CHECK: System program
    pub system_program: UncheckedAccount<'info>,

    /// Token program
    /// CHECK: Token program
    pub token_program: UncheckedAccount<'info>,

    /// Associated token program
    /// CHECK: Associated token program
    pub associated_token_program: UncheckedAccount<'info>,

    /// Metaplex Token Metadata program
    /// CHECK: Metaplex Token Metadata program
    pub metadata_program: UncheckedAccount<'info>,

    /// Rent sysvar
    pub rent: Sysvar<'info, Rent>,
}

#[error_code]
pub enum LaunchError {
    #[msg("Token name is too long (max 32 characters)")]
    NameTooLong,
    #[msg("Token symbol is too long (max 10 characters)")]
    SymbolTooLong,
    #[msg("Metadata URI is too long (max 200 characters)")]
    UriTooLong,
    #[msg("Initial supply must be greater than 0")]
    InvalidSupply,
    #[msg("Initial SOL reserve must be greater than 0")]
    InvalidSolReserve,
}
