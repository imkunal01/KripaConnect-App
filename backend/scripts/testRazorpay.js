/**
 * Razorpay Configuration Test Script
 * 
 * Run this to verify your Razorpay setup:
 * node scripts/testRazorpay.js
 */

require('dotenv').config();
const Razorpay = require('razorpay');

console.log('\n🔍 Testing Razorpay Configuration...\n');

// Check environment variables
console.log('1. Checking environment variables:');
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

if (!keyId) {
  console.error('   ❌ RAZORPAY_KEY_ID is missing');
} else {
  console.log(`   ✅ RAZORPAY_KEY_ID: ${keyId.substring(0, 10)}...`);
}

if (!keySecret) {
  console.error('   ❌ RAZORPAY_KEY_SECRET is missing');
} else {
  console.log(`   ✅ RAZORPAY_KEY_SECRET: ${keySecret.substring(0, 5)}...`);
}

if (!webhookSecret) {
  console.warn('   ⚠️  RAZORPAY_WEBHOOK_SECRET is missing (optional for testing)');
} else {
  console.log(`   ✅ RAZORPAY_WEBHOOK_SECRET: ${webhookSecret.substring(0, 5)}...`);
}

// Test Razorpay instance creation
console.log('\n2. Testing Razorpay SDK initialization:');
try {
  const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
  console.log('   ✅ Razorpay instance created successfully');
} catch (error) {
  console.error('   ❌ Failed to create Razorpay instance:', error.message);
  process.exit(1);
}

// Test API connection (create a test order)
console.log('\n3. Testing Razorpay API connection:');
async function testOrder() {
  try {
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const order = await razorpay.orders.create({
      amount: 100, // 1 INR in paise
      currency: 'INR',
      receipt: `test_${Date.now()}`,
      notes: {
        test: true,
        purpose: 'Configuration validation'
      }
    });

    console.log('   ✅ Test order created successfully');
    console.log(`   Order ID: ${order.id}`);
    console.log(`   Amount: ₹${order.amount / 100}`);
    console.log(`   Status: ${order.status}`);
    
    console.log('\n✅ All tests passed! Razorpay is configured correctly.\n');
  } catch (error) {
    console.error('   ❌ API test failed:', error.message);
    
    if (error.statusCode === 401) {
      console.error('\n💡 This usually means your API credentials are incorrect.');
      console.error('   Please verify RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file.\n');
    }
    
    process.exit(1);
  }
}

if (keyId && keySecret) {
  testOrder();
} else {
  console.error('\n❌ Cannot run API test: Missing required credentials\n');
  process.exit(1);
}
