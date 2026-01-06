const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping-assistant', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      
      // Update to make sure isAdmin is true
      existingAdmin.isAdmin = true;
      await existingAdmin.save();
      
      console.log('Admin user updated successfully');
      console.log('Email: admin@example.com');
      console.log('Use existing password or reset it');
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      
      const adminUser = new User({
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        isStudent: false,
        isAdmin: true
      });

      await adminUser.save();
      
      console.log('Admin user created successfully!');
      console.log('Email: admin@example.com');
      console.log('Password: Admin123!');
      console.log('\nPlease change the password after first login.');
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('Error creating admin user:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

createAdminUser();
