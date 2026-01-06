/**
 * STATE PATTERN - Session State Management
 * Manages user session lifecycle and shopping states
 */

const { ShoppingCart, CartItem } = require('../visitor/CartVisitor');
const Order = require('../../models/Order');
const User = require('../../models/User');
const Product = require('../../models/Product');

// Context - Shopping Session
class ShoppingSession {
    constructor(userId, sessionId) {
        this.userId = userId;
        this.sessionId = sessionId;
        this.state = new BrowsingState();
        this.state.setSession(this); // Set session reference
        this.cart = null;
        this.history = [];
        this.metadata = {
            startTime: new Date(),
            lastActivity: new Date(),
            transitions: []
        };
    }

    setState(state) {
        const previousState = this.state;
        this.state = state;
        this.state.setSession(this);
        
        // Record transition
        this.metadata.transitions.push({
            from: previousState.getName(),
            to: state.getName(),
            timestamp: new Date()
        });
        
        this.metadata.lastActivity = new Date();
        
        // Execute state entry actions
        this.state.onEnter();
    }

    getState() {
        return this.state;
    }

    getStateName() {
        return this.state.getName();
    }

    // Delegate actions to current state
    browse(product) {
        return this.state.browse(product);
    }

    addToCart(item) {
        return this.state.addToCart(item);
    }

    removeFromCart(productId) {
        return this.state.removeFromCart(productId);
    }

    updateCart(productId, quantity) {
        return this.state.updateCart(productId, quantity);
    }

    proceedToCheckout() {
        return this.state.proceedToCheckout();
    }

    completeCheckout(paymentInfo) {
        return this.state.completeCheckout(paymentInfo);
    }

    cancelCheckout() {
        return this.state.cancelCheckout();
    }

    abandonSession() {
        return this.state.abandonSession();
    }

    // Session management
    isActive() {
        return !(this.state instanceof CompletedState || this.state instanceof AbandonedState);
    }

    getDuration() {
        return new Date() - this.metadata.startTime;
    }

    getSessionInfo() {
        return {
            userId: this.userId,
            sessionId: this.sessionId,
            currentState: this.getStateName(),
            duration: this.getDuration(),
            transitionCount: this.metadata.transitions.length,
            isActive: this.isActive(),
            cart: this.cart,
            metadata: this.metadata
        };
    }

    toJSON() {
        return this.getSessionInfo();
    }
}

// Abstract State
class SessionState {
    constructor() {
        this.session = null;
    }

    setSession(session) {
        this.session = session;
    }

    getName() {
        return this.constructor.name.replace('State', '');
    }

    onEnter() {
        // Override in subclasses for entry actions
    }

    onExit() {
        // Override in subclasses for exit actions
    }

    browse(product) {
        throw new Error(`browse() not allowed in ${this.getName()} state`);
    }

    addToCart(item) {
        throw new Error(`addToCart() not allowed in ${this.getName()} state`);
    }

    removeFromCart(productId) {
        throw new Error(`removeFromCart() not allowed in ${this.getName()} state`);
    }

    updateCart(productId, quantity) {
        throw new Error(`updateCart() not allowed in ${this.getName()} state`);
    }

    proceedToCheckout() {
        throw new Error(`proceedToCheckout() not allowed in ${this.getName()} state`);
    }

    completeCheckout(paymentInfo) {
        throw new Error(`completeCheckout() not allowed in ${this.getName()} state`);
    }

    cancelCheckout() {
        throw new Error(`cancelCheckout() not allowed in ${this.getName()} state`);
    }

    abandonSession() {
        this.session.setState(new AbandonedState());
        return { success: true, message: "Session abandoned", newState: "Abandoned" };
    }
}

// Concrete State - Browsing
class BrowsingState extends SessionState {
    onEnter() {
        console.log(`[${this.session.sessionId}] Entered Browsing state`);
    }

    browse(product) {
        // User can browse products freely
        if (!this.session.history) {
            this.session.history = [];
        }
        
        this.session.history.push({
            action: 'VIEW',
            product: product,
            timestamp: new Date()
        });

        return {
            success: true,
            message: "Product viewed",
            product: product
        };
    }

    addToCart(item) {
        // Transition to Shopping state when adding to cart
        this.session.setState(new ShoppingState());
        return this.session.addToCart(item);
    }

    proceedToCheckout() {
        return {
            success: false,
            message: "Cart is empty. Add items before checkout.",
            state: this.getName()
        };
    }
}

// Concrete State - Shopping
class ShoppingState extends SessionState {
    onEnter() {
        console.log(`[${this.session.sessionId}] Entered Shopping state`);
        
        // Initialize cart if needed
        if (!this.session.cart) {
            const { ShoppingCart } = require('../visitor/CartVisitor');
            this.session.cart = new ShoppingCart(this.session.userId, this.session.sessionId);
        }
    }

