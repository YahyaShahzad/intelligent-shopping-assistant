/**
 * VISITOR PATTERN - Rule Application to Cart Items
 * Applies rules to shopping cart items and calculates discounts
 */

// Visitable Element - Cart Item
class CartItem {
    constructor(productId, name, price, quantity, category, tags = []) {
        this.productId = productId;
        this.name = name;
        this.price = price;
        this.quantity = quantity;
        this.category = category;
        this.tags = tags;
        this.originalPrice = price;
        this.appliedDiscounts = [];
        this.metadata = {};
    }

    accept(visitor) {
        return visitor.visitCartItem(this);
    }

    addDiscount(discount) {
        this.appliedDiscounts.push(discount);
    }

    clearDiscounts() {
        this.appliedDiscounts = [];
        this.price = this.originalPrice;
    }

    getTotalPrice() {
        return this.price * this.quantity;
    }

    getDiscountAmount() {
        return (this.originalPrice - this.price) * this.quantity;
    }

    clone() {
        const cloned = new CartItem(
            this.productId,
            this.name,
            this.originalPrice,
            this.quantity,
            this.category,
            [...this.tags]
        );
        cloned.price = this.price;
        cloned.appliedDiscounts = [...this.appliedDiscounts];
        cloned.metadata = { ...this.metadata };
        return cloned;
    }

    toJSON() {
        return {
            productId: this.productId,
            name: this.name,
            originalPrice: this.originalPrice,
            price: this.price,
            quantity: this.quantity,
            category: this.category,
            tags: this.tags,
            totalPrice: this.getTotalPrice(),
            discountAmount: this.getDiscountAmount(),
            appliedDiscounts: this.appliedDiscounts
        };
    }
}

// Visitable Element - Shopping Cart
class ShoppingCart {
    constructor(userId, sessionId) {
        this.userId = userId;
        this.sessionId = sessionId;
        this.items = [];
        this.metadata = {
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }

    accept(visitor) {
        return visitor.visitShoppingCart(this);
    }

    addItem(item) {
        const existingItem = this.items.find(i => i.productId === item.productId);
        if (existingItem) {
            existingItem.quantity += item.quantity;
        } else {
            this.items.push(item);
        }
        this.metadata.updatedAt = new Date();
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.productId !== productId);
        this.metadata.updatedAt = new Date();
    }

    updateQuantity(productId, quantity) {
        const item = this.items.find(i => i.productId === productId);
        if (item) {
            item.quantity = Math.max(0, quantity);
            if (item.quantity === 0) {
                this.removeItem(productId);
            }
            this.metadata.updatedAt = new Date();
        }
    }

    clear() {
        this.items = [];
        this.metadata.updatedAt = new Date();
    }

    getSubtotal() {
        return this.items.reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0);
    }

    getTotal() {
        return this.items.reduce((sum, item) => sum + item.getTotalPrice(), 0);
    }

    getTotalDiscount() {
        return this.getSubtotal() - this.getTotal();
    }

    getItemCount() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    toJSON() {
        return {
            userId: this.userId,
            sessionId: this.sessionId,
            items: this.items.map(item => item.toJSON()),
            subtotal: this.getSubtotal(),
            total: this.getTotal(),
            totalDiscount: this.getTotalDiscount(),
            itemCount: this.getItemCount(),
            metadata: this.metadata
        };
    }
}

// Abstract Visitor
class CartVisitor {
    visitCartItem(item) {
        throw new Error("visitCartItem() must be implemented");
    }

    visitShoppingCart(cart) {
        throw new Error("visitShoppingCart() must be implemented");
    }
}

// Concrete Visitor - Discount Applicator
class DiscountVisitor extends CartVisitor {
    constructor(discountRules, context) {
        super();
        this.discountRules = Array.isArray(discountRules) ? discountRules : [discountRules];
        this.context = context;
        this.appliedDiscounts = [];
        this.totalDiscount = 0;
    }

    visitShoppingCart(cart) {
        // Apply each discount rule to the cart
        for (const rule of this.discountRules) {
            const result = rule.apply(cart, this.context);
            
            if (result.applied) {
                this.appliedDiscounts.push({
                    rule: rule.name,
                    amount: result.amount,
                    details: result
                });
                this.totalDiscount += result.amount;
            }
        }

        // Update cart items with proportional discounts
        if (this.totalDiscount > 0) {
            this.distributeDiscount(cart);
        }

        return {
            originalTotal: cart.getSubtotal(),
            discountAmount: this.totalDiscount,
            finalTotal: cart.getSubtotal() - this.totalDiscount,
            appliedDiscounts: this.appliedDiscounts
        };
    }

