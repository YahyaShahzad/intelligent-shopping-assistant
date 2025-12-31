/**
 * Shopping Assistant Service
 * Integrates all patterns and architecture components
 */

const { Blackboard, BlackboardController } = require('../architecture/blackboard/Blackboard');
const { RuleBase, InferenceEngine } = require('../architecture/ruleEngine/RuleEngine');
const {
    RuleInterpreterKS,
    DiscountCalculatorKS,
    PersonalizationEngineKS,
    InventoryCheckerKS,
    CartOptimizerKS
} = require('../architecture/knowledgeSources/KnowledgeSources');
const { ShoppingSession, SessionManager } = require('../patterns/state/SessionState');
const User = require('../models/User');
const { DiscountBuilder } = require('../patterns/composite/DiscountComposite');
const { CartItem, ShoppingCart } = require('../patterns/visitor/CartVisitor');
const {
    PriceCondition,
    CategoryCondition,
    UserAttributeExpression,
    TimeBasedCondition
} = require('../patterns/interpreter/RuleInterpreter');

class ShoppingAssistantService {
    constructor() {
        // Initialize Blackboard
        this.blackboard = new Blackboard();
        
        // Initialize Rule Engine
        this.ruleBase = new RuleBase();
        this.inferenceEngine = new InferenceEngine(this.ruleBase, 'FORWARD');
        
        // Initialize Session Manager
        this.sessionManager = new SessionManager();
        
        // Initialize Discount Rules
        this.discountRules = this.initializeDiscountRules();
        
        // Initialize Knowledge Sources
        this.initializeKnowledgeSources();
        
        // Initialize Blackboard Controller
        this.controller = new BlackboardController(this.blackboard);
        this.registerKnowledgeSources();
    }

    initializeDiscountRules() {
        const builder = new DiscountBuilder();
        
        // Student Discount
        const studentDiscount = builder
            .createComposite('Student & Cart Combo', 'SUM')
            .addPercentage('Student Discount', 15, 
                new UserAttributeExpression('isStudent', '===', true))
            .addPercentage('High Value Cart', 10, 
                new PriceCondition(100))
            .build();

        // Electronics Bundle
        const electronicsBundle = builder
            .createComposite('Electronics Bundle', 'MAX')
            .addCategory('Electronics Discount', 'electronics', 20,
                new CategoryCondition('electronics', 2))
            .addBundle('Buy 2 Get 1', 2, 1, 'electronics')
            .build();

        // Seasonal Sale
        const seasonalSale = builder
            .createComposite('Holiday Season', 'MAX')
            .addPercentage('December Sale', 25,
                new TimeBasedCondition({ type: 'month', value: 12 }))
            .addFixedAmount('New Year Special', 50,
                new PriceCondition(200))
            .build();

        return [studentDiscount, electronicsBundle, seasonalSale];
    }

    initializeKnowledgeSources() {
        this.ruleInterpreterKS = new RuleInterpreterKS(this.blackboard, this.inferenceEngine);
        this.discountCalculatorKS = new DiscountCalculatorKS(this.blackboard, this.discountRules);
        this.personalizationKS = new PersonalizationEngineKS(this.blackboard);
        this.inventoryCheckerKS = new InventoryCheckerKS(this.blackboard);
        this.cartOptimizerKS = new CartOptimizerKS(this.blackboard, this.ruleBase.getAllRules());
    }

    registerKnowledgeSources() {
        this.controller.registerKnowledgeSource(this.ruleInterpreterKS);
        this.controller.registerKnowledgeSource(this.discountCalculatorKS);
        this.controller.registerKnowledgeSource(this.personalizationKS);
        this.controller.registerKnowledgeSource(this.inventoryCheckerKS);
        this.controller.registerKnowledgeSource(this.cartOptimizerKS);
    }

