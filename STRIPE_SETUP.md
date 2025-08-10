# Stripe Integration Setup Guide

## 1. Install Stripe Packages
```bash
npm install stripe @stripe/stripe-js
```

## 2. Environment Variables
Add these to your `.env.local` file:

 ```env
 # Stripe Configuration
 STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
 NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
 STRIPE_MONTHLY_PRICE_ID=price_your_monthly_plan_price_id
 STRIPE_ANNUAL_PRICE_ID=price_your_annual_plan_price_id
 STRIPE_MONTHLY_PRODUCT_ID=prod_your_monthly_plan_product_id
 STRIPE_ANNUAL_PRODUCT_ID=prod_your_annual_plan_product_id
 NEXT_PUBLIC_BASE_URL=http://localhost:3000
 ```

## 3. Stripe Dashboard Setup

 ### Create Products and Prices
 1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
 2. Navigate to **Products** → **Add Product**
 3. Create a product called "IMS Pro Monthly"
    - Product ID will be: `prod_xxxxxxxxxxxxx`
    - Copy this Product ID
 4. Add a recurring price of $49/month
    - Price ID will be: `price_xxxxxxxxxxxxx`
    - Copy this Price ID
 5. Create another product called "IMS Pro Annual"
    - Product ID will be: `prod_xxxxxxxxxxxxx`
    - Copy this Product ID
 6. Add a recurring price of $490/year
    - Price ID will be: `price_xxxxxxxxxxxxx`
    - Copy this Price ID

**Note**: For subscriptions, you primarily use Price IDs in the checkout session. Product IDs are useful for:
- Organizing your products in the Stripe dashboard
- Future features like product-specific metadata
- Webhook event handling

### Configure Webhooks (Optional)
1. Go to **Developers** → **Webhooks**
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

## 4. Test the Integration

1. Use Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

2. Test the flow:
   - Sign up → Pricing → Stripe Checkout
   - Complete payment → Redirect to dashboard
   - Manage subscription in account page

## 5. Production Deployment

1. Switch to live Stripe keys
2. Update webhook endpoints
3. Test with real payment methods
4. Monitor webhook events

## Current Implementation Status

✅ **Completed:**
- Stripe packages installed
- API routes created
- Pricing page integration
- 7-day free trial messaging
- Sign-up button functionality fixed

🔄 **Next Steps:**
- Add webhook handler for subscription events
- Store customer/subscription data in Firestore
- Implement subscription status checking
- Add payment failure handling
