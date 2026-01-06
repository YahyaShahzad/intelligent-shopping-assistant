const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping_assistant';

async function createSampleOrders() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get existing users and products
    const users = await User.find({ isAdmin: false });
    const products = await Product.find().limit(10);

    if (users.length === 0) {
      console.log('No users found. Please create users first.');
      return;
    }

    if (products.length === 0) {
      console.log('No products found. Please seed products first.');
      return;
    }

    console.log(`Found ${users.length} users and ${products.length} products`);

    // Clear existing orders
    await Order.deleteMany({});
    console.log('Cleared existing orders');

    // Sample shipping addresses
    const addresses = [
      {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'USA'
      },
      {
        street: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90001',
        country: 'USA'
      },
      {
        street: '789 Pine Rd',
        city: 'Chicago',
        state: 'IL',
        zip: '60601',
        country: 'USA'
      }
    ];

    const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    const orders = [];

    // Create 15 sample orders
    for (let i = 0; i < 15; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items per order
      const items = [];
      let subtotal = 0;
      let discount = 0;

      // Add random products to order
      for (let j = 0; j < numItems; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const price = product.price;
        const totalPrice = price * quantity;
        
        items.push({
          product: product._id,
          productId: product._id,
          name: product.name,
          price,
          quantity,
          category: product.category,
          totalPrice,
          discountAmount: 0
        });

        subtotal += totalPrice;
      }

      // Apply random discount (0-20%)
      if (user.isStudent) {
        discount = subtotal * 0.20; // 20% student discount
      } else if (Math.random() > 0.7) {
        discount = subtotal * 0.10; // 10% random discount
      }

      const total = subtotal - discount;

      // Create order with random date in the past 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - daysAgo);

      // Generate unique order ID
      const orderId = `ORD-${Date.now()}-${i}`;

      const order = new Order({
        orderId,
        user: user._id,
        userId: user._id.toString(),
        sessionId: `SESSION-${Date.now()}-${i}`,
        items,
        subtotal,
        discount,
        total,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        billingInfo: {
          name: user.name,
          email: user.email,
          phone: `555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
          address: addresses[Math.floor(Math.random() * addresses.length)].street,
          city: addresses[Math.floor(Math.random() * addresses.length)].city,
          postalCode: addresses[Math.floor(Math.random() * addresses.length)].zip
        },
        paymentInfo: {
          method: Math.random() > 0.5 ? 'Credit Card' : 'PayPal',
          lastFourDigits: Math.floor(Math.random() * 9000) + 1000
        },
        createdAt: orderDate,
        updatedAt: orderDate
      });

      orders.push(order);
    }

    await Order.insertMany(orders);
    console.log(`✅ Created ${orders.length} sample orders`);

    // Show order statistics
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$total' }
        }
      }
    ]);

    console.log('\nOrder Statistics:');
    stats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count} orders, $${stat.totalRevenue.toFixed(2)}`);
    });

    const totalRevenue = stats.reduce((sum, stat) => sum + stat.totalRevenue, 0);
    console.log(`\nTotal Revenue: $${totalRevenue.toFixed(2)}`);

  } catch (error) {
    console.error('Error creating orders:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

createSampleOrders();
