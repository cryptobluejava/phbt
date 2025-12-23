"use client"

import { useMemo, ReactNode } from "react"
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from "@solana/wallet-adapter-react"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets"
import { RPC_ENDPOINT } from "@/lib/constants"

// Import wallet adapter styles
import "@solana/wallet-adapter-react-ui/styles.css"

interface Props {
  children: ReactNode
}

export function WalletProvider({ children }: Props) {
  // Use mainnet RPC
  const endpoint = useMemo(() => RPC_ENDPOINT, [])

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  )
}
