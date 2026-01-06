/**
 * BLACKBOARD ARCHITECTURE
 * Shared knowledge base for shopping assistant system
 */

// Blackboard - Central Knowledge Repository
class Blackboard {
    constructor() {
        this.data = {
            users: new Map(),
            carts: new Map(),
            sessions: new Map(),
            inventory: new Map(),
            rules: new Map(),
            recommendations: new Map()
        };
        this.subscribers = [];
        this.changeLog = [];
        this.metadata = {
            createdAt: new Date(),
            lastUpdate: new Date(),
            updateCount: 0
        };
    }

    // Subscribe to blackboard changes
    subscribe(knowledgeSource) {
        this.subscribers.push(knowledgeSource);
    }

    unsubscribe(knowledgeSource) {
        const index = this.subscribers.indexOf(knowledgeSource);
        if (index !== -1) {
            this.subscribers.splice(index, 1);
        }
    }

    // Notify all subscribers of changes
    notify(changeType, data) {
        const change = {
            type: changeType,
            data: data,
            timestamp: new Date()
        };

        this.changeLog.push(change);
        this.metadata.lastUpdate = new Date();
        this.metadata.updateCount++;

        // Notify all knowledge sources
        this.subscribers.forEach(ks => {
            try {
                ks.onBlackboardUpdate(change);
            } catch (error) {
                console.error(`Error notifying ${ks.getName()}:`, error);
            }
        });
    }

    // User Profile Operations
    setUser(userId, userData) {
        this.data.users.set(userId, {
            ...userData,
            updatedAt: new Date()
        });
        this.notify('USER_UPDATED', { userId, userData });
    }

    getUser(userId) {
        return this.data.users.get(userId);
    }

    // Cart Operations
    setCart(userId, cartData) {
        this.data.carts.set(userId, {
            ...cartData,
            updatedAt: new Date()
        });
        this.notify('CART_UPDATED', { userId, cartData });
    }

    getCart(userId) {
        return this.data.carts.get(userId);
    }

    // Session Operations
    setSession(sessionId, sessionData) {
        this.data.sessions.set(sessionId, {
            ...sessionData,
            updatedAt: new Date()
        });
        this.notify('SESSION_UPDATED', { sessionId, sessionData });
    }

    getSession(sessionId) {
        return this.data.sessions.get(sessionId);
    }

    removeSession(sessionId) {
        this.data.sessions.delete(sessionId);
        this.notify('SESSION_REMOVED', { sessionId });
    }

    // Inventory Operations
    setInventory(productId, inventoryData) {
        this.data.inventory.set(productId, {
            ...inventoryData,
            updatedAt: new Date()
        });
        this.notify('INVENTORY_UPDATED', { productId, inventoryData });
    }

    getInventory(productId) {
        return this.data.inventory.get(productId);
    }

    getAllInventory() {
        return Array.from(this.data.inventory.values());
    }

    // Rule Operations
    addRule(ruleId, ruleData) {
        this.data.rules.set(ruleId, {
            ...ruleData,
            createdAt: new Date(),
            active: true
        });
        this.notify('RULE_ADDED', { ruleId, ruleData });
    }

    getRule(ruleId) {
        return this.data.rules.get(ruleId);
    }

    getAllRules() {
        return Array.from(this.data.rules.values()).filter(r => r.active);
    }

    removeRule(ruleId) {
        const rule = this.data.rules.get(ruleId);
        if (rule) {
            rule.active = false;
            this.notify('RULE_REMOVED', { ruleId });
        }
    }

    // Recommendation Operations
    setRecommendations(userId, recommendations) {
        this.data.recommendations.set(userId, {
            items: recommendations,
            generatedAt: new Date()
        });
        this.notify('RECOMMENDATIONS_UPDATED', { userId, recommendations });
    }

    getRecommendations(userId) {
        return this.data.recommendations.get(userId);
    }

    clearRecommendations(userId) {
        this.data.recommendations.delete(userId);
        this.notify('RECOMMENDATIONS_CLEARED', { userId });
    }

    // Query Operations
    query(queryType, params) {
        switch (queryType) {
            case 'ACTIVE_SESSIONS':
                return Array.from(this.data.sessions.values())
                    .filter(s => s.isActive);

            case 'USER_CART':
                return this.getCart(params.userId);

            case 'APPLICABLE_RULES':
                return this.getAllRules().filter(r => {
                    if (!r.condition) return true;
                    // Rule evaluation would happen here
                    return true;
                });

            case 'LOW_STOCK_ITEMS':
                return Array.from(this.data.inventory.values())
                    .filter(item => item.stock < (params.threshold || 10));

            case 'CATEGORY_PRODUCTS':
                return Array.from(this.data.inventory.values())
                    .filter(item => item.category === params.category);

            default:
                throw new Error(`Unknown query type: ${queryType}`);
        }
    }

    // Analytics
    getStatistics() {
        return {
            totalUsers: this.data.users.size,
            activeCarts: this.data.carts.size,
            activeSessions: Array.from(this.data.sessions.values())
                .filter(s => s.isActive).length,
            totalProducts: this.data.inventory.size,
            activeRules: this.getAllRules().length,
            totalChanges: this.changeLog.length,
            lastUpdate: this.metadata.lastUpdate,
            updateCount: this.metadata.updateCount
        };
    }

