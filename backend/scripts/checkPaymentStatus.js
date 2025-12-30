/**
 * Check Payment Status Utility
 * 
 * Usage: node scripts/checkPaymentStatus.js <order_id_or_payment_id>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../src/models/Order');
const Transaction = require('../src/models/Transaction');

const connectDB = require('../src/config/db');

const identifier = process.argv[2];

if (!identifier) {
  console.error('\n❌ Please provide an order ID or payment ID');
  console.log('\nUsage: node scripts/checkPaymentStatus.js <order_id>\n');
  process.exit(1);
}

async function checkStatus() {
  try {
    await connectDB();
    
    console.log(`\n🔍 Searching for: ${identifier}\n`);

    // Try to find as Order ID
    let order = null;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      order = await Order.findById(identifier).populate('user', 'name email');
    }

    // Try to find by Razorpay order ID
    if (!order) {
      order = await Order.findOne({ 'razorpay.order_id': identifier }).populate('user', 'name email');
    }

    // Try to find transaction
    const transaction = await Transaction.findOne({
      $or: [
        { razorpay_order_id: identifier },
        { razorpay_payment_id: identifier }
      ]
    }).populate('order');

    if (!order && !transaction) {
      console.error('❌ No order or transaction found with that identifier\n');
      process.exit(1);
    }

    // Display Order Info
    if (order) {
      console.log('📦 ORDER DETAILS:');
      console.log('─'.repeat(50));
      console.log(`   Order ID: ${order._id}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Payment Status: ${order.paymentStatus}`);
      console.log(`   Payment Method: ${order.paymentMethod || 'N/A'}`);
      console.log(`   Total Amount: ₹${order.totalAmount}`);
      console.log(`   Customer: ${order.user?.name} (${order.user?.email})`);
      console.log(`   Created: ${order.createdAt}`);
      
      if (order.razorpay?.order_id) {
        console.log(`\n   Razorpay Order ID: ${order.razorpay.order_id}`);
        console.log(`   Razorpay Payment ID: ${order.razorpay.payment_id || 'N/A'}`);
        console.log(`   Razorpay Amount: ₹${order.razorpay.amount ? order.razorpay.amount / 100 : 'N/A'}`);
      }
      console.log('─'.repeat(50));
    }

    // Display Transaction Info
    if (transaction) {
      console.log('\n💳 TRANSACTION DETAILS:');
      console.log('─'.repeat(50));
      console.log(`   Transaction ID: ${transaction._id}`);
      console.log(`   Status: ${transaction.status}`);
      console.log(`   Amount: ₹${transaction.amount / 100}`);
      console.log(`   Currency: ${transaction.currency}`);
      console.log(`   Razorpay Order ID: ${transaction.razorpay_order_id || 'N/A'}`);
      console.log(`   Razorpay Payment ID: ${transaction.razorpay_payment_id || 'N/A'}`);
      console.log(`   Created: ${transaction.createdAt}`);
      console.log('─'.repeat(50));
    }

    // Status Summary
    console.log('\n📊 STATUS SUMMARY:');
    console.log('─'.repeat(50));
    
    if (order?.paymentStatus === 'paid') {
      console.log('   ✅ Payment Successful');
    } else if (order?.paymentStatus === 'failed') {
      console.log('   ❌ Payment Failed');
    } else if (order?.paymentStatus === 'pending') {
      console.log('   ⏳ Payment Pending');
    } else {
      console.log('   ⚠️  Unknown Payment Status');
    }
    
    console.log('─'.repeat(50));
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

checkStatus();
