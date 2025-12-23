use crate::{errors::CustomError, state::*};
use anchor_lang::prelude::*;

pub fn initialize(
    ctx: Context<InitializeCurveConfiguration>,
    fees: f64,
    paperhand_tax_bps: u16,
) -> Result<()> {
    let dex_config = &mut ctx.accounts.dex_configuration_account;

    if fees < 0_f64 || fees > 100_f64 {
        return err!(CustomError::InvalidFee);
    }

    // Validate paperhand tax bps (max 100% = 10000 bps)
    if paperhand_tax_bps > 10000 {
        return err!(CustomError::InvalidTaxBps);
    }

    let _ = transfer_sol_to_pool(
        ctx.accounts.admin.to_account_info(),
        ctx.accounts.global_account.to_account_info(),
        10000000,
        ctx.accounts.system_program.to_account_info()
    );



    dex_config.set_inner(CurveConfiguration::new(
        fees,
        ctx.accounts.treasury_vault.key(),
        paperhand_tax_bps,
    ));

    Ok(())
}

#[derive(Accounts)]
pub struct InitializeCurveConfiguration<'info> {
    #[account(
        init,
        space = CurveConfiguration::ACCOUNT_SIZE,
        payer = admin,
        seeds = [CurveConfiguration::SEED.as_bytes()],
        bump,
    )]
    pub dex_configuration_account: Box<Account<'info, CurveConfiguration>>,

    /// CHECK: This is the global SOL vault PDA
    #[account(
        mut,
        seeds = [b"global"],
        bump,
    )]
    pub global_account: AccountInfo<'info>,

    /// CHECK: Treasury vault that will receive paperhand taxes
    #[account(mut)]
    pub treasury_vault: AccountInfo<'info>,

    #[account(mut)]
    pub admin: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}
