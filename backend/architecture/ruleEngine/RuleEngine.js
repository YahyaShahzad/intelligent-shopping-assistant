/**
 * RULE-BASED SYSTEM
 * Inference engine for rule evaluation and application
 */

const { 
    ShoppingContext,
    AndExpression,
    OrExpression
} = require('../../patterns/interpreter/RuleInterpreter');

// Rule Base - Storage and management of rules
class RuleBase {
    constructor() {
        this.rules = new Map();
        this.rulesByType = new Map();
        this.rulesByPriority = [];
    }

    addRule(rule) {
        this.rules.set(rule.id, rule);
        
        // Index by type
        if (!this.rulesByType.has(rule.type)) {
            this.rulesByType.set(rule.type, []);
        }
        this.rulesByType.get(rule.type).push(rule);
        
        // Update priority index
        this.updatePriorityIndex();
    }

    removeRule(ruleId) {
        const rule = this.rules.get(ruleId);
        if (rule) {
            this.rules.delete(ruleId);
            
            // Remove from type index
            const typeRules = this.rulesByType.get(rule.type);
            if (typeRules) {
                const index = typeRules.findIndex(r => r.id === ruleId);
                if (index !== -1) {
                    typeRules.splice(index, 1);
                }
            }
            
            this.updatePriorityIndex();
        }
    }

    getRule(ruleId) {
        return this.rules.get(ruleId);
    }

    getAllRules() {
        return Array.from(this.rules.values());
    }

    getRulesByType(type) {
        return this.rulesByType.get(type) || [];
    }

    getRulesByPriority() {
        return [...this.rulesByPriority];
    }

    updatePriorityIndex() {
        this.rulesByPriority = Array.from(this.rules.values())
            .filter(r => r.active)
            .sort((a, b) => b.priority - a.priority);
    }

    clear() {
        this.rules.clear();
        this.rulesByType.clear();
        this.rulesByPriority = [];
    }

    getStatistics() {
        return {
            totalRules: this.rules.size,
            activeRules: this.rulesByPriority.length,
            ruleTypes: Array.from(this.rulesByType.keys()),
            rulesByType: Object.fromEntries(
                Array.from(this.rulesByType.entries())
                    .map(([type, rules]) => [type, rules.length])
            )
        };
    }
}

// Working Memory - Current facts and state
class WorkingMemory {
    constructor() {
        this.facts = new Map();
        this.history = [];
    }

    addFact(key, value) {
        const oldValue = this.facts.get(key);
        this.facts.set(key, value);
        
        this.history.push({
            action: 'ADD_FACT',
            key: key,
            oldValue: oldValue,
            newValue: value,
            timestamp: new Date()
        });
    }

    removeFact(key) {
        const value = this.facts.get(key);
        this.facts.delete(key);
        
        this.history.push({
            action: 'REMOVE_FACT',
            key: key,
            value: value,
            timestamp: new Date()
        });
    }

    getFact(key) {
        return this.facts.get(key);
    }

    hasFact(key) {
        return this.facts.has(key);
    }

    getAllFacts() {
        return Object.fromEntries(this.facts);
    }

    clear() {
        this.facts.clear();
        this.history = [];
    }

    getHistory() {
        return [...this.history];
    }
}

// Inference Engine - Rule evaluation and execution
class InferenceEngine {
    constructor(ruleBase, strategy = 'FORWARD') {
        this.ruleBase = ruleBase;
        this.workingMemory = new WorkingMemory();
        this.strategy = strategy; // FORWARD, BACKWARD
        this.conflictResolution = 'PRIORITY'; // PRIORITY, SPECIFICITY, RECENCY
        this.executionTrace = [];
        this.maxDepth = 10;
    }

    // Forward Chaining - Data-driven reasoning
    forwardChain(context, maxIterations = 100) {
        let iteration = 0;
        let fired = true;
        const firedRules = new Set();

        while (fired && iteration < maxIterations) {
            fired = false;
            const applicableRules = this.findApplicableRules(context);

            if (applicableRules.length > 0) {
                const ruleToFire = this.resolveConflict(applicableRules);
                
                if (ruleToFire && !firedRules.has(ruleToFire.id)) {
                    this.fireRule(ruleToFire, context);
                    firedRules.add(ruleToFire.id);
                    fired = true;
                }
            }

            iteration++;
        }

        return {
            firedRules: Array.from(firedRules),
            iterations: iteration,
            context: context
        };
    }

    // Backward Chaining - Goal-driven reasoning
    backwardChain(goal, context, depth = 0) {
        if (depth >= this.maxDepth) {
            return { success: false, reason: 'Max depth reached' };
        }

        // Check if goal is already satisfied
        if (this.isGoalSatisfied(goal, context)) {
            return { success: true, goal: goal };
        }

        // Find rules that can achieve the goal
        const applicableRules = this.findRulesForGoal(goal);

        for (const rule of applicableRules) {
            // Check if rule conditions are met
            if (rule.condition.interpret(context)) {
                this.fireRule(rule, context);
                
                if (this.isGoalSatisfied(goal, context)) {
                    return { success: true, goal: goal, rule: rule };
                }
            } else {
                // Try to satisfy rule conditions recursively
                const subgoals = this.extractSubgoals(rule.condition);
                let allSatisfied = true;

                for (const subgoal of subgoals) {
                    const result = this.backwardChain(subgoal, context, depth + 1);
                    if (!result.success) {
                        allSatisfied = false;
                        break;
                    }
                }

                if (allSatisfied) {
                    this.fireRule(rule, context);
                    if (this.isGoalSatisfied(goal, context)) {
                        return { success: true, goal: goal, rule: rule };
                    }
                }
            }
        }

        return { success: false, reason: 'No applicable rules' };
    }

