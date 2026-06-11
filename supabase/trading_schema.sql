-- ==============================================================================
-- TRADING MODULE DATABASE SCHEMA
-- This script contains all tables, indexes, and Row Level Security (RLS) policies 
-- required for the Trading module.
-- Run this script in your Supabase SQL Editor.
-- ==============================================================================

-- 1. Create table for Farmers (Nông dân)
CREATE TABLE IF NOT EXISTS public.trading_farmers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    transactions INTEGER DEFAULT 0,
    total NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create table for Customers (Khách hàng)
CREATE TABLE IF NOT EXISTS public.trading_customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    type TEXT DEFAULT 'le',
    transactions INTEGER DEFAULT 0,
    total NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create table for Purchases (Phiếu thu mua)
CREATE TABLE IF NOT EXISTS public.trading_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    farmer_id UUID REFERENCES public.trading_farmers(id) ON DELETE SET NULL,
    items JSONB NOT NULL,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    paid_amount NUMERIC NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create table for Sales (Hoá đơn bán hàng)
CREATE TABLE IF NOT EXISTS public.trading_sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.trading_customers(id) ON DELETE SET NULL,
    items JSONB NOT NULL,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    paid_amount NUMERIC NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.trading_farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_sales ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- RLS POLICIES FOR TRADING FARMERS
-- ==============================================================================
CREATE POLICY "Users can view their own farmers" 
    ON public.trading_farmers FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own farmers" 
    ON public.trading_farmers FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own farmers" 
    ON public.trading_farmers FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own farmers" 
    ON public.trading_farmers FOR DELETE 
    USING (auth.uid() = user_id);

-- ==============================================================================
-- RLS POLICIES FOR TRADING CUSTOMERS
-- ==============================================================================
CREATE POLICY "Users can view their own customers" 
    ON public.trading_customers FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own customers" 
    ON public.trading_customers FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customers" 
    ON public.trading_customers FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own customers" 
    ON public.trading_customers FOR DELETE 
    USING (auth.uid() = user_id);

-- ==============================================================================
-- RLS POLICIES FOR TRADING PURCHASES
-- ==============================================================================
CREATE POLICY "Users can view their own purchases" 
    ON public.trading_purchases FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own purchases" 
    ON public.trading_purchases FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchases" 
    ON public.trading_purchases FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchases" 
    ON public.trading_purchases FOR DELETE 
    USING (auth.uid() = user_id);

-- ==============================================================================
-- RLS POLICIES FOR TRADING SALES
-- ==============================================================================
CREATE POLICY "Users can view their own sales" 
    ON public.trading_sales FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sales" 
    ON public.trading_sales FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sales" 
    ON public.trading_sales FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sales" 
    ON public.trading_sales FOR DELETE 
    USING (auth.uid() = user_id);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_trading_farmers_user_id ON public.trading_farmers(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_customers_user_id ON public.trading_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_purchases_user_id ON public.trading_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_purchases_created_at ON public.trading_purchases(created_at);
CREATE INDEX IF NOT EXISTS idx_trading_sales_user_id ON public.trading_sales(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_sales_created_at ON public.trading_sales(created_at);
