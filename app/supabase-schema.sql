-- PHBT Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Profiles table (stores wallet, watchlist, achievements)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet TEXT UNIQUE NOT NULL,
    watchlist TEXT[] DEFAULT '{}',
    achievements JSONB DEFAULT '[]',
    stats JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast wallet lookups
CREATE INDEX IF NOT EXISTS idx_profiles_wallet ON profiles(wallet);

-- Trades table (tracks all trades for achievements)
CREATE TABLE IF NOT EXISTS trades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet TEXT NOT NULL,
    trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
    token_mint TEXT NOT NULL,
    sol_amount DECIMAL DEFAULT 0,
    is_profitable BOOLEAN DEFAULT false,
    tax_paid DECIMAL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for trades
CREATE INDEX IF NOT EXISTS idx_trades_wallet ON trades(wallet);
CREATE INDEX IF NOT EXISTS idx_trades_token ON trades(token_mint);
CREATE INDEX IF NOT EXISTS idx_trades_created ON trades(created_at);

-- Tokens table (tracks token creations)
CREATE TABLE IF NOT EXISTS tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet TEXT NOT NULL,
    token_mint TEXT UNIQUE NOT NULL,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for tokens
CREATE INDEX IF NOT EXISTS idx_tokens_wallet ON tokens(wallet);
CREATE INDEX IF NOT EXISTS idx_tokens_category ON tokens(category);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow public read/write (wallet verification happens client-side)
-- For production, you'd want stricter policies with wallet signature verification

-- Profiles: Anyone can read/write their own profile
CREATE POLICY "Anyone can view profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Anyone can insert profiles" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update profiles" ON profiles FOR UPDATE USING (true);

-- Trades: Anyone can read/write
CREATE POLICY "Anyone can view trades" ON trades FOR SELECT USING (true);
CREATE POLICY "Anyone can insert trades" ON trades FOR INSERT WITH CHECK (true);

-- Tokens: Anyone can read/write
CREATE POLICY "Anyone can view tokens" ON tokens FOR SELECT USING (true);
CREATE POLICY "Anyone can insert tokens" ON tokens FOR INSERT WITH CHECK (true);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles
DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

