use crate::{errors::CustomError, state::*};
use anchor_lang::prelude::*;

pub fn update_configuration(
    ctx: Context<UpdateCurveConfiguration>,
    new_treasury: Pubkey,
    new_fees: Option<f64>,
) -> Result<()> {
    let dex_config = &mut ctx.accounts.dex_configuration_account;

    if let Some(fees) = new_fees {
        if fees < 0_f64 || fees > 100_f64 {
            return err!(CustomError::InvalidFee);
        }
        dex_config.fees = fees;
    }

    dex_config.treasury = new_treasury;

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

    #[account(mut)]
    pub admin: Signer<'info>,
}
