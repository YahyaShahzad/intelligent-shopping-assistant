/**
 * Unit Tests for Design Patterns
 * Run with: npm test
 */

const { 
    ShoppingContext,
    PriceCondition,
    CategoryCondition,
    AndExpression,
    UserAttributeExpression
} = require('../backend/patterns/interpreter/RuleInterpreter');

const {
    PercentageDiscount,
    CompositeDiscount,
    DiscountBuilder
} = require('../backend/patterns/composite/DiscountComposite');

const {
    CartItem,
    ShoppingCart,
    DiscountVisitor
} = require('../backend/patterns/visitor/CartVisitor');

const {
    ShoppingSession,
    SessionManager
} = require('../backend/patterns/state/SessionState');

describe('Interpreter Pattern Tests', () => {
    test('PriceCondition evaluates correctly', () => {
        const user = { id: '1', name: 'Test User' };
        const cart = {
            items: [
                { price: 50, quantity: 2 }
            ]
        };
        const context = new ShoppingContext(user, cart, []);
        
        const condition = new PriceCondition(80);
        expect(condition.interpret(context)).toBe(true);
        
        const condition2 = new PriceCondition(120);
        expect(condition2.interpret(context)).toBe(false);
    });

    test('AndExpression combines conditions', () => {
        const user = { id: '1', isStudent: true };
        const cart = {
            items: [{ price: 100, quantity: 2, category: 'electronics' }]
        };
        const context = new ShoppingContext(user, cart, []);
        
        const studentCondition = new UserAttributeExpression('isStudent', '===', true);
        const priceCondition = new PriceCondition(100);
        const andExpr = new AndExpression(studentCondition, priceCondition);
        
        expect(andExpr.interpret(context)).toBe(true);
    });
});

describe('Composite Pattern Tests', () => {
    test('PercentageDiscount calculates correctly', () => {
        const cart = {
            items: [
                { price: 100, quantity: 2 }
            ]
        };
        const discount = new PercentageDiscount('Test Discount', 10);
        const result = discount.apply(cart, {});
        
        expect(result.applied).toBe(true);
        expect(result.amount).toBe(20);
    });

    test('CompositeDiscount combines multiple discounts', () => {
        const cart = {
            items: [
                { price: 100, quantity: 1 }
            ]
        };
        
        const composite = new CompositeDiscount('Combo Deal', 'SUM');
        composite.add(new PercentageDiscount('Discount 1', 10));
        composite.add(new PercentageDiscount('Discount 2', 5));
        
        const result = composite.apply(cart, {});
        expect(result.applied).toBe(true);
        expect(result.amount).toBe(15); // 10 + 5
    });
});

describe('Visitor Pattern Tests', () => {
    test('CartItem creation and methods', () => {
        const item = new CartItem('prod1', 'Test Product', 100, 2, 'electronics');
        
        expect(item.getTotalPrice()).toBe(200);
        expect(item.getDiscountAmount()).toBe(0);
    });

    test('DiscountVisitor applies discounts to cart', () => {
        const cart = new ShoppingCart('user1', 'session1');
        cart.addItem(new CartItem('prod1', 'Laptop', 1000, 1, 'electronics'));
        
        const discount = new PercentageDiscount('Test', 10);
        const visitor = new DiscountVisitor([discount], {});
        
        const result = visitor.visitShoppingCart(cart);
        expect(result.discountAmount).toBeGreaterThan(0);
    });
});

describe('State Pattern Tests', () => {
    test('Session transitions through states', () => {
        const session = new ShoppingSession('user1', 'session1');
        
        expect(session.getStateName()).toBe('Browsing');
        
        const item = new CartItem('prod1', 'Test', 100, 1, 'test');
        session.addToCart(item);
        
        expect(session.getStateName()).toBe('Shopping');
    });

    test('SessionManager manages multiple sessions', () => {
        const manager = new SessionManager();
        const session1 = manager.createSession('user1');
        const session2 = manager.createSession('user2');
        
        expect(manager.getActiveSessions().length).toBe(2);
    });
});

describe('Integration Tests', () => {
    test('Complete shopping flow', () => {
        const manager = new SessionManager();
        const session = manager.createSession('user1');
        
        // Start browsing
        expect(session.getStateName()).toBe('Browsing');
        
        // Add to cart
        const item = new CartItem('prod1', 'Laptop', 1000, 1, 'electronics');
        session.addToCart(item);
        expect(session.getStateName()).toBe('Shopping');
        
        // Apply discount
        const discount = new PercentageDiscount('Student Discount', 15);
        const visitor = new DiscountVisitor([discount], {});
        visitor.visitShoppingCart(session.cart);
        
        // Proceed to checkout
        session.proceedToCheckout();
        expect(session.getStateName()).toBe('Checkout');
    });
});

console.log('All tests completed!');
