/**
 * COMPOSITE PATTERN - Complex Discount Rules Builder
 * Builds hierarchical discount rule structures
 */

// Component Interface
class DiscountComponent {
    constructor(name) {
        this.name = name;
        this.id = this.generateId();
    }

    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    apply(cart, context) {
        throw new Error("apply() must be implemented by subclass");
    }

    calculate(cart, context) {
        throw new Error("calculate() must be implemented by subclass");
    }

    isApplicable(cart, context) {
        return true;
    }

    getDescription() {
        throw new Error("getDescription() must be implemented by subclass");
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.constructor.name
        };
    }
}

// Leaf - Simple Percentage Discount
class PercentageDiscount extends DiscountComponent {
    constructor(name, percentage, condition = null) {
        super(name);
        this.percentage = Math.min(Math.max(percentage, 0), 100);
        this.condition = condition;
    }

    apply(cart, context) {
        if (!this.isApplicable(cart, context)) {
            return { applied: false, amount: 0, message: "Condition not met" };
        }

        const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discountAmount = subtotal * (this.percentage / 100);

        return {
            applied: true,
            amount: discountAmount,
            percentage: this.percentage,
            message: `${this.percentage}% discount applied`,
            rule: this.name
        };
    }

    calculate(cart, context) {
        const result = this.apply(cart, context);
        return result.amount || 0;
    }

    isApplicable(cart, context) {
        if (!this.condition) return true;
        return this.condition.interpret(context);
    }

    getDescription() {
        return `${this.percentage}% off ${this.condition ? `when ${this.condition.toString()}` : ''}`;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            percentage: this.percentage,
            description: this.getDescription()
        };
    }
}

// Leaf - Fixed Amount Discount
class FixedAmountDiscount extends DiscountComponent {
    constructor(name, amount, condition = null) {
        super(name);
        this.amount = Math.max(amount, 0);
        this.condition = condition;
    }

    apply(cart, context) {
        if (!this.isApplicable(cart, context)) {
            return { applied: false, amount: 0, message: "Condition not met" };
        }

        const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discountAmount = Math.min(this.amount, subtotal); // Don't exceed cart total

        return {
            applied: true,
            amount: discountAmount,
            fixedAmount: this.amount,
            message: `$${this.amount} discount applied`,
            rule: this.name
        };
    }

    calculate(cart, context) {
        const result = this.apply(cart, context);
        return result.amount || 0;
    }

    isApplicable(cart, context) {
        if (!this.condition) return true;
        return this.condition.interpret(context);
    }

    getDescription() {
        return `$${this.amount} off ${this.condition ? `when ${this.condition.toString()}` : ''}`;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            amount: this.amount,
            description: this.getDescription()
        };
    }
}

// Leaf - Bundle Discount (Buy X Get Y)
class BundleDiscount extends DiscountComponent {
    constructor(name, buyQuantity, getQuantity, category = null) {
        super(name);
        this.buyQuantity = buyQuantity;
        this.getQuantity = getQuantity;
        this.category = category;
    }

    apply(cart, context) {
        let applicableItems = cart.items;
        
        if (this.category) {
            applicableItems = cart.items.filter(item => item.category === this.category);
        }

        const totalQuantity = applicableItems.reduce((sum, item) => sum + item.quantity, 0);
        const bundlesApplicable = Math.floor(totalQuantity / this.buyQuantity);

        if (bundlesApplicable === 0) {
            return { applied: false, amount: 0, message: "Bundle requirement not met" };
        }

        // Sort items by price ascending to discount cheapest items
        const sortedItems = [...applicableItems].sort((a, b) => a.price - b.price);
        let freeItems = bundlesApplicable * this.getQuantity;
        let discountAmount = 0;

        for (const item of sortedItems) {
            if (freeItems <= 0) break;
            const itemsToDiscount = Math.min(freeItems, item.quantity);
            discountAmount += item.price * itemsToDiscount;
            freeItems -= itemsToDiscount;
        }

        return {
            applied: true,
            amount: discountAmount,
            bundleCount: bundlesApplicable,
            message: `Buy ${this.buyQuantity} Get ${this.getQuantity} applied`,
            rule: this.name
        };
    }

    calculate(cart, context) {
        const result = this.apply(cart, context);
        return result.amount || 0;
    }

    getDescription() {
        const categoryText = this.category ? ` in ${this.category}` : '';
        return `Buy ${this.buyQuantity} Get ${this.getQuantity} Free${categoryText}`;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            buyQuantity: this.buyQuantity,
            getQuantity: this.getQuantity,
            category: this.category,
            description: this.getDescription()
        };
    }
}

// Leaf - Category-Specific Discount
class CategoryDiscount extends DiscountComponent {
    constructor(name, category, percentage, condition = null) {
        super(name);
        this.category = category;
        this.percentage = Math.min(Math.max(percentage, 0), 100);
        this.condition = condition;
    }

    apply(cart, context) {
        if (!this.isApplicable(cart, context)) {
            return { applied: false, amount: 0, message: "Condition not met" };
        }

        const categoryItems = cart.items.filter(item => item.category === this.category);
        const categoryTotal = categoryItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discountAmount = categoryTotal * (this.percentage / 100);

        if (discountAmount === 0) {
            return { applied: false, amount: 0, message: `No ${this.category} items in cart` };
        }

        return {
            applied: true,
            amount: discountAmount,
            percentage: this.percentage,
            category: this.category,
            message: `${this.percentage}% off ${this.category}`,
            rule: this.name
        };
    }