    // Start a new shopping session
    async startSession(userId, userData) {
        const session = this.sessionManager.createSession(userId);
        
        // Store user in blackboard
        this.blackboard.setUser(userId, userData);
        
        // Store session in blackboard
        this.blackboard.setSession(session.sessionId, session.getSessionInfo());
        
        // Clear previous recommendations for fresh start
        this.blackboard.clearRecommendations(userId);
        
        return {
            sessionId: session.sessionId,
            state: session.getStateName(),
            user: userData
        };
    }

    // Get session info
    getSession(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        return session.getSessionInfo();
    }

    // Add item to cart
    async addToCart(sessionId, productData) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        const cartItem = new CartItem(
            productData.productId,
            productData.name,
            productData.price,
            productData.quantity || 1,
            productData.category,
            productData.tags
        );

        const result = session.addToCart(cartItem);
        
        if (result.success) {
            // Update blackboard
            this.blackboard.setCart(session.userId, session.cart);
            this.blackboard.setSession(sessionId, session.getSessionInfo());
            
            // Run knowledge sources
            await this.evaluateCart(session);
        }

        return result;
    }

    // Evaluate cart and apply rules
    async evaluateCart(session) {
        const user = this.blackboard.getUser(session.userId);
        const cart = session.cart;

        if (!cart || cart.items.length === 0) {
            return { suggestions: [], discounts: [] };
        }

        // Execute knowledge sources
        const context = { user, cart, session };
        const results = this.controller.execute(context);

        // Extract results
        const discountResult = results.find(r => r.source === 'DiscountCalculator');
        const optimizerResult = results.find(r => r.source === 'CartOptimizer');
        const recommendationResult = results.find(r => r.source === 'PersonalizationEngine');
        const inventoryResult = results.find(r => r.source === 'InventoryChecker');

        return {
            discounts: discountResult || { totalDiscount: 0, appliedRules: [] },
            suggestions: optimizerResult?.suggestions || [],
            recommendations: recommendationResult?.recommendations || [],
            inventoryIssues: inventoryResult?.issues || []
        };
    }

    // Update cart item quantity
    async updateCartItem(sessionId, productId, quantity) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        const result = session.updateCart(productId, quantity);
        
        if (result.success) {
            this.blackboard.setCart(session.userId, session.cart);
            this.blackboard.setSession(sessionId, session.getSessionInfo());
            
            if (session.cart && session.cart.items.length > 0) {
                await this.evaluateCart(session);
            }
        }

        return result;
    }

    // Remove item from cart
    async removeFromCart(sessionId, productId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        const result = session.removeFromCart(productId);
        
        if (result.success) {
            this.blackboard.setCart(session.userId, session.cart);
            this.blackboard.setSession(sessionId, session.getSessionInfo());
        }

        return result;
    }

    // Proceed to checkout
    async proceedToCheckout(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        const result = session.proceedToCheckout();
        
        if (result.success) {
            this.blackboard.setSession(sessionId, session.getSessionInfo());
        }

        return result;
    }

    // Complete checkout
    async completeCheckout(sessionId, paymentInfo) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        const result = await session.completeCheckout(paymentInfo);
        
        if (result.success) {
            this.blackboard.setSession(sessionId, session.getSessionInfo());
        }

        return result;
    }

    // Get recommendations for user
    async getRecommendations(userId) {
        // Fetch fresh user data from database to get latest purchase history
        const dbUser = await User.findById(userId);
        if (!dbUser) {
            throw new Error('User not found');
        }

        // Update blackboard with fresh user data including purchase history
        const userData = dbUser.toJSON();
        userData.id = userId;
        this.blackboard.setUser(userId, userData);

        const context = { 
            user: { id: userId }, 
            cart: this.blackboard.getCart(userId) || { items: [] } 
        };
        this.personalizationKS.execute(context);

        return this.blackboard.getRecommendations(userId);
    }

    // Get available coupons for user
    async getAvailableCoupons(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const coupons = [
            {
                code: 'STUDENT2024',
                discount: '15% OFF',
                description: 'Student discount on all items',
                condition: user.isStudent,
                type: 'percentage',
                value: 15
            },
            {
                code: 'NEWYEAR25',
                discount: '$25 OFF',
                description: 'New Year special - $25 off on orders above $100',
                condition: true,
                type: 'fixed',
                value: 25,
                minPurchase: 100
            },
            {
                code: 'TECH20',
                discount: '20% OFF',
                description: 'Electronics category - 20% discount',
                condition: true,
                type: 'category',
                value: 20,
                category: 'electronics'
            },
            {
                code: 'FIRSTBUY',
                discount: '$10 OFF',
                description: 'First purchase special',
                condition: !user.purchaseHistory || user.purchaseHistory.length === 0,
                type: 'fixed',
                value: 10
            }
        ];

        // Return only coupons user is eligible for
        return coupons.filter(c => c.condition);
    }

    // Apply coupon to session
    async applyCoupon(sessionId, couponCode) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        const user = await User.findById(session.userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Additional validation for specific coupons
        if (couponCode === 'STUDENT2024' && !user.isStudent) {
            return { success: false, error: 'This coupon is only available for students' };
        }

        const coupons = await this.getAvailableCoupons(session.userId);
        const coupon = coupons.find(c => c.code === couponCode);

        if (!coupon) {
            return { success: false, error: 'Invalid or ineligible coupon' };
        }

        // Apply coupon based on type
        let discountAmount = 0;
        const cart = session.cart;

        if (coupon.type === 'percentage') {
            discountAmount = cart.totalPrice * (coupon.value / 100);
        } else if (coupon.type === 'fixed') {
            if (coupon.minPurchase && cart.totalPrice < coupon.minPurchase) {
                return { 
                    success: false, 
                    error: `Minimum purchase of $${coupon.minPurchase} required` 
                };
            }
            discountAmount = coupon.value;
        } else if (coupon.type === 'category') {
            const categoryItems = cart.items.filter(item => 
                item.category === coupon.category
            );
            const categoryTotal = categoryItems.reduce((sum, item) => 
                sum + (item.price * item.quantity), 0
            );
            discountAmount = categoryTotal * (coupon.value / 100);
        }

        // Store applied coupon in session
        session.appliedCoupon = {
            code: couponCode,
            discount: discountAmount
        };

        // Update cart with additional discount
        cart.discount = (cart.discount || 0) + discountAmount;
        cart.totalPrice = Math.max(0, cart.totalPrice - discountAmount);

        this.blackboard.setCart(session.userId, cart);
        this.blackboard.setSession(sessionId, session.getSessionInfo());

        return {
            success: true,
            couponCode,
            discountAmount,
            message: `Coupon ${couponCode} applied! You saved $${discountAmount.toFixed(2)}`
        };
    }

    // Add product to inventory
    addProduct(productData) {
        this.blackboard.setInventory(productData.id, productData);
    }

    // Get product from inventory
    getProduct(productId) {
        return this.blackboard.getInventory(productId);
    }

    // Get all products
    getAllProducts() {
        return this.blackboard.getAllInventory();
    }

    // Add rule
    addRule(ruleData) {
        this.ruleBase.addRule(ruleData);
        this.blackboard.addRule(ruleData.id, ruleData);
    }

    // Get statistics
    getStatistics() {
        return {
            blackboard: this.blackboard.getStatistics(),
            ruleEngine: this.inferenceEngine.getStatistics(),
            sessions: this.sessionManager.getSessionStats(),
            controller: this.controller.getStatistics()
        };
    }
}

// Singleton instance
let serviceInstance = null;

function getShoppingAssistantService() {
    if (!serviceInstance) {
        serviceInstance = new ShoppingAssistantService();
    }
    return serviceInstance;
}

module.exports = {
    ShoppingAssistantService,
    getShoppingAssistantService
};
