# PaperHandTax

A Solana bonding curve that taxes paper hands. Sell at a loss, receive 50% less.

## How It Works

When you sell below your cost basis, 50% of your SOL proceeds go to the protocol treasury.

### Loss Calculation

- **Cost basis** is tracked per-wallet using weighted average of platform purchases
- **Loss** = SOL you receive < your proportional cost basis
- **Penalty** = 50% of proceeds routed to treasury

### Example

```
You bought tokens for 1 SOL
Market dumps
You sell and would get 0.6 SOL back

That's a loss. Tax kicks in.

You receive: 0.3 SOL
Treasury gets: 0.3 SOL
```

### Selling at Profit?

No tax. Zero. Diamond hands eat free.

## Addresses

| | Address |
|---|---|
| Token | `` |
| Treasury | `DLzTaDix69bzWsKS7srPqfQg3iZzm2VYVvfM2e6tBxiJ` |
| Program | `J3pvSaDxrBDX38nBG4CcTodGmkaFuRabVW6Erp712GF2` |

## Technical Details

### UserPosition Account

Tracks per-wallet cost basis:
- `total_tokens`: Tokens bought through platform
- `total_sol`: SOL spent on those tokens
- Seeds: `["position", pool, user]`

### On Sell

```
cost_basis = (total_sol × tokens_sold) / total_tokens

if sol_out < cost_basis:
    tax = sol_out × 50%
    user_receives = sol_out - tax
    treasury_receives = tax
```

### Limitations

- Only platform trades are tracked (external DEX trades not included)
- Users can split wallets to avoid tracking (inherent limitation)

## Development

### Build

```bash
anchor build
```

### Run Frontend

```bash
cd app
npm install
npm run dev
```

## Network

**Mainnet** - Live on Solana mainnet-beta

## License

MIT