    browse(product) {
        // Can still browse while shopping
        if (!this.session.history) {
            this.session.history = [];
        }
        
        this.session.history.push({
            action: 'VIEW',
            product: product,
            timestamp: new Date()
        });

        return {
            success: true,
            message: "Product viewed",
            product: product
        };
    }

    addToCart(item) {
        this.session.cart.addItem(item);
        
        this.session.history.push({
            action: 'ADD_TO_CART',
            item: item,
            timestamp: new Date()
        });

        return {
            success: true,
            message: "Item added to cart",
            cart: this.session.cart.toJSON()
        };
    }

    removeFromCart(productId) {
        this.session.cart.removeItem(productId);
        
        this.session.history.push({
            action: 'REMOVE_FROM_CART',
            productId: productId,
            timestamp: new Date()
        });

        // If cart becomes empty, transition back to Browsing
        if (this.session.cart.items.length === 0) {
            this.session.setState(new BrowsingState());
            return {
                success: true,
                message: "Item removed. Cart is now empty.",
                newState: "Browsing"
            };
        }

        return {
            success: true,
            message: "Item removed from cart",
            cart: this.session.cart.toJSON()
        };
    }

    updateCart(productId, quantity) {
        this.session.cart.updateQuantity(productId, quantity);
        
        this.session.history.push({
            action: 'UPDATE_CART',
            productId: productId,
            quantity: quantity,
            timestamp: new Date()
        });

        // If cart becomes empty, transition back to Browsing
        if (this.session.cart.items.length === 0) {
            this.session.setState(new BrowsingState());
            return {
                success: true,
                message: "Cart emptied",
                newState: "Browsing"
            };
        }

        return {
            success: true,
            message: "Cart updated",
            cart: this.session.cart.toJSON()
        };
    }

    proceedToCheckout() {
        if (this.session.cart.items.length === 0) {
            return {
                success: false,
                message: "Cannot checkout with empty cart"
            };
        }

        this.session.setState(new CheckoutState());
        return {
            success: true,
            message: "Proceeding to checkout",
            newState: "Checkout",
            cart: this.session.cart.toJSON()
        };
    }
}

// Concrete State - Checkout
class CheckoutState extends SessionState {
    onEnter() {
        console.log(`[${this.session.sessionId}] Entered Checkout state`);
        this.session.metadata.checkoutStartTime = new Date();
    }

    addToCart(item) {
        return {
            success: false,
            message: "Cannot modify cart during checkout. Cancel checkout to continue shopping.",
            state: this.getName()
        };
    }

    removeFromCart(productId) {
        return {
            success: false,
            message: "Cannot modify cart during checkout. Cancel checkout to continue shopping.",
            state: this.getName()
        };
    }

    async completeCheckout(checkoutData) {
        // Validate checkout data
        if (!checkoutData) {
            return {
                success: false,
                message: "Invalid checkout data"
            };
        }

        // Store billing and payment info
        const billingInfo = checkoutData.billingInfo || {};
        const paymentInfo = checkoutData.paymentInfo || {};

        // Basic validation
        if (!billingInfo.name || !billingInfo.email || !paymentInfo.cardNumber) {
            return {
                success: false,
                message: "Missing required billing or payment information"
            };
        }

        // Process payment (simplified)
        const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        this.session.metadata.orderId = orderId;
        this.session.metadata.checkoutCompletedTime = new Date();
        this.session.metadata.billingInfo = billingInfo;
        this.session.metadata.paymentMethod = 'Credit Card';

        // Get cart data for order
        const cartData = this.session.cart.toJSON();
        
        // Save order to database
        try {
            const order = new Order({
                orderId: orderId,
                user: this.session.userId, // ObjectId reference
                userId: this.session.userId, // String for backward compatibility
                sessionId: this.session.sessionId,
                items: cartData.items.map(item => ({
                    ...item,
                    product: item.productId, // Add product reference
                    productId: item.productId
                })),
                billingInfo: {
                    name: billingInfo.name,
                    email: billingInfo.email,
                    phone: billingInfo.phone,
                    address: billingInfo.address,
                    city: billingInfo.city,
                    postalCode: billingInfo.postalCode
                },
                paymentInfo: {
                    method: 'Credit Card',
                    lastFourDigits: paymentInfo.cardNumber.slice(-4)
                },
                subtotal: cartData.subtotal,
                discount: cartData.totalDiscount || 0,
                total: cartData.total,
                status: 'confirmed'
            });
            
            await order.save();
            console.log(`Order ${orderId} saved to database`);
            
            // FIX: Update user purchase history for personalized recommendations
            // Changed from findOne({userId}) to findById since User model uses _id
            if (this.session.userId) {
                try {
                    const user = await User.findById(this.session.userId);
                    if (user) {
                        // Get full product details for each item
                        for (const item of cartData.items) {
                            const product = await Product.findOne({ productId: item.productId });
                            if (product) {
                                user.purchaseHistory.push({
                                    orderId: orderId,
                                    productId: item.productId,
                                    name: item.name,
                                    category: product.category || 'General',
                                    tags: product.tags || [],
                                    price: item.price,
                                    purchaseDate: new Date()
                                });
                            }
                        }
                        await user.save();
                        console.log(`Purchase history updated for user ${this.session.userId}`);
                    }
                } catch (historyError) {
                    console.error('Error updating purchase history:', historyError);
                    // Continue even if history update fails
                }
            }
        } catch (error) {
            console.error('Error saving order to database:', error);
            // Continue even if database save fails
        }

        this.session.history.push({
            action: 'CHECKOUT_COMPLETED',
            orderId: orderId,
            total: this.session.cart.getTotal(),
            timestamp: new Date()
        });

        // Transition to Completed state
        this.session.setState(new CompletedState());

        return {
            success: true,
            message: "Checkout completed successfully",
            orderId: orderId,
            total: this.session.cart.getTotal(),
            newState: "Completed"
        };
    }

