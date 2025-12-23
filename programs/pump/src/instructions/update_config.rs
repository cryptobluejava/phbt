use anchor_lang::prelude::*;
use crate::state::CurveConfiguration;
use crate::errors::CustomError;

pub fn update_configuration(
    ctx: Context<UpdateCurveConfiguration>,
    new_fees: Option<u16>,
    new_treasury: Option<Pubkey>,
    new_paperhand_tax_bps: Option<u16>,
) -> Result<()> {
    let dex_config = &mut ctx.accounts.dex_configuration_account;

    // Admin validation
    require!(ctx.accounts.admin.key() == dex_config.admin, CustomError::Unauthorized);

    if let Some(fees) = new_fees {
        if fees > 10000 {
            return err!(CustomError::InvalidFee);
        }
        dex_config.fees = fees;
    }

    if let Some(treasury) = new_treasury {
        dex_config.treasury = treasury;
    }

    if let Some(tax_bps) = new_paperhand_tax_bps {
        if tax_bps > 10000 {
            return err!(CustomError::InvalidTaxBps);
        }
        dex_config.paperhand_tax_bps = tax_bps;
    }

    msg!("Configuration updated by admin: {:?}", ctx.accounts.admin.key());

    Ok(())
}

#[derive(Accounts)]
pub struct UpdateCurveConfiguration<'info> {
    #[account(
        mut,
        seeds = [CurveConfiguration::SEED.as_bytes()],
        bump,
    )]
    pub dex_configuration_account: Box<Account<'info, CurveConfiguration>>,

    #[account(mut, signer)]
    pub admin: Signer<'info>,
}
