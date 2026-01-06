/**
 * INTERPRETER PATTERN - Rule Expression Parser
 * Parses and evaluates shopping rules and user preferences
 */

// Context for rule interpretation
class ShoppingContext {
    constructor(user, cart, inventory, timestamp = new Date()) {
        this.user = user;
        this.cart = cart;
        this.inventory = inventory;
        this.timestamp = timestamp;
        this.variables = new Map();
    }

    setVariable(key, value) {
        this.variables.set(key, value);
    }

    getVariable(key) {
        return this.variables.get(key);
    }

    getCartTotal() {
        return this.cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    getCartItemCount() {
        return this.cart.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    getCategoryCount(category) {
        return this.cart.items.filter(item => item.category === category).length;
    }

    hasProduct(productId) {
        return this.cart.items.some(item => item.productId === productId);
    }
}

// Abstract Expression
class RuleExpression {
    interpret(context) {
        throw new Error("interpret() must be implemented by subclass");
    }

    toString() {
        throw new Error("toString() must be implemented by subclass");
    }
}

// Terminal Expression - User Attribute Check
class UserAttributeExpression extends RuleExpression {
    constructor(attribute, operator, value) {
        super();
        this.attribute = attribute;
        this.operator = operator;
        this.value = value;
    }

    interpret(context) {
        const userValue = this.getUserAttribute(context.user, this.attribute);
        return this.compare(userValue, this.operator, this.value);
    }

    getUserAttribute(user, path) {
        return path.split('.').reduce((obj, key) => obj?.[key], user);
    }

    compare(actual, operator, expected) {
        switch (operator) {
            case '===': return actual === expected;
            case '!==': return actual !== expected;
            case '>': return actual > expected;
            case '>=': return actual >= expected;
            case '<': return actual < expected;
            case '<=': return actual <= expected;
            case 'includes': return Array.isArray(actual) && actual.includes(expected);
            case 'startsWith': return typeof actual === 'string' && actual.startsWith(expected);
            default: return false;
        }
    }

    toString() {
        return `user.${this.attribute} ${this.operator} ${this.value}`;
    }
}

// Terminal Expression - Price Condition
class PriceCondition extends RuleExpression {
    constructor(minPrice, maxPrice = Infinity) {
        super();
        this.minPrice = minPrice;
        this.maxPrice = maxPrice;
    }

    interpret(context) {
        const total = context.getCartTotal();
        return total >= this.minPrice && total <= this.maxPrice;
    }

    toString() {
        if (this.maxPrice === Infinity) {
            return `cart.total >= ${this.minPrice}`;
        }
        return `cart.total between ${this.minPrice} and ${this.maxPrice}`;
    }
}

// Terminal Expression - Category Condition
class CategoryCondition extends RuleExpression {
    constructor(category, minCount = 1) {
        super();
        this.category = category;
        this.minCount = minCount;
    }

    interpret(context) {
        const count = context.getCategoryCount(this.category);
        return count >= this.minCount;
    }

    toString() {
        return `cart.${this.category}.count >= ${this.minCount}`;
    }
}

// Terminal Expression - Time-Based Condition
class TimeBasedCondition extends RuleExpression {
    constructor(condition) {
        super();
        this.condition = condition; // { type: 'month', value: 12 } or { type: 'dayOfWeek', value: 'friday' }
    }

    interpret(context) {
        const now = context.timestamp;
        
        switch (this.condition.type) {
            case 'month':
                return now.getMonth() + 1 === this.condition.value;
            case 'dayOfWeek':
                const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                return days[now.getDay()] === this.condition.value.toLowerCase();
            case 'hour':
                return now.getHours() === this.condition.value;
            case 'dateRange':
                return now >= this.condition.start && now <= this.condition.end;
            default:
                return false;
        }
    }

    toString() {
        return `time.${this.condition.type} === ${this.condition.value}`;
    }
}

// Terminal Expression - Product Condition
class ProductCondition extends RuleExpression {
    constructor(productIds) {
        super();
        this.productIds = Array.isArray(productIds) ? productIds : [productIds];
    }

    interpret(context) {
        return this.productIds.some(id => context.hasProduct(id));
    }

    toString() {
        return `cart.hasProducts(${this.productIds.join(', ')})`;
    }
}

// Non-Terminal Expression - AND
class AndExpression extends RuleExpression {
    constructor(...expressions) {
        super();
        this.expressions = expressions;
    }

    interpret(context) {
        return this.expressions.every(expr => expr.interpret(context));
    }

    toString() {
        return `(${this.expressions.map(e => e.toString()).join(' AND ')})`;
    }
}

// Non-Terminal Expression - OR
class OrExpression extends RuleExpression {
    constructor(...expressions) {
        super();
        this.expressions = expressions;
    }

    interpret(context) {
        return this.expressions.some(expr => expr.interpret(context));
    }

    toString() {
        return `(${this.expressions.map(e => e.toString()).join(' OR ')})`;
    }
}

// Non-Terminal Expression - NOT
class NotExpression extends RuleExpression {
    constructor(expression) {
        super();
        this.expression = expression;
    }

    interpret(context) {
        return !this.expression.interpret(context);
    }

    toString() {
        return `NOT (${this.expression.toString()})`;
    }
}

// Rule Parser - Converts string rules to expression objects
class RuleParser {
    static parse(ruleString) {
        // Simple parser for demonstration
        // In production, use a proper parser library like PEG.js or ANTLR
        try {
            // Example: "user.isStudent === true AND cart.total > 100"
            const tokens = this.tokenize(ruleString);
            return this.buildExpression(tokens);
        } catch (error) {
            throw new Error(`Failed to parse rule: ${error.message}`);
        }
    }

    static tokenize(ruleString) {
        // Simple tokenization
        return ruleString
            .replace(/\(/g, ' ( ')
            .replace(/\)/g, ' ) ')
            .split(/\s+/)
            .filter(token => token.length > 0);
    }

    static buildExpression(tokens) {
        // Simplified expression builder
        // This is a basic implementation - extend for complex rules
        
        if (tokens.length === 0) {
            throw new Error("Empty rule");
        }

        // Handle parentheses
        if (tokens[0] === '(') {
            // Find matching closing parenthesis
            let depth = 0;
            let closeIndex = -1;
            for (let i = 0; i < tokens.length; i++) {
                if (tokens[i] === '(') depth++;
                if (tokens[i] === ')') {
                    depth--;
                    if (depth === 0) {
                        closeIndex = i;
                        break;
                    }
                }
            }
            const innerTokens = tokens.slice(1, closeIndex);
            return this.buildExpression(innerTokens);
        }

        // Check for logical operators
        const andIndex = tokens.indexOf('AND');
        const orIndex = tokens.indexOf('OR');
        
        if (andIndex !== -1) {
            const left = this.buildExpression(tokens.slice(0, andIndex));
            const right = this.buildExpression(tokens.slice(andIndex + 1));
            return new AndExpression(left, right);
        }
        
        if (orIndex !== -1) {
            const left = this.buildExpression(tokens.slice(0, orIndex));
            const right = this.buildExpression(tokens.slice(orIndex + 1));
            return new OrExpression(left, right);
        }

        // Build terminal expression
        return this.buildTerminalExpression(tokens);
    }

    static buildTerminalExpression(tokens) {
        // Parse terminal expressions
        // Example: ["user.isStudent", "===", "true"]
        
        if (tokens[0].startsWith('user.')) {
            const attribute = tokens[0].substring(5);
            const operator = tokens[1];
            const value = this.parseValue(tokens[2]);
            return new UserAttributeExpression(attribute, operator, value);
        }
        
        if (tokens[0] === 'cart.total') {
            const operator = tokens[1];
            const value = parseFloat(tokens[2]);
            
            if (operator === '>=' || operator === '>') {
                return new PriceCondition(value);
            } else if (operator === '<=' || operator === '<') {
                return new PriceCondition(0, value);
            }
        }
        
        throw new Error(`Unable to parse terminal expression: ${tokens.join(' ')}`);
    }

    static parseValue(valueStr) {
        if (valueStr === 'true') return true;
        if (valueStr === 'false') return false;
        if (valueStr === 'null') return null;
        if (!isNaN(valueStr)) return parseFloat(valueStr);
        return valueStr.replace(/['"]/g, ''); // Remove quotes
    }
}

module.exports = {
    ShoppingContext,
    RuleExpression,
    UserAttributeExpression,
    PriceCondition,
    CategoryCondition,
    TimeBasedCondition,
    ProductCondition,
    AndExpression,
    OrExpression,
    NotExpression,
    RuleParser
};
