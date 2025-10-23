# Razorpay Integration

This project uses Razorpay for subscription payments with support for UPI (GPay, PhonePe, Paytm) and card payments.

## Setup Instructions

1. **Create Razorpay Account**
   - Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/)
   - Complete business verification

2. **Get API Keys**
   - Go to Account & Settings > API Keys
   - Generate Test/Live keys
   - Copy Key ID and Key Secret

3. **Configure Environment Variables**
   ```bash
   RAZORPAY_KEY_ID=rzp_test_your_key_id
   RAZORPAY_KEY_SECRET=rzp_test_your_key_secret
   ```

4. **Create Subscription Plans**
   - Go to Subscriptions > Plans in Razorpay Dashboard
   - Create plans with IDs: `plan_premium_monthly`, `plan_pro_yearly`
   - Update the plan IDs in `src/components/monetization/subscription-plans.tsx`

5. **Setup Webhooks**
   - Go to Account & Settings > Webhooks
   - Add webhook URL: `https://your-domain.com/api/razorpay-webhook`
   - Enable events: `subscription.activated`, `subscription.charged`, `subscription.cancelled`

## Payment Methods Supported

- UPI Apps (GPay, PhonePe, Paytm)
- Credit/Debit Cards
- Net Banking
- Wallets

## Test vs Production

- Use test keys for development
- Switch to live keys for production
- Update the key in subscription component for production use

## Important Notes

- All subscription status is stored in Supabase `subscribers` table
- Webhooks handle automatic status updates
- Test mode transactions are free but require test credentials