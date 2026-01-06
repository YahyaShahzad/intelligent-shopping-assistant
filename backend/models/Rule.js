const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        required: true,
        enum: ['student', 'category', 'bundle', 'quantity', 'seasonal', 'USER_ATTRIBUTE', 'CART_CONDITION', 'CATEGORY_BUNDLE', 'TIME_BASED', 'PRODUCT_BASED']
    },
    discount: {
        type: Number,
        default: 0
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        default: 'percentage'
    },
    condition: {
        expression: String,
        parameters: mongoose.Schema.Types.Mixed
    },
    action: {
        type: {
            type: String,
            enum: ['PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT', 'BUNDLE_DISCOUNT', 'FREE_SHIPPING', 'ADD_RECOMMENDATION']
        },
        value: mongoose.Schema.Types.Mixed,
        message: String
    },
    priority: {
        type: Number,
        default: 0
    },
    active: {
        type: Boolean,
        default: true
    },
    validFrom: Date,
    validUntil: Date,
    usageLimit: {
        total: Number,
        perUser: Number
    },
    usageCount: {
        type: Number,
        default: 0
    },
    metadata: {
        createdBy: String,
        description: String,
        tags: [String]
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

ruleSchema.index({ active: 1, priority: -1 });
ruleSchema.index({ type: 1 });
ruleSchema.index({ validFrom: 1, validUntil: 1 });

ruleSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

ruleSchema.methods.isValid = function() {
    if (!this.active) return false;
    
    const now = Date.now();
    if (this.validFrom && now < this.validFrom) return false;
    if (this.validUntil && now > this.validUntil) return false;
    
    if (this.usageLimit && this.usageLimit.total && this.usageCount >= this.usageLimit.total) {
        return false;
    }
    
    return true;
};

module.exports = mongoose.model('Rule', ruleSchema);
