const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    state: {
        type: String,
        enum: ['Browsing', 'Shopping', 'Checkout', 'Completed', 'Abandoned'],
        default: 'Browsing'
    },
    cart: {
        items: [{
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product'
            },
            name: String,
            price: Number,
            originalPrice: Number,
            quantity: Number,
            category: String,
            appliedDiscounts: [String]
        }],
        subtotal: Number,
        totalDiscount: Number,
        total: Number
    },
    history: [{
        action: String,
        details: mongoose.Schema.Types.Mixed,
        timestamp: Date
    }],
    appliedRules: [{
        ruleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Rule'
        },
        ruleName: String,
        discountAmount: Number,
        appliedAt: Date
    }],
    recommendations: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        reason: String,
        score: Number
    }],
    metadata: {
        ipAddress: String,
        userAgent: String,
        startTime: Date,
        lastActivity: Date,
        transitions: [{
            from: String,
            to: String,
            timestamp: Date
        }]
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400 // Auto-delete after 24 hours
    }
});

sessionSchema.index({ userId: 1 });
sessionSchema.index({ state: 1 });
sessionSchema.index({ 'metadata.lastActivity': 1 });
sessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

sessionSchema.pre('save', function(next) {
    if (!this.metadata) this.metadata = {};
    this.metadata.lastActivity = Date.now();
    next();
});

module.exports = mongoose.model('Session', sessionSchema);
