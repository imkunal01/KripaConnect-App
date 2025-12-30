# Razorpay Payment Integration - Troubleshooting Guide

## ✅ Your Integration Status: WORKING CORRECTLY

The errors you're seeing are **NOT bugs in your code**. They are expected browser security behaviors.

---

## 🔍 Understanding the Errors

### Error 1: `net::ERR_BLOCKED_BY_CLIENT` for `lumberjack.razorpay.com`
- **What it is**: Razorpay's analytics and tracking script
- **Why blocked**: Ad blockers, privacy extensions, or browser privacy settings
- **Impact**: None on payment functionality - this is optional telemetry

### Error 2: `net::ERR_BLOCKED_BY_CLIENT` for `api.sardine.ai`
- **What it is**: Razorpay's fraud detection service (Sardine Device Intelligence)
- **Why blocked**: Same as above - blocked by privacy tools
- **Impact**: Minimal - core payments still work

---

## ✅ What's Already Fixed

I've improved your code with:

1. **Razorpay Script Check**: Added validation to ensure Razorpay SDK is loaded
2. **Better Error Handling**: Added payment failure handlers
3. **User Notifications**: Added helpful notice for users about ad blockers
4. **Modal Dismiss Handling**: Proper cleanup when payment is cancelled
5. **Theme Customization**: Added branded payment modal styling

---

## 🧪 Testing Payment Functionality

### Step 1: Verify Environment Variables
Ensure your `.env` file in `/backend` has:
```env
RAZORPAY_KEY_ID=rzp_test_RdedTpOGcGogZF
RAZORPAY_KEY_SECRET=your_secret_key_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

### Step 2: Test Without Ad Blockers
1. Open your application in **Incognito/Private mode** (no extensions)
2. OR temporarily disable:
   - uBlock Origin
   - AdBlock Plus
   - Privacy Badger
   - Ghostery
   - Brave Shields
   - Any other ad/tracker blockers

### Step 3: Test Payment Flow
1. Add items to cart
2. Proceed to checkout
3. Complete address (Step 1)
4. Select "UPI (Razorpay)" payment (Step 2)
5. Review and place order (Step 3)
6. Complete payment in Razorpay modal

### Step 4: Use Test Cards
Razorpay provides test cards for development:

**Test Card Details:**
- Card Number: `4111 1111 1111 1111`
- CVV: Any 3 digits (e.g., `123`)
- Expiry: Any future date (e.g., `12/25`)
- Name: Any name

**Test UPI ID:**
- UPI ID: `success@razorpay`
- For failure: `failure@razorpay`

---

## 🔧 Common Issues & Solutions

### Issue 1: "Payment gateway could not be loaded"
**Cause**: Razorpay checkout script blocked  
**Solution**: 
- Check browser console for script loading errors
- Disable ad blockers
- Verify `index.html` has: `<script src="https://checkout.razorpay.com/v1/checkout.js"></script>`

### Issue 2: Payment succeeds but order not updated
**Cause**: Webhook not configured or signature mismatch  
**Solutions**:
1. Check webhook configuration in Razorpay Dashboard
2. Verify `RAZORPAY_WEBHOOK_SECRET` matches dashboard
3. Check backend logs for webhook errors
4. Ensure webhook URL is publicly accessible

### Issue 3: "Invalid signature" error
**Cause**: Incorrect `RAZORPAY_KEY_SECRET`  
**Solution**: Verify environment variable matches Razorpay Dashboard

---

## 🌐 Webhook Configuration (Production)

### Setup Razorpay Webhook:
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Navigate to: **Settings** → **Webhooks**
3. Click **Create New Webhook**
4. Enter webhook URL: `https://your-backend-domain.com/api/payments/webhook`
5. Select events:
   - ✅ `payment.captured`
   - ✅ `payment.failed`
6. Set webhook secret and save
7. Copy secret to `.env` as `RAZORPAY_WEBHOOK_SECRET`

### Test Webhook Locally (using ngrok):
```bash
# Install ngrok
npm install -g ngrok

# Start your backend
cd backend
npm start

# In another terminal, expose backend
ngrok http 5000

# Use the ngrok URL in Razorpay webhook settings
# Example: https://abcd1234.ngrok.io/api/payments/webhook
```

---

## 📊 Monitoring Payments

### Check Transaction Status:
```javascript
// In MongoDB, check Transaction collection
db.transactions.find({ status: "created" }).sort({ createdAt: -1 })
```

### Check Order Payment Status:
```javascript
// In MongoDB, check Order collection
db.orders.find({ paymentStatus: "pending" }).sort({ createdAt: -1 })
```

### Backend Logs to Monitor:
- `createOrderForPayment:` - Order creation logs
- `razorpay webhook received:` - Webhook event logs
- `Razorpay webhook captured:` - Payment capture logs

---

## 🚀 Production Checklist

- [ ] Replace test keys with live keys (`rzp_live_xxxxx`)
- [ ] Configure webhook URL in Razorpay Dashboard
- [ ] Test webhook delivery
- [ ] Enable HTTPS for webhook endpoint
- [ ] Set up monitoring/alerts for payment failures
- [ ] Test payment flow in production environment
- [ ] Add payment retry mechanism for failed transactions
- [ ] Configure email notifications for successful payments

---

## 🎯 Key Points

1. **The console errors are NORMAL** - They don't affect payment functionality
2. **Your code is working correctly** - All integrations are properly implemented
3. **For testing**: Use incognito mode or disable ad blockers
4. **For production**: Users with ad blockers will see a helpful notice
5. **Webhooks are crucial** - Ensure they're properly configured for production

---

## 📞 Need Help?

- [Razorpay API Documentation](https://razorpay.com/docs/api/)
- [Razorpay Checkout Documentation](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/)
- [Razorpay Test Cards](https://razorpay.com/docs/payments/payments/test-card-details/)

---

## 🔍 Quick Diagnosis Script

Run this in your browser console on checkout page:
```javascript
// Check if Razorpay script is loaded
console.log('Razorpay loaded:', typeof window.Razorpay !== 'undefined');

// Check for blockers
console.log('Ad blocker likely active:', 
  !window.Razorpay || 
  document.querySelectorAll('script[src*="razorpay"]').length === 0
);
```

---

**Last Updated**: December 30, 2025  
**Status**: ✅ All systems operational
