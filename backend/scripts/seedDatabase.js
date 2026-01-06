const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping-assistant');
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    console.log('✅ Existing data cleared\n');

    // Create Admin User
    console.log('👑 Creating admin user...');
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@gmail.com',
      password: 'admin123',
      isStudent: false,
      isAdmin: true,
      preferences: {
        categories: [],
        priceRange: { min: 0, max: 100000 },
        notifications: true
      },
      browsingHistory: [],
      purchaseHistory: []
    });
    console.log('✅ Admin created: admin@gmail.com / admin123\n');

    // Create Test Users
    console.log('👥 Creating test users...');
    const users = await User.create([
      {
        name: 'John Student',
        email: 'student@test.com',
        password: 'test123',
        isStudent: true,
        isAdmin: false,
        preferences: {
          categories: ['Electronics', 'Books'],
          priceRange: { min: 0, max: 5000 },
          notifications: true
        }
      },
      {
        name: 'Jane Doe',
        email: 'jane@test.com',
        password: 'test123',
        isStudent: false,
        isAdmin: false,
        preferences: {
          categories: ['Clothing', 'Home & Garden'],
          priceRange: { min: 0, max: 10000 },
          notifications: true
        }
      },
      {
        name: 'Bob Smith',
        email: 'bob@test.com',
        password: 'test123',
        isStudent: false,
        isAdmin: false,
        preferences: {
          categories: ['Sports', 'Electronics'],
          priceRange: { min: 0, max: 8000 },
          notifications: false
        }
      }
    ]);
    console.log(`✅ Created ${users.length} test users\n`);

    // Create Products
    console.log('📦 Creating products...');
    const products = await Product.create([
      // Electronics (10 products)
      {
        name: 'Smartphone Pro X',
        description: 'Latest flagship smartphone with advanced AI camera',
        price: 999.99,
        category: 'Electronics',
        tags: ['phone', 'mobile', 'smartphone'],
        stock: 50,
        image: 'https://via.placeholder.com/300x300/6366f1/ffffff?text=Phone',
        ratings: 4.8
      },
      {
        name: 'Wireless Earbuds',
        description: 'Premium noise-cancelling wireless earbuds',
        price: 199.99,
        category: 'Electronics',
        tags: ['audio', 'wireless', 'earbuds'],
        stock: 100,
        image: 'https://via.placeholder.com/300x300/8b5cf6/ffffff?text=Earbuds',
        ratings: 4.5
      },
      {
        name: 'Laptop Ultra 15',
        description: 'High-performance laptop for professionals',
        price: 1499.99,
        category: 'Electronics',
        tags: ['laptop', 'computer', 'work'],
        stock: 30,
        image: 'https://via.placeholder.com/300x300/ec4899/ffffff?text=Laptop',
        ratings: 4.7
      },
      {
        name: 'Smart Watch',
        description: 'Fitness tracker with health monitoring',
        price: 299.99,
        category: 'Electronics',
        tags: ['watch', 'fitness', 'health'],
        stock: 75,
        image: 'https://via.placeholder.com/300x300/f59e0b/ffffff?text=Watch',
        ratings: 4.6
      },
      {
        name: '4K Monitor 27"',
        description: 'Ultra HD display with HDR support',
        price: 449.99,
        category: 'Electronics',
        tags: ['monitor', 'display', 'screen'],
        stock: 40,
        image: 'https://via.placeholder.com/300x300/10b981/ffffff?text=Monitor',
        ratings: 4.4
      },

      // Clothing (8 products)
      {
        name: 'Cotton T-Shirt',
        description: 'Comfortable 100% cotton t-shirt',
        price: 29.99,
        category: 'Clothing',
        tags: ['tshirt', 'casual', 'cotton'],
        stock: 200,
        image: 'https://via.placeholder.com/300x300/3b82f6/ffffff?text=T-Shirt',
        ratings: 4.3
      },
      {
        name: 'Denim Jeans',
        description: 'Classic blue jeans with stretch fabric',
        price: 79.99,
        category: 'Clothing',
        tags: ['jeans', 'denim', 'pants'],
        stock: 150,
        image: 'https://via.placeholder.com/300x300/6366f1/ffffff?text=Jeans',
        ratings: 4.5
      },
      {
        name: 'Winter Jacket',
        description: 'Warm insulated jacket for cold weather',
        price: 149.99,
        category: 'Clothing',
        tags: ['jacket', 'winter', 'outerwear'],
        stock: 60,
        image: 'https://via.placeholder.com/300x300/8b5cf6/ffffff?text=Jacket',
        ratings: 4.7
      },
      {
        name: 'Running Shoes',
        description: 'Lightweight athletic shoes for running',
        price: 89.99,
        category: 'Clothing',
        tags: ['shoes', 'running', 'athletic'],
        stock: 120,
        image: 'https://via.placeholder.com/300x300/ec4899/ffffff?text=Shoes',
        ratings: 4.6
      },

      // Home & Garden (5 products)
      {
        name: 'Coffee Maker',
        description: 'Programmable coffee maker with thermal carafe',
        price: 89.99,
        category: 'Home & Garden',
        tags: ['coffee', 'kitchen', 'appliance'],
        stock: 80,
        image: 'https://via.placeholder.com/300x300/f59e0b/ffffff?text=Coffee',
        ratings: 4.4
      },
      {
        name: 'Garden Tool Set',
        description: 'Complete 10-piece gardening tool set',
        price: 59.99,
        category: 'Home & Garden',
        tags: ['garden', 'tools', 'outdoor'],
        stock: 50,
        image: 'https://via.placeholder.com/300x300/10b981/ffffff?text=Tools',
        ratings: 4.2
      },
      {
        name: 'Vacuum Cleaner',
        description: 'Powerful bagless vacuum cleaner',
        price: 199.99,
        category: 'Home & Garden',
        tags: ['vacuum', 'cleaning', 'appliance'],
        stock: 45,
        image: 'https://via.placeholder.com/300x300/3b82f6/ffffff?text=Vacuum',
        ratings: 4.5
      },

      // Books (4 products)
      {
        name: 'JavaScript: The Complete Guide',
        description: 'Comprehensive JavaScript programming book',
        price: 49.99,
        category: 'Books',
        tags: ['book', 'programming', 'javascript'],
        stock: 100,
        image: 'https://via.placeholder.com/300x300/6366f1/ffffff?text=JS+Book',
        ratings: 4.8
      },
      {
        name: 'Design Patterns',
        description: 'Classic book on software design patterns',
        price: 54.99,
        category: 'Books',
        tags: ['book', 'software', 'design'],
        stock: 75,
        image: 'https://via.placeholder.com/300x300/8b5cf6/ffffff?text=Design',
        ratings: 4.9
      },

      // Sports (3 products)
      {
        name: 'Yoga Mat',
        description: 'Non-slip exercise mat for yoga and fitness',
        price: 29.99,
        category: 'Sports',
        tags: ['yoga', 'fitness', 'exercise'],
        stock: 150,
        image: 'https://via.placeholder.com/300x300/ec4899/ffffff?text=Yoga',
        ratings: 4.3
      },
      {
        name: 'Dumbbells Set',
        description: 'Adjustable dumbbells for home workout',
        price: 149.99,
        category: 'Sports',
        tags: ['weights', 'fitness', 'strength'],
        stock: 60,
        image: 'https://via.placeholder.com/300x300/f59e0b/ffffff?text=Weights',
        ratings: 4.6
      },

      // Toys (2 products)
      {
        name: 'Building Blocks Set',
        description: 'Creative building blocks for kids',
        price: 39.99,
        category: 'Toys',
        tags: ['toys', 'kids', 'building'],
        stock: 100,
        image: 'https://via.placeholder.com/300x300/10b981/ffffff?text=Blocks',
        ratings: 4.7
      },
      {
        name: 'Remote Control Car',
        description: 'Fast RC car with rechargeable battery',
        price: 79.99,
        category: 'Toys',
        tags: ['toys', 'rc', 'car'],
        stock: 70,
        image: 'https://via.placeholder.com/300x300/3b82f6/ffffff?text=RC+Car',
        ratings: 4.5
      }
    ]);
    console.log(`✅ Created ${products.length} products\n`);

    // Create Sample Orders
    console.log('📝 Creating sample orders...');
    const orders = await Order.create([
      {
        user: users[0]._id,
        items: [
          { product: products[0]._id, quantity: 1, price: products[0].price },
          { product: products[5]._id, quantity: 2, price: products[5].price }
        ],
        total: products[0].price + (products[5].price * 2),
        status: 'delivered',
        shippingAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        paymentMethod: 'Credit Card'
      },
      {
        user: users[1]._id,
        items: [
          { product: products[2]._id, quantity: 1, price: products[2].price }
        ],
        total: products[2].price,
        status: 'shipped',
        shippingAddress: {
          street: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001',
          country: 'USA'
        },
        paymentMethod: 'PayPal'
      },
      {
        user: users[2]._id,
        items: [
          { product: products[7]._id, quantity: 1, price: products[7].price },
          { product: products[14]._id, quantity: 1, price: products[14].price }
        ],
        total: products[7].price + products[14].price,
        status: 'processing',
        shippingAddress: {
          street: '789 Pine Rd',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60601',
          country: 'USA'
        },
        paymentMethod: 'Credit Card'
      },
      {
        user: users[0]._id,
        items: [
          { product: products[11]._id, quantity: 1, price: products[11].price }
        ],
        total: products[11].price,
        status: 'pending',
        shippingAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        paymentMethod: 'Credit Card'
      }
    ]);
    console.log(`✅ Created ${orders.length} sample orders\n`);

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('✨ DATABASE SEEDED SUCCESSFULLY! ✨');
    console.log('═══════════════════════════════════════');
    console.log('\n📊 Summary:');
    console.log(`   • Users: ${users.length + 1} (including admin)`);
    console.log(`   • Products: ${products.length}`);
    console.log(`   • Orders: ${orders.length}`);
    console.log('\n🔐 Admin Credentials:');
    console.log('   Email: admin@gmail.com');
    console.log('   Password: admin123');
    console.log('\n👤 Test User Credentials:');
    console.log('   Email: student@test.com / jane@test.com / bob@test.com');
    console.log('   Password: test123 (for all)');
    console.log('\n═══════════════════════════════════════\n');

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
