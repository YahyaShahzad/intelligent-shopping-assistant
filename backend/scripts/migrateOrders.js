const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' });

const migrateOrders = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping_assistant';
    console.log('🔄 Migrating Orders to add User References\n');
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const Order = require('../models/Order');
    const User = require('../models/User');

    // Find orders without user reference
    const ordersWithoutUser = await Order.find({ 
      $or: [
        { user: { $exists: false } },
        { user: null }
      ]
    });

    console.log(`Found ${ordersWithoutUser.length} orders without user reference\n`);

    if (ordersWithoutUser.length === 0) {
      console.log('✅ All orders already have user references!');
      await mongoose.connection.close();
      return;
    }

    console.log('Migrating orders...');
    let migrated = 0;
    let failed = 0;

    for (const order of ordersWithoutUser) {
      try {
        // Try to find user by userId
        let user = null;
        
        if (order.userId) {
          // Try as ObjectId first
          if (mongoose.Types.ObjectId.isValid(order.userId)) {
            user = await User.findById(order.userId);
          }
          
          // If not found, try as string search (older format)
          if (!user) {
            user = await User.findOne({ _id: order.userId });
          }
        }

        if (user) {
          order.user = user._id;
          order.userId = user._id.toString();
          
          // Update items to have product references
          order.items = order.items.map(item => ({
            ...item.toObject(),
            product: item.productId || item.product,
            productId: item.productId || item.product
          }));
          
          await order.save();
          console.log(`  ✅ Migrated order ${order.orderId} (user: ${user.name})`);
          migrated++;
        } else {
          console.log(`  ⚠️  Could not find user for order ${order.orderId}`);
          failed++;
        }
      } catch (error) {
        console.log(`  ❌ Failed to migrate order ${order.orderId}: ${error.message}`);
        failed++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('Migration Summary:');
    console.log('='.repeat(50));
    console.log(`✅ Successfully migrated: ${migrated}`);
    console.log(`❌ Failed to migrate:     ${failed}`);
    console.log(`📊 Total processed:       ${ordersWithoutUser.length}`);
    console.log('='.repeat(50));

    if (migrated > 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('   Run: node verifyAdminIntegration.js to verify');
    }

    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
};

migrateOrders();