    calculate(cart, context) {
        const result = this.apply(cart, context);
        return result.amount || 0;
    }

    isApplicable(cart, context) {
        if (!this.condition) return true;
        return this.condition.interpret(context);
    }

    getDescription() {
        return `${this.percentage}% off ${this.category} items`;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            category: this.category,
            percentage: this.percentage,
            description: this.getDescription()
        };
    }
}

// Composite - Complex Discount combining multiple rules
class CompositeDiscount extends DiscountComponent {
    constructor(name, strategy = 'MAX') {
        super(name);
        this.children = [];
        this.strategy = strategy; // MAX, MIN, SUM, MULTIPLY
    }

    add(discountComponent) {
        this.children.push(discountComponent);
        return this;
    }

    remove(discountComponent) {
        const index = this.children.indexOf(discountComponent);
        if (index !== -1) {
            this.children.splice(index, 1);
        }
        return this;
    }

    getChild(index) {
        return this.children[index];
    }

    getChildren() {
        return [...this.children];
    }

    apply(cart, context) {
        const results = this.children
            .map(child => child.apply(cart, context))
            .filter(result => result.applied);

        if (results.length === 0) {
            return { applied: false, amount: 0, message: "No applicable discounts" };
        }

        const totalAmount = this.calculateByStrategy(results, cart);

        return {
            applied: true,
            amount: totalAmount,
            strategy: this.strategy,
            appliedRules: results.map(r => r.rule),
            message: this.getStrategyMessage(results),
            rule: this.name,
            breakdown: results
        };
    }

    calculateByStrategy(results, cart) {
        const amounts = results.map(r => r.amount);
        const cartTotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        switch (this.strategy) {
            case 'MAX':
                return Math.max(...amounts);
            
            case 'MIN':
                return Math.min(...amounts);
            
            case 'SUM':
                // Sum but don't exceed cart total
                return Math.min(amounts.reduce((sum, amt) => sum + amt, 0), cartTotal);
            
            case 'MULTIPLY':
                // Apply discounts sequentially (compounding)
                let remaining = cartTotal;
                for (const result of results) {
                    const discountPercent = (result.amount / cartTotal) * 100;
                    const discount = remaining * (discountPercent / 100);
                    remaining -= discount;
                }
                return cartTotal - remaining;
            
            case 'FIRST':
                return amounts[0];
            
            default:
                return Math.max(...amounts);
        }
    }

    calculate(cart, context) {
        const result = this.apply(cart, context);
        return result.amount || 0;
    }

    getStrategyMessage(results) {
        switch (this.strategy) {
            case 'MAX':
                return `Best discount: ${results.find(r => r.amount === Math.max(...results.map(x => x.amount)))?.rule}`;
            case 'SUM':
                return `Combined discounts: ${results.map(r => r.rule).join(' + ')}`;
            case 'MULTIPLY':
                return `Stacked discounts: ${results.length} rules applied`;
            default:
                return `${results.length} discount(s) applied`;
        }
    }

    getDescription() {
        const childDescriptions = this.children.map(child => child.getDescription()).join(', ');
        return `Composite (${this.strategy}): ${childDescriptions}`;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            strategy: this.strategy,
            children: this.children.map(child => child.toJSON()),
            description: this.getDescription()
        };
    }
}

// Discount Builder - Fluent interface for creating complex discounts
class DiscountBuilder {
    constructor() {
        this.root = null;
        this.current = null;
    }

    createComposite(name, strategy = 'MAX') {
        const composite = new CompositeDiscount(name, strategy);
        if (!this.root) {
            this.root = composite;
        }
        this.current = composite;
        return this;
    }

    addPercentage(name, percentage, condition = null) {
        const discount = new PercentageDiscount(name, percentage, condition);
        if (this.current instanceof CompositeDiscount) {
            this.current.add(discount);
        } else {
            this.root = discount;
        }
        return this;
    }

    addFixedAmount(name, amount, condition = null) {
        const discount = new FixedAmountDiscount(name, amount, condition);
        if (this.current instanceof CompositeDiscount) {
            this.current.add(discount);
        } else {
            this.root = discount;
        }
        return this;
    }

    addBundle(name, buyQuantity, getQuantity, category = null) {
        const discount = new BundleDiscount(name, buyQuantity, getQuantity, category);
        if (this.current instanceof CompositeDiscount) {
            this.current.add(discount);
        } else {
            this.root = discount;
        }
        return this;
    }

    addCategory(name, category, percentage, condition = null) {
        const discount = new CategoryDiscount(name, category, percentage, condition);
        if (this.current instanceof CompositeDiscount) {
            this.current.add(discount);
        } else {
            this.root = discount;
        }
        return this;
    }

    build() {
        return this.root;
    }
}

module.exports = {
    DiscountComponent,
    PercentageDiscount,
    FixedAmountDiscount,
    BundleDiscount,
    CategoryDiscount,
    CompositeDiscount,
    DiscountBuilder
};
