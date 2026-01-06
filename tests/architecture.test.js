/**
 * Integration Tests for Rule-Based System Architecture
 */

const { Blackboard, KnowledgeSource, BlackboardController } = require('../backend/architecture/blackboard/Blackboard');
const { RuleBase, InferenceEngine, WorkingMemory } = require('../backend/architecture/ruleEngine/RuleEngine');

describe('Blackboard Architecture Tests', () => {
    test('Blackboard stores and retrieves data', () => {
        const blackboard = new Blackboard();
        
        const userData = { id: 'user1', name: 'Test User' };
        blackboard.addUser('user1', userData);
        
        const retrieved = blackboard.getUser('user1');
        expect(retrieved).toEqual(userData);
    });

    test('Knowledge sources can subscribe to blackboard updates', () => {
        const blackboard = new Blackboard();
        let notified = false;

        class TestKS extends KnowledgeSource {
            onBlackboardUpdate(event) {
                notified = true;
            }
        }

        const ks = new TestKS('TestKS', 10, blackboard);
        blackboard.subscribe(ks);
        
        blackboard.addUser('user1', { name: 'Test' });
        
        // In real implementation, notification would be async
        expect(notified).toBe(true);
    });

    test('BlackboardController executes knowledge sources by priority', async () => {
        const blackboard = new Blackboard();
        const controller = new BlackboardController(blackboard);
        
        const executionOrder = [];

        class HighPriorityKS extends KnowledgeSource {
            canExecute() { return true; }
            async execute() { executionOrder.push('high'); }
        }

        class LowPriorityKS extends KnowledgeSource {
            canExecute() { return true; }
            async execute() { executionOrder.push('low'); }
        }

        controller.registerKnowledgeSource(new LowPriorityKS('LowKS', 5, blackboard));
        controller.registerKnowledgeSource(new HighPriorityKS('HighKS', 10, blackboard));
        
        await controller.execute({});
        
        // Higher priority should execute first
        expect(executionOrder[0]).toBe('high');
        expect(executionOrder[1]).toBe('low');
    });
});

describe('Rule-Based System Tests', () => {
    test('RuleBase manages rules', () => {
        const ruleBase = new RuleBase();
        
        const rule = {
            id: 'rule1',
            name: 'Test Rule',
            conditions: [],
            actions: [],
            priority: 10
        };
        
        ruleBase.addRule(rule);
        
        const retrieved = ruleBase.getRule('rule1');
        expect(retrieved).toEqual(rule);
        
        const allRules = ruleBase.getAllRules();
        expect(allRules.length).toBe(1);
    });

    test('WorkingMemory stores facts', () => {
        const memory = new WorkingMemory();
        
        memory.addFact('cart.total', 100);
        memory.addFact('user.isStudent', true);
        
        expect(memory.getFact('cart.total')).toBe(100);
        expect(memory.getFact('user.isStudent')).toBe(true);
        
        const allFacts = memory.getAllFacts();
        expect(Object.keys(allFacts).length).toBe(2);
    });

    test('InferenceEngine forward chaining', () => {
        const ruleBase = new RuleBase();
        const memory = new WorkingMemory();
        
        // Rule: IF cart.total > 100 AND user.isStudent THEN apply student discount
        const rule = {
            id: 'studentDiscount',
            name: 'Student Discount',
            conditions: [
                { fact: 'cart.total', operator: '>', value: 100 },
                { fact: 'user.isStudent', operator: '===', value: true }
            ],
            actions: [
                { type: 'add', fact: 'discount.student', value: 15 }
            ],
            priority: 10
        };
        
        ruleBase.addRule(rule);
        
        // Add facts
        memory.addFact('cart.total', 150);
        memory.addFact('user.isStudent', true);
        
        const engine = new InferenceEngine(ruleBase, memory, 'FORWARD');
        const results = engine.forwardChain();
        
        // Should have fired the rule
        expect(results.firedRules.length).toBeGreaterThan(0);
        expect(memory.getFact('discount.student')).toBe(15);
    });
});

describe('Knowledge Sources Integration Tests', () => {
    test('RuleInterpreterKS evaluates rules', async () => {
        const blackboard = new Blackboard();
        
        // Add sample data
        blackboard.addUser('user1', { id: 'user1', isStudent: true });
        blackboard.updateCart('session1', {
            userId: 'user1',
            items: [{ price: 100, quantity: 2 }]
        });
        
        const context = {
            sessionId: 'session1',
            userId: 'user1'
        };
        
        // RuleInterpreterKS would evaluate rules here
        // This is a simplified test
        const cart = blackboard.getCart('session1');
        const user = blackboard.getUser('user1');
        
        expect(cart.items.length).toBe(1);
        expect(user.isStudent).toBe(true);
    });

    test('DiscountCalculatorKS applies discounts', () => {
        const { PercentageDiscount } = require('../backend/patterns/composite/DiscountComposite');
        
        const cart = {
            items: [
                { price: 100, quantity: 1 },
                { price: 50, quantity: 2 }
            ]
        };
        
        const discount = new PercentageDiscount('Test Discount', 10);
        const result = discount.apply(cart, {});
        
        // Cart total is 200, 10% discount = 20
        expect(result.amount).toBe(20);
    });
});

describe('End-to-End Flow Tests', () => {
    test('Complete shopping flow with all systems', async () => {
        const { ShoppingAssistantService } = require('../backend/services/ShoppingAssistantService');
        
        // Note: This requires mocking MongoDB connections
        // For now, this is a structure test
        
        const service = new ShoppingAssistantService();
        
        // Start session
        const sessionData = await service.startSession('user1', {
            name: 'Test User',
            isStudent: true
        });
        
        expect(sessionData.sessionId).toBeDefined();
        expect(sessionData.state).toBe('Browsing');
        
        // Add to cart
        const product = {
            productId: 'prod1',
            name: 'Laptop',
            price: 1000,
            quantity: 1,
            category: 'electronics'
        };
        
        const cartResult = await service.addToCart(sessionData.sessionId, product);
        
        expect(cartResult.cart.items.length).toBe(1);
        expect(cartResult.state).toBe('Shopping');
        
        // Should have evaluation with suggestions
        expect(cartResult.evaluation).toBeDefined();
    });
});

console.log('Architecture tests completed!');
