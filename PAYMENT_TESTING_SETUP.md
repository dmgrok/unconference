# Payment Flow Testing Setup Guide
## Environment Configuration & Testing Instructions

**Date:** September 17, 2025  
**Goal:** Set up proper testing environment for payment flow validation

---

## 🔧 **ENVIRONMENT SETUP**

### **Required Environment Variables**

Create or update your `.env` file in the project root:

```bash
# === STRIPE CONFIGURATION (REQUIRED FOR PAYMENT TESTING) ===
STRIPE_SECRET_KEY=sk_test_your_stripe_test_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_test_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Optional: Custom Stripe Price IDs (uses defaults if not set)
STRIPE_COMMUNITY_PRICE_ID=price_community_monthly
STRIPE_ORGANIZER_PRICE_ID=price_organizer_monthly  
STRIPE_UNLIMITED_PRICE_ID=price_unlimited_monthly

# === DATABASE ===
DATABASE_URL="sqlite:./prisma/dev.db"

# === AUTHENTICATION ===
NUXT_SECRET_KEY=your_session_secret_key_at_least_32_chars_long

# GitHub OAuth (for user authentication)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# === APPLICATION SETTINGS ===
APP_ENV=development
NUXT_MAX_VOTES_PER_TOPIC=12
NUXT_TOP_TOPICS_COUNT=10
```

### **Getting Stripe Test Keys**

1. **Create Stripe Account** (if not already done):
   - Go to https://stripe.com
   - Sign up for free account
   - No credit card required for testing

2. **Get Test API Keys**:
   - Login to Stripe Dashboard
   - Make sure you're in "Test mode" (toggle in top left)
   - Go to Developers → API keys
   - Copy "Publishable key" (starts with `pk_test_`)
   - Copy "Secret key" (starts with `sk_test_`)

3. **Set up Webhook** (for payment completion):
   - Go to Developers → Webhooks
   - Click "Add endpoint"
   - URL: `http://localhost:3000/api/stripe/webhook`
   - Events: Select `checkout.session.completed`
   - Copy the webhook signing secret (starts with `whsec_`)

---

## 🚀 **TESTING PREPARATION**

### **Step 1: Install Dependencies**
```bash
npm install
```

### **Step 2: Setup Database**
```bash
npm run db:setup
```

### **Step 3: Start Development Server**
```bash
npm run dev
```

The server should start on http://localhost:3000

### **Step 4: Verify Stripe Integration**
Check the server logs for:
- ✅ "Stripe initialized successfully"  
- ❌ "STRIPE_SECRET_KEY is required" (if keys missing)

---

## 🧪 **TESTING CHECKLIST**

### **Pre-Testing Verification**
- [ ] `.env` file has all required Stripe keys
- [ ] Development server running without errors
- [ ] Database initialized and accessible
- [ ] Stripe webhook endpoint configured (optional for basic testing)

### **Test Cards for Stripe Testing**
Use these test card numbers in Stripe checkout:

**Successful Payments:**
- `4242424242424242` - Visa (always succeeds)
- `4000056655665556` - Visa (debit, always succeeds)
- `5555555555554444` - Mastercard (always succeeds)

**Failed Payments:**
- `4000000000000002` - Visa (always declined)
- `4000000000009995` - Visa (always fails after authentication)

**Use any future expiry date and any 3-digit CVC for testing**

---

## 🔍 **MANUAL TESTING PROCEDURE**

### **Test 1: Free Tier (No Payment Required)**
1. Navigate to http://localhost:3000/events/create
2. Fill in event details
3. Select "Free" tier
4. Submit form
5. **Expected**: Event created instantly, no payment screen

### **Test 2: Professional Tier ($29 Payment)**
1. Create new event
2. Select "Professional" tier  
3. Click create event
4. **Expected**: Redirect to Stripe checkout showing $29.00
5. Use test card `4242424242424242`
6. Complete payment
7. **Expected**: Redirect back to event with success message
8. Verify event shows 100 participant limit

### **Test 3: Enterprise Tier ($99 Payment)**
1. Create new event
2. Select "Enterprise" tier
3. Complete payment flow with test card
4. **Expected**: Event shows unlimited participants

### **Test 4: Payment Failure Handling**
1. Attempt Professional tier payment
2. Use declined test card `4000000000000002`
3. **Expected**: Clear error message, no event created

---

## 🐛 **COMMON ISSUES & SOLUTIONS**

### **Issue: "STRIPE_SECRET_KEY is required"**
**Solution:** Add valid Stripe test secret key to `.env` file

### **Issue: Payment redirects to blank page**
**Solution:** Check that webhook is configured correctly or disable webhook validation for testing

### **Issue: Database errors during payment**
**Solution:** Ensure database is properly initialized with `npm run db:setup`

### **Issue: Authentication required errors**
**Solution:** Make sure OAuth providers are configured or implement guest checkout

---

## 📊 **EXPECTED TEST RESULTS**

### **Working Payment Flow Should Show:**
1. **Free Tier**: Instant event creation, 50 participant limit
2. **Professional Tier**: Stripe checkout → $29 payment → event with 100 limit  
3. **Enterprise Tier**: Stripe checkout → $99 payment → unlimited participants
4. **Error Handling**: Clear messages for failed payments

### **Database Verification:**
After successful payments, check that event records have:
- Correct `tier` value ('free', 'professional', 'enterprise')
- Proper `participantLimit` (50, 100, or -1 for unlimited)
- Payment status updated appropriately

---

## ✅ **TESTING COMPLETION CRITERIA**

- [ ] All three tier types (Free/Professional/Enterprise) work correctly
- [ ] Payment amounts match pricing model ($29/$99)  
- [ ] Participant limits enforce properly
- [ ] Error handling works for declined cards
- [ ] Mobile payment flow functional (test on actual devices)
- [ ] Database updates correctly after payments
- [ ] No console errors during payment flow

---

## 🚨 **CRITICAL ISSUES TO WATCH FOR**

1. **Pricing Mismatches**: Ensure Stripe checkout shows exactly $29/$99
2. **Participant Limit Bugs**: Verify limits are enforced correctly  
3. **Payment Loop Issues**: Users get stuck in payment flow
4. **Database Inconsistencies**: Payment succeeds but database not updated
5. **Mobile Payment Failures**: Issues specific to mobile browsers

---

**Once environment is set up, run the test payment flow script:**
```bash
./test-payment-flow.sh
```

**Or execute the full test checklist manually using the procedures above.**