    visitCartItem(item) {
        // Individual item visit (if needed for item-specific rules)
        return {
            productId: item.productId,
            originalPrice: item.originalPrice,
            discountedPrice: item.price,
            saved: item.getDiscountAmount()
        };
    }

    distributeDiscount(cart) {
        const subtotal = cart.getSubtotal();
        if (subtotal === 0) return;

        // Distribute discount proportionally across items
        cart.items.forEach(item => {
            const itemSubtotal = item.originalPrice * item.quantity;
            const itemDiscountRatio = itemSubtotal / subtotal;
            const itemDiscount = this.totalDiscount * itemDiscountRatio;
            const discountPerUnit = itemDiscount / item.quantity;
            
            item.price = Math.max(0, item.originalPrice - discountPerUnit);
            item.appliedDiscounts = [...this.appliedDiscounts.map(d => d.rule)];
        });
    }

    getTotalDiscount() {
        return this.totalDiscount;
    }

    getAppliedDiscounts() {
        return this.appliedDiscounts;
    }
}

// Concrete Visitor - Price Calculator
class PriceCalculatorVisitor extends CartVisitor {
    constructor() {
        super();
        this.subtotal = 0;
        this.tax = 0;
        this.shipping = 0;
        this.total = 0;
        this.taxRate = 0.08; // 8% tax
        this.freeShippingThreshold = 50;
        this.shippingCost = 9.99;
    }

    visitShoppingCart(cart) {
        this.subtotal = 0;

        // Calculate subtotal by visiting each item
        cart.items.forEach(item => {
            this.subtotal += this.visitCartItem(item).total;
        });

        // Calculate tax
        this.tax = this.subtotal * this.taxRate;

        // Calculate shipping
        this.shipping = this.subtotal >= this.freeShippingThreshold ? 0 : this.shippingCost;

        // Calculate total
        this.total = this.subtotal + this.tax + this.shipping;

        return {
            subtotal: this.subtotal,
            tax: this.tax,
            shipping: this.shipping,
            total: this.total,
            freeShippingEligible: this.subtotal >= this.freeShippingThreshold
        };
    }

    visitCartItem(item) {
        return {
            productId: item.productId,
            unitPrice: item.price,
            quantity: item.quantity,
            total: item.getTotalPrice()
        };
    }
}

// Concrete Visitor - Optimization Suggester
class OptimizationVisitor extends CartVisitor {
    constructor(availableProducts, rules) {
        super();
        this.availableProducts = availableProducts;
        this.rules = rules;
        this.suggestions = [];
    }

    visitShoppingCart(cart) {
        this.suggestions = [];

        // Check for bundle opportunities
        this.checkBundleOpportunities(cart);

        // Check for category discounts
        this.checkCategoryDiscounts(cart);

        // Check for free shipping threshold
        this.checkShippingThreshold(cart);

        // Check for duplicate items
        this.checkDuplicates(cart);

        // Check for better alternatives
        this.checkAlternatives(cart);

        return {
            suggestions: this.suggestions,
            potentialSavings: this.calculatePotentialSavings()
        };
    }

    visitCartItem(item) {
        // Analyze individual items for optimization
        return item;
    }

    checkBundleOpportunities(cart) {
        // Find products that could complete a bundle
        const electronics = cart.items.filter(item => item.category === 'electronics');
        
        if (electronics.length === 1) {
            this.suggestions.push({
                type: 'BUNDLE',
                priority: 'HIGH',
                message: 'Add one more electronics item to get 20% off!',
                action: 'ADD_CATEGORY',
                category: 'electronics',
                potentialSaving: cart.getSubtotal() * 0.2
            });
        }
    }

    checkCategoryDiscounts(cart) {
        // Check if adding items from certain categories would trigger discounts
        const categories = new Set(cart.items.map(item => item.category));
        
        this.rules.forEach(rule => {
            if (rule.condition && rule.condition.category && !categories.has(rule.condition.category)) {
                this.suggestions.push({
                    type: 'CATEGORY_DISCOUNT',
                    priority: 'MEDIUM',
                    message: `Add ${rule.condition.category} items to unlock ${rule.percentage}% discount`,
                    action: 'ADD_CATEGORY',
                    category: rule.condition.category
                });
            }
        });
    }