    // Find rules that can be applied to current context
    findApplicableRules(context) {
        return this.ruleBase.getRulesByPriority()
            .filter(rule => {
                try {
                    return rule.active && (!rule.condition || rule.condition.interpret(context));
                } catch (error) {
                    console.error(`Error evaluating rule ${rule.id}:`, error);
                    return false;
                }
            });
    }

    // Resolve conflict when multiple rules are applicable
    resolveConflict(rules) {
        if (rules.length === 0) return null;
        if (rules.length === 1) return rules[0];

        switch (this.conflictResolution) {
            case 'PRIORITY':
                // Already sorted by priority
                return rules[0];

            case 'SPECIFICITY':
                // Rule with most conditions is most specific
                return rules.reduce((most, current) => {
                    const mostComplexity = this.getRuleComplexity(most);
                    const currentComplexity = this.getRuleComplexity(current);
                    return currentComplexity > mostComplexity ? current : most;
                });

            case 'RECENCY':
                // Most recently added rule
                return rules.reduce((most, current) => {
                    return current.createdAt > most.createdAt ? current : most;
                });

            default:
                return rules[0];
        }
    }

    getRuleComplexity(rule) {
        if (!rule.condition) return 0;
        return this.countConditions(rule.condition);
    }

    countConditions(expression) {
        if (expression instanceof AndExpression || expression instanceof OrExpression) {
            return expression.expressions.reduce((sum, expr) => sum + this.countConditions(expr), 0);
        }
        return 1;
    }

    // Fire a rule (execute its action)
    fireRule(rule, context) {
        const trace = {
            ruleId: rule.id,
            ruleName: rule.name,
            timestamp: new Date(),
            contextBefore: { ...context }
        };

        try {
            // Execute rule action
            if (rule.action) {
                this.executeAction(rule.action, context);
            }

            // Record in working memory
            this.workingMemory.addFact(`rule_fired_${rule.id}`, {
                rule: rule.name,
                timestamp: new Date()
            });

            trace.success = true;
            trace.contextAfter = { ...context };
        } catch (error) {
            trace.success = false;
            trace.error = error.message;
        }

        this.executionTrace.push(trace);
    }

    executeAction(action, context) {
        switch (action.type) {
            case 'SET_VARIABLE':
                context.setVariable(action.variable, action.value);
                break;

            case 'ADD_DISCOUNT':
                if (!context.appliedDiscounts) {
                    context.appliedDiscounts = [];
                }
                context.appliedDiscounts.push(action);
                break;

            case 'ADD_RECOMMENDATION':
                if (!context.recommendations) {
                    context.recommendations = [];
                }
                context.recommendations.push(action.item);
                break;

            case 'UPDATE_CART':
                // Cart update logic
                break;

            default:
                console.warn(`Unknown action type: ${action.type}`);
        }
    }

    isGoalSatisfied(goal, context) {
        // Check if goal condition is met
        if (typeof goal === 'function') {
            return goal(context);
        }
        if (goal.interpret) {
            return goal.interpret(context);
        }
        return false;
    }

    findRulesForGoal(goal) {
        // Find rules whose actions achieve the goal
        return this.ruleBase.getAllRules().filter(rule => {
            // This would need goal matching logic
            return true;
        });
    }

    extractSubgoals(condition) {
        // Extract sub-conditions from compound expressions
        if (condition instanceof AndExpression) {
            return condition.expressions;
        }
        return [condition];
    }

    // Explanation generation
    explainReasoning(ruleId) {
        const traces = this.executionTrace.filter(t => t.ruleId === ruleId);
        
        return traces.map(trace => ({
            rule: trace.ruleName,
            when: trace.timestamp,
            success: trace.success,
            changes: this.compareContexts(trace.contextBefore, trace.contextAfter)
        }));
    }

    compareContexts(before, after) {
        const changes = [];
        
        // Simple comparison (would need deep comparison in production)
        for (const key in after) {
            if (before[key] !== after[key]) {
                changes.push({
                    variable: key,
                    before: before[key],
                    after: after[key]
                });
            }
        }

        return changes;
    }

    reset() {
        this.workingMemory.clear();
        this.executionTrace = [];
    }

    getStatistics() {
        return {
            strategy: this.strategy,
            conflictResolution: this.conflictResolution,
            rulesFired: this.executionTrace.length,
            successfulExecutions: this.executionTrace.filter(t => t.success).length,
            failedExecutions: this.executionTrace.filter(t => !t.success).length,
            workingMemorySize: this.workingMemory.facts.size
        };
    }
}

// Rule Definition Helper
class RuleDefinition {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.type = 'GENERAL';
        this.priority = 0;
        this.condition = null;
        this.action = null;
        this.active = true;
        this.createdAt = new Date();
        this.metadata = {};
    }

    static create(id, name) {
        return new RuleDefinition(id, name);
    }

    setType(type) {
        this.type = type;
        return this;
    }

    setPriority(priority) {
        this.priority = priority;
        return this;
    }

    setCondition(condition) {
        this.condition = condition;
        return this;
    }

    setAction(action) {
        this.action = action;
        return this;
    }

    setActive(active) {
        this.active = active;
        return this;
    }

    setMetadata(key, value) {
        this.metadata[key] = value;
        return this;
    }

    build() {
        if (!this.condition) {
            throw new Error("Rule must have a condition");
        }
        if (!this.action) {
            throw new Error("Rule must have an action");
        }
        return this;
    }
}

module.exports = {
    RuleBase,
    WorkingMemory,
    InferenceEngine,
    RuleDefinition
};
