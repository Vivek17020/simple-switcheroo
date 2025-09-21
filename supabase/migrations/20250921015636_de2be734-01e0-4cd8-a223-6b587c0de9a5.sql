-- Remove subscription-related tables and functions
DROP TABLE IF EXISTS subscribers CASCADE;
DROP FUNCTION IF EXISTS get_user_subscription_status() CASCADE;
DROP FUNCTION IF EXISTS secure_subscription_update() CASCADE;

-- Remove Razorpay-related columns from monetization_analytics if they exist
-- (keeping the table structure for other analytics)

-- Clean up any other subscription-related database objects
-- Note: Keeping push_subscriptions table as it's for push notifications, not payment subscriptions