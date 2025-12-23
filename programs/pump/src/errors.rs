use anchor_lang::prelude::*;

#[error_code]
pub enum CustomError {
    #[msg("Duplicate tokens are not allowed")]
    DuplicateTokenNotAllowed,

    #[msg("Failed to allocate shares")]
    FailedToAllocateShares,

    #[msg("Failed to deallocate shares")]
    FailedToDeallocateShares,

    #[msg("Insufficient shares")]
    InsufficientShares,

    #[msg("Insufficient funds to swap")]
    InsufficientFunds,

    #[msg("Invalid amount to swap")]
    InvalidAmount,

    #[msg("Invalid fee")]
    InvalidFee,

    #[msg("Failed to add liquidity")]
    FailedToAddLiquidity,

    #[msg("Failed to remove liquidity")]
    FailedToRemoveLiquidity,

    #[msg("Overflow or underflow occured")]
    OverflowOrUnderflowOccurred,

    // PaperHandBitchTax errors
    #[msg("Insufficient position: trying to sell more than tracked position")]
    InsufficientPosition,

    #[msg("Position not initialized: user has no buy history for this pool")]
    PositionNotInitialized,

    #[msg("Math overflow occurred during calculation")]
    MathOverflow,

    #[msg("Invalid treasury account")]
    InvalidTreasury,

    #[msg("Invalid paperhand tax basis points (must be <= 10000)")]
    InvalidTaxBps,
}
