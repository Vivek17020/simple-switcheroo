-- Add Razorpay columns to subscribers table
ALTER TABLE public.subscribers 
ADD COLUMN IF NOT EXISTS razorpay_customer_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_subscription_id TEXT;

-- Remove Stripe column
ALTER TABLE public.subscribers 
DROP COLUMN IF EXISTS stripe_customer_id;