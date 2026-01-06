const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // FIX: Removed deprecated options (useNewUrlParser, useUnifiedTopology)
        // These are enabled by default in Mongoose 6.0+
        const options = {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        await mongoose.connect(process.env.MONGODB_URI, options);

        console.log('MongoDB Connected Successfully');

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });

    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
