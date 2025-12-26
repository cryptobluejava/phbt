-- PHBT Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Step 1: Create tables first

-- Profiles table (stores wallet, watchlist, achievements)
CREATE TABLE profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet TEXT UNIQUE NOT NULL,
    watchlist TEXT[] DEFAULT '{}',
    achievements JSONB DEFAULT '[]',
    stats JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trades table (tracks all trades for achievements)
CREATE TABLE trades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet TEXT NOT NULL,
    trade_type TEXT NOT NULL,
    token_mint TEXT NOT NULL,
    sol_amount DECIMAL DEFAULT 0,
    is_profitable BOOLEAN DEFAULT false,
    tax_paid DECIMAL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tokens table (tracks token creations)
CREATE TABLE tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet TEXT NOT NULL,
    token_mint TEXT UNIQUE NOT NULL,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create indexes
CREATE INDEX idx_profiles_wallet ON profiles(wallet);
CREATE INDEX idx_trades_wallet ON trades(wallet);
CREATE INDEX idx_trades_token ON trades(token_mint);
CREATE INDEX idx_trades_created ON trades(created_at);
CREATE INDEX idx_tokens_wallet ON tokens(wallet);
CREATE INDEX idx_tokens_category ON tokens(category);

-- Step 3: Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS Policies (allow public access)
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (true);

CREATE POLICY "trades_select" ON trades FOR SELECT USING (true);
CREATE POLICY "trades_insert" ON trades FOR INSERT WITH CHECK (true);

CREATE POLICY "tokens_select" ON tokens FOR SELECT USING (true);
CREATE POLICY "tokens_insert" ON tokens FOR INSERT WITH CHECK (true);