    checkShippingThreshold(cart) {
        const subtotal = cart.getSubtotal();
        const freeShippingThreshold = 50;
        
        if (subtotal > 0 && subtotal < freeShippingThreshold) {
            const needed = freeShippingThreshold - subtotal;
            this.suggestions.push({
                type: 'FREE_SHIPPING',
                priority: 'HIGH',
                message: `Add $${needed.toFixed(2)} more to get FREE shipping!`,
                action: 'ADD_MORE',
                amountNeeded: needed,
                potentialSaving: 9.99
            });
        }
    }

    checkDuplicates(cart) {
        const duplicates = cart.items.filter(item => item.quantity > 1);
        
        duplicates.forEach(item => {
            this.suggestions.push({
                type: 'DUPLICATE',
                priority: 'LOW',
                message: `You have ${item.quantity} of "${item.name}". Remove duplicates?`,
                action: 'REVIEW_QUANTITY',
                productId: item.productId
            });
        });
    }

    checkAlternatives(cart) {
        // Suggest similar products at better prices (if available)
        cart.items.forEach(item => {
            const alternatives = this.availableProducts.filter(
                p => p.category === item.category && 
                     p.productId !== item.productId && 
                     p.price < item.price
            );

            if (alternatives.length > 0) {
                const cheapest = alternatives.sort((a, b) => a.price - b.price)[0];
                const saving = (item.price - cheapest.price) * item.quantity;
                
                this.suggestions.push({
                    type: 'ALTERNATIVE',
                    priority: 'MEDIUM',
                    message: `Similar item "${cheapest.name}" available for $${cheapest.price}`,
                    action: 'VIEW_ALTERNATIVE',
                    currentProduct: item.productId,
                    alternativeProduct: cheapest.productId,
                    potentialSaving: saving
                });
            }
        });
    }

    calculatePotentialSavings() {
        return this.suggestions
            .filter(s => s.potentialSaving)
            .reduce((sum, s) => sum + s.potentialSaving, 0);
    }
}

// Concrete Visitor - Analytics Collector
class AnalyticsVisitor extends CartVisitor {
    constructor() {
        super();
        this.analytics = {
            categoryDistribution: {},
            priceRanges: { low: 0, medium: 0, high: 0 },
            averageItemPrice: 0,
            mostExpensiveItem: null,
            cheapestItem: null,
            totalItems: 0,
            uniqueItems: 0
        };
    }

    visitShoppingCart(cart) {
        this.analytics.totalItems = cart.getItemCount();
        this.analytics.uniqueItems = cart.items.length;

        let totalPrice = 0;
        let maxPrice = -Infinity;
        let minPrice = Infinity;

        cart.items.forEach(item => {
            const itemData = this.visitCartItem(item);
            
            // Category distribution
            this.analytics.categoryDistribution[item.category] = 
                (this.analytics.categoryDistribution[item.category] || 0) + item.quantity;

            // Price tracking
            totalPrice += item.price * item.quantity;
            
            if (item.price > maxPrice) {
                maxPrice = item.price;
                this.analytics.mostExpensiveItem = item.toJSON();
            }
            
            if (item.price < minPrice) {
                minPrice = item.price;
                this.analytics.cheapestItem = item.toJSON();
            }

            // Price ranges
            if (item.price < 50) {
                this.analytics.priceRanges.low += item.quantity;
            } else if (item.price < 200) {
                this.analytics.priceRanges.medium += item.quantity;
            } else {
                this.analytics.priceRanges.high += item.quantity;
            }
        });

        this.analytics.averageItemPrice = this.analytics.totalItems > 0 
            ? totalPrice / this.analytics.totalItems 
            : 0;

        return this.analytics;
    }

    visitCartItem(item) {
        return {
            category: item.category,
            price: item.price,
            quantity: item.quantity
        };
    }

    getAnalytics() {
        return this.analytics;
    }
}

module.exports = {
    CartItem,
    ShoppingCart,
    CartVisitor,
    DiscountVisitor,
    PriceCalculatorVisitor,
    OptimizationVisitor,
    AnalyticsVisitor
};
