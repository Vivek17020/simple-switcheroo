-- Create subscribers table to track subscription information
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT,
  subscription_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own subscription info
CREATE POLICY "select_own_subscription" ON public.subscribers
FOR SELECT
USING (user_id = auth.uid() OR email = auth.email());

-- Create policy for edge functions to update subscription info
CREATE POLICY "update_own_subscription" ON public.subscribers
FOR UPDATE
USING (true);

-- Create policy for edge functions to insert subscription info
CREATE POLICY "insert_subscription" ON public.subscribers
FOR INSERT
WITH CHECK (true);

-- Create monetization_analytics table for tracking revenue and metrics
CREATE TABLE public.monetization_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- 'ad_impression', 'ad_click', 'affiliate_click', 'subscription_purchase', etc.
  revenue_amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  article_id UUID,
  user_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for monetization analytics
ALTER TABLE public.monetization_analytics ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage analytics
CREATE POLICY "admins_manage_analytics" ON public.monetization_analytics
FOR ALL
USING (get_current_user_role() = 'admin');

-- Create policy for inserting analytics events
CREATE POLICY "insert_analytics_events" ON public.monetization_analytics
FOR INSERT
WITH CHECK (true);

-- Create affiliate_products table
CREATE TABLE public.affiliate_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  image_url TEXT,
  affiliate_url TEXT NOT NULL,
  commission_rate DECIMAL(5,4), -- e.g., 0.0500 for 5%
  category_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for affiliate products
ALTER TABLE public.affiliate_products ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing affiliate products
CREATE POLICY "view_active_affiliate_products" ON public.affiliate_products
FOR SELECT
USING (is_active = true OR get_current_user_role() = 'admin');

-- Create policy for admins to manage affiliate products
CREATE POLICY "admins_manage_affiliate_products" ON public.affiliate_products
FOR ALL
USING (get_current_user_role() = 'admin');

-- Add monetization columns to existing articles table
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS premium_preview_length INTEGER DEFAULT 300,
ADD COLUMN IF NOT EXISTS ads_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS affiliate_products_enabled BOOLEAN DEFAULT true;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_affiliate_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for affiliate products updated_at
CREATE TRIGGER update_affiliate_products_updated_at
  BEFORE UPDATE ON public.affiliate_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_affiliate_products_updated_at();