    cancelCheckout() {
        this.session.history.push({
            action: 'CHECKOUT_CANCELLED',
            timestamp: new Date()
        });

        // Return to Shopping state
        this.session.setState(new ShoppingState());

        return {
            success: true,
            message: "Checkout cancelled. Returned to shopping.",
            newState: "Shopping"
        };
    }

    proceedToCheckout() {
        return {
            success: false,
            message: "Already in checkout. Complete or cancel current checkout.",
            state: this.getName()
        };
    }
}

// Concrete State - Completed
class CompletedState extends SessionState {
    onEnter() {
        console.log(`[${this.session.sessionId}] Entered Completed state`);
        this.session.metadata.completedTime = new Date();
    }

    browse(product) {
        return {
            success: false,
            message: "Session completed. Start a new session to continue shopping.",
            state: this.getName()
        };
    }

    addToCart(item) {
        return {
            success: false,
            message: "Session completed. Start a new session to continue shopping.",
            state: this.getName()
        };
    }

    removeFromCart(productId) {
        return {
            success: false,
            message: "Session completed. Cannot modify completed order.",
            state: this.getName()
        };
    }

    proceedToCheckout() {
        return {
            success: false,
            message: "Session already completed.",
            state: this.getName()
        };
    }

    abandonSession() {
        return {
            success: false,
            message: "Cannot abandon completed session.",
            state: this.getName()
        };
    }
}

// Concrete State - Abandoned
class AbandonedState extends SessionState {
    onEnter() {
        console.log(`[${this.session.sessionId}] Entered Abandoned state`);
        this.session.metadata.abandonedTime = new Date();
    }

    browse(product) {
        return {
            success: false,
            message: "Session abandoned. Start a new session to continue.",
            state: this.getName()
        };
    }

    addToCart(item) {
        return {
            success: false,
            message: "Session abandoned. Start a new session to continue.",
            state: this.getName()
        };
    }

    abandonSession() {
        return {
            success: false,
            message: "Session already abandoned.",
            state: this.getName()
        };
    }
}

// Session Manager - Factory and Registry
class SessionManager {
    constructor() {
        this.sessions = new Map();
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
    }

    createSession(userId) {
        const sessionId = `SESSION-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const session = new ShoppingSession(userId, sessionId);
        
        this.sessions.set(sessionId, session);
        
        // Set timeout to auto-abandon inactive sessions
        setTimeout(() => {
            this.checkSessionTimeout(sessionId);
        }, this.sessionTimeout);

        return session;
    }

    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }

    checkSessionTimeout(sessionId) {
        const session = this.sessions.get(sessionId);
        
        if (!session) return;

        const inactiveTime = Date.now() - session.metadata.lastActivity;
        
        if (inactiveTime >= this.sessionTimeout && session.isActive()) {
            session.abandonSession();
            console.log(`[${sessionId}] Auto-abandoned due to inactivity`);
        }
    }

    removeSession(sessionId) {
        this.sessions.delete(sessionId);
    }

    getActiveSessions() {
        return Array.from(this.sessions.values()).filter(s => s.isActive());
    }

    getAllSessions() {
        return Array.from(this.sessions.values());
    }

    getSessionStats() {
        const sessions = Array.from(this.sessions.values());
        
        return {
            total: sessions.length,
            active: sessions.filter(s => s.isActive()).length,
            completed: sessions.filter(s => s.getStateName() === 'Completed').length,
            abandoned: sessions.filter(s => s.getStateName() === 'Abandoned').length,
            byState: {
                Browsing: sessions.filter(s => s.getStateName() === 'Browsing').length,
                Shopping: sessions.filter(s => s.getStateName() === 'Shopping').length,
                Checkout: sessions.filter(s => s.getStateName() === 'Checkout').length,
                Completed: sessions.filter(s => s.getStateName() === 'Completed').length,
                Abandoned: sessions.filter(s => s.getStateName() === 'Abandoned').length
            }
        };
    }
}

module.exports = {
    ShoppingSession,
    SessionState,
    BrowsingState,
    ShoppingState,
    CheckoutState,
    CompletedState,
    AbandonedState,
    SessionManager
};