    // Clear old data
    cleanup(maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
        const now = Date.now();

        // Clean old sessions
        for (const [sessionId, session] of this.data.sessions) {
            if (now - session.updatedAt > maxAge && !session.isActive) {
                this.data.sessions.delete(sessionId);
            }
        }

        // Clean old recommendations
        for (const [userId, rec] of this.data.recommendations) {
            if (now - rec.generatedAt > maxAge) {
                this.data.recommendations.delete(userId);
            }
        }
    }

    // Export state for persistence
    export() {
        return {
            users: Array.from(this.data.users.entries()),
            carts: Array.from(this.data.carts.entries()),
            sessions: Array.from(this.data.sessions.entries()),
            inventory: Array.from(this.data.inventory.entries()),
            rules: Array.from(this.data.rules.entries()),
            recommendations: Array.from(this.data.recommendations.entries()),
            metadata: this.metadata
        };
    }

    // Import state from persistence
    import(state) {
        this.data.users = new Map(state.users);
        this.data.carts = new Map(state.carts);
        this.data.sessions = new Map(state.sessions);
        this.data.inventory = new Map(state.inventory);
        this.data.rules = new Map(state.rules);
        this.data.recommendations = new Map(state.recommendations);
        this.metadata = state.metadata;
    }
}

// Knowledge Source Base Class
class KnowledgeSource {
    constructor(name, blackboard) {
        this.name = name;
        this.blackboard = blackboard;
        this.enabled = true;
        this.priority = 0;
        this.executionCount = 0;
        this.lastExecution = null;
    }

    getName() {
        return this.name;
    }

    // Check if this knowledge source can contribute
    canExecute(context) {
        return this.enabled;
    }

    // Execute the knowledge source logic
    execute(context) {
        if (!this.enabled) return null;

        this.executionCount++;
        this.lastExecution = new Date();

        try {
            return this.processKnowledge(context);
        } catch (error) {
            console.error(`Error in ${this.name}:`, error);
            return null;
        }
    }

    // Override in subclasses
    processKnowledge(context) {
        throw new Error("processKnowledge() must be implemented");
    }

    // React to blackboard changes
    onBlackboardUpdate(change) {
        // Override in subclasses to react to specific changes
    }

    // Utility to write to blackboard
    updateBlackboard(updateType, data) {
        this.blackboard.notify(updateType, {
            source: this.name,
            ...data
        });
    }
}

// Control Component - Manages knowledge source execution
class BlackboardController {
    constructor(blackboard) {
        this.blackboard = blackboard;
        this.knowledgeSources = [];
        this.executionStrategy = 'PRIORITY'; // PRIORITY, ROUND_ROBIN, OPPORTUNISTIC
    }

    registerKnowledgeSource(knowledgeSource) {
        this.knowledgeSources.push(knowledgeSource);
        this.blackboard.subscribe(knowledgeSource);
        
        // Sort by priority
        this.knowledgeSources.sort((a, b) => b.priority - a.priority);
    }

    unregisterKnowledgeSource(knowledgeSource) {
        const index = this.knowledgeSources.indexOf(knowledgeSource);
        if (index !== -1) {
            this.knowledgeSources.splice(index, 1);
            this.blackboard.unsubscribe(knowledgeSource);
        }
    }

    // Execute knowledge sources based on strategy
    execute(context) {
        const results = [];

        switch (this.executionStrategy) {
            case 'PRIORITY':
                // Execute in priority order
                for (const ks of this.knowledgeSources) {
                    if (ks.canExecute(context)) {
                        const result = ks.execute(context);
                        if (result) results.push(result);
                    }
                }
                break;

            case 'OPPORTUNISTIC':
                // Execute only sources that can contribute
                const applicable = this.knowledgeSources.filter(ks => ks.canExecute(context));
                for (const ks of applicable) {
                    const result = ks.execute(context);
                    if (result) results.push(result);
                }
                break;

            case 'ROUND_ROBIN':
                // Give each source a chance
                for (const ks of this.knowledgeSources) {
                    if (ks.enabled) {
                        const result = ks.execute(context);
                        if (result) results.push(result);
                    }
                }
                break;
        }

        return results;
    }

    // Execute until solution found or max iterations
    solveLoop(context, maxIterations = 10) {
        let iteration = 0;
        let solution = null;

        while (iteration < maxIterations && !solution) {
            const results = this.execute(context);
            
            // Check if any result is a solution
            solution = results.find(r => r.isSolution);
            
            iteration++;
        }

        return {
            solution,
            iterations: iteration,
            converged: solution !== null
        };
    }

    getStatistics() {
        return {
            totalSources: this.knowledgeSources.length,
            enabledSources: this.knowledgeSources.filter(ks => ks.enabled).length,
            strategy: this.executionStrategy,
            sources: this.knowledgeSources.map(ks => ({
                name: ks.getName(),
                enabled: ks.enabled,
                priority: ks.priority,
                executionCount: ks.executionCount,
                lastExecution: ks.lastExecution
            }))
        };
    }
}

module.exports = {
    Blackboard,
    KnowledgeSource,
    BlackboardController
};
