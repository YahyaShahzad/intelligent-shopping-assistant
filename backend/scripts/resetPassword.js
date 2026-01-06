const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping_assistant';

async function resetPassword() {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Get email and new password from command line
        const email = process.argv[2];
        const newPassword = process.argv[3];

        if (!email || !newPassword) {
            console.log('\n❌ Usage: node resetPassword.js <email> <newPassword>');
            console.log('\nExample: node resetPassword.js maryam@gmail.com newpass123\n');
            process.exit(1);
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            console.log(`\n❌ User not found: ${email}\n`);
            process.exit(1);
        }

        // Update password (will be hashed by pre-save hook)
        user.password = newPassword;
        await user.save();

        console.log(`\n✅ Password reset successful!`);
        console.log(`   Email: ${email}`);
        console.log(`   New Password: ${newPassword}\n`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

resetPassword();
