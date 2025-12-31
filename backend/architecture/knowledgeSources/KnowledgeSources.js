/**
 * KNOWLEDGE SOURCES
 * Specialized knowledge sources for the blackboard system
 */

const { KnowledgeSource } = require('../blackboard/Blackboard');
const { ShoppingContext } = require('../../patterns/interpreter/RuleInterpreter');
const { DiscountVisitor } = require('../../patterns/visitor/CartVisitor');

// Rule Interpreter Knowledge Source
class RuleInterpreterKS extends KnowledgeSource {
    constructor(blackboard, ruleEngine) {
        super('RuleInterpreter', blackboard);
        this.ruleEngine = ruleEngine;
        this.priority = 10;
    }

    canExecute(context) {
        return this.enabled && context.cart && context.user;
    }

    processKnowledge(context) {
        const { cart, user } = context;
        
        // Create shopping context
        const shoppingContext = new ShoppingContext(
            user,
            cart,
            this.blackboard.getAllInventory()
        );

        // Evaluate rules using forward chaining
        const result = this.ruleEngine.forwardChain(shoppingContext);

        // Store applicable rules in blackboard
        this.blackboard.setUser(user.id, {
            ...user,
            applicableRules: result.firedRules
        });

        return {
            source: this.name,
            applicableRules: result.firedRules,
            iterations: result.iterations
        };
    }

    onBlackboardUpdate(change) {
        if (change.type === 'CART_UPDATED' || change.type === 'USER_UPDATED') {
            // Trigger re-evaluation
            console.log(`[${this.name}] Detected ${change.type}, may need re-evaluation`);
        }
    }
}

// Discount Calculator Knowledge Source
class DiscountCalculatorKS extends KnowledgeSource {
    constructor(blackboard, discountRules) {
        super('DiscountCalculator', blackboard);
        this.discountRules = discountRules;
        this.priority = 9;
    }

    canExecute(context) {
        return this.enabled && context.cart && context.cart.items.length > 0;
    }

    processKnowledge(context) {
        const { cart, user } = context;

        // Create shopping context
        const shoppingContext = new ShoppingContext(
            user,
            cart,
            this.blackboard.getAllInventory()
        );

        // Apply discount rules using visitor pattern
        const discountVisitor = new DiscountVisitor(this.discountRules, shoppingContext);
        const result = discountVisitor.visitShoppingCart(cart);

        // Update cart with discounts
        this.blackboard.setCart(user.id, cart);

        return {
            source: this.name,
            discountApplied: result.discountAmount > 0,
            totalDiscount: result.discountAmount,
            finalTotal: result.finalTotal,
            appliedRules: result.appliedDiscounts
        };
    }

    onBlackboardUpdate(change) {
        if (change.type === 'CART_UPDATED') {
            console.log(`[${this.name}] Cart updated, recalculating discounts`);
        }
    }
}

// Personalization Engine Knowledge Source
class PersonalizationEngineKS extends KnowledgeSource {
    constructor(blackboard) {
        super('PersonalizationEngine', blackboard);
        this.priority = 7;
    }

    canExecute(context) {
        return this.enabled && context.user;
    }

    processKnowledge(context) {
        const { user, cart } = context;
        const recommendations = [];

        // Get user's data
        const userData = this.blackboard.getUser(user.id);
        const browsingHistory = userData?.browsingHistory || [];
        const purchaseHistory = userData?.purchaseHistory || [];

        // Get all products
        const allProducts = this.blackboard.getAllInventory();

        // 1. PURCHASE HISTORY-BASED RECOMMENDATIONS (Highest Priority)
        if (purchaseHistory.length > 0) {
            const purchaseRecommendations = this.getRecommendationsFromPurchases(
                purchaseHistory, allProducts, cart
            );
            recommendations.push(...purchaseRecommendations);
        }

        // 2. BROWSING HISTORY RECOMMENDATIONS
        if (browsingHistory.length > 0) {
            const viewedCategories = new Set(browsingHistory.map(h => h.category));
            
            // Recommend products from viewed categories
            const categoryRecommendations = allProducts
                .filter(p => viewedCategories.has(p.category))
                .filter(p => !cart.items.some(item => item.productId === p.id))
                .filter(p => !recommendations.some(rec => rec.product.id === p.id))
                .slice(0, 3);

            recommendations.push(...categoryRecommendations.map(p => ({
                product: p,
                reason: 'Based on your browsing history',
                score: 0.7
            })));
        }

        // 3. CART-BASED RECOMMENDATIONS
        if (cart && cart.items.length > 0) {
            const cartRecommendations = this.getCartBasedRecommendations(
                cart, allProducts
            );
            recommendations.push(...cartRecommendations.filter(
                rec => !recommendations.some(r => r.product.id === rec.product.id)
            ));
        }

        // 4. TRENDING/POPULAR PRODUCTS (if not enough recommendations)
        if (recommendations.length < 5) {
            const popularProducts = this.getPopularProducts(allProducts, cart);
            recommendations.push(...popularProducts.filter(
                rec => !recommendations.some(r => r.product.id === rec.product.id)
            ));
        }

        // Student discounts
        if (user.isStudent) {
            recommendations.forEach(rec => {
                rec.studentDiscount = true;
                rec.score += 0.1;
            });
        }

        // Sort by score and remove duplicates
        const uniqueRecommendations = this.removeDuplicates(recommendations);
        uniqueRecommendations.sort((a, b) => b.score - a.score);

        // Store in blackboard
        this.blackboard.setRecommendations(user.id, uniqueRecommendations.slice(0, 10));

        return {
            source: this.name,
            recommendationCount: uniqueRecommendations.length,
            recommendations: uniqueRecommendations.slice(0, 10)
        };
    }

    getRecommendationsFromPurchases(purchaseHistory, allProducts, cart) {
        const recommendations = [];
        const purchasedCategories = new Map();
        const purchasedTags = new Map();
        const purchasedProductIds = new Set();

        // Analyze purchase history
        purchaseHistory.forEach(purchase => {
            purchasedProductIds.add(purchase.productId);
            
            // Count categories
            const category = purchase.category || 'general';
            purchasedCategories.set(category, (purchasedCategories.get(category) || 0) + 1);
            
            // Count tags
            if (purchase.tags) {
                purchase.tags.forEach(tag => {
                    purchasedTags.set(tag, (purchasedTags.get(tag) || 0) + 1);
                });
            }
        });

        // Find products in same categories as purchased items
        const sameCategoryProducts = allProducts
            .filter(p => {
                const inCart = cart?.items.some(item => item.productId === p.id);
                const alreadyPurchased = purchasedProductIds.has(p.id);
                const hasMatchingCategory = purchasedCategories.has(p.category);
                return !inCart && !alreadyPurchased && hasMatchingCategory;
            })
            .map(p => ({
                product: p,
                reason: `Based on your previous ${p.category} purchases`,
                score: 0.95 + (purchasedCategories.get(p.category) * 0.05)
            }))
            .slice(0, 4);

        recommendations.push(...sameCategoryProducts);

        // Find products with similar tags
        if (purchasedTags.size > 0) {
            const similarTagProducts = allProducts
                .filter(p => {
                    if (!p.tags || p.tags.length === 0) return false;
                    const inCart = cart?.items.some(item => item.productId === p.id);
                    const alreadyPurchased = purchasedProductIds.has(p.id);
                    const alreadyRecommended = recommendations.some(rec => rec.product.id === p.id);
                    const hasMatchingTag = p.tags.some(tag => purchasedTags.has(tag));
                    return !inCart && !alreadyPurchased && !alreadyRecommended && hasMatchingTag;
                })
                .map(p => {
                    // Calculate tag match score
                    const matchingTags = p.tags.filter(tag => purchasedTags.has(tag));
                    const tagScore = matchingTags.reduce((sum, tag) => 
                        sum + (purchasedTags.get(tag) || 0), 0) / 10;
                    
                    return {
                        product: p,
                        reason: `Similar to items you bought: ${matchingTags.slice(0, 2).join(', ')}`,
                        score: 0.85 + tagScore
                    };
                })
                .slice(0, 3);

            recommendations.push(...similarTagProducts);
        }

        // Complementary products (accessories for purchased items)
        const complementaryProducts = this.findComplementaryProducts(
            purchaseHistory, allProducts, cart, purchasedProductIds
        );
        recommendations.push(...complementaryProducts);

        return recommendations;
    }

    findComplementaryProducts(purchaseHistory, allProducts, cart, purchasedProductIds) {
        const complementary = [];
        const complementaryMap = {
            'smartphones': ['accessories', 'audio'],
            'computers': ['accessories', 'peripherals'],
            'gaming': ['accessories', 'audio'],
            'electronics': ['accessories'],
            'audio': ['accessories']
        };

        purchaseHistory.forEach(purchase => {
            const category = purchase.category;
            const relatedCategories = complementaryMap[category] || [];

            relatedCategories.forEach(relatedCategory => {
                const related = allProducts
                    .filter(p => {
                        const inCart = cart?.items.some(item => item.productId === p.id);
                        const alreadyPurchased = purchasedProductIds.has(p.id);
                        return p.category === relatedCategory && !inCart && !alreadyPurchased;
                    })
                    .slice(0, 2);

                complementary.push(...related.map(p => ({
                    product: p,
                    reason: `Perfect accessory for your ${category} purchase`,
                    score: 0.90
                })));
            });
        });

        return complementary.slice(0, 2);
    }

    getCartBasedRecommendations(cart, allProducts) {
        const recommendations = [];
        const cartCategories = new Set(cart.items.map(item => item.category));
        
        // Find complementary products from same category
        const complementary = allProducts
            .filter(p => {
                return cartCategories.has(p.category) && 
                       !cart.items.some(item => item.productId === p.id);
            })
            .slice(0, 3);

        recommendations.push(...complementary.map(p => ({
            product: p,
            reason: 'You might also like (from your cart category)',
            score: 0.75
        })));

        return recommendations;
    }

    getPopularProducts(allProducts, cart) {
        // Get products with high ratings
        return allProducts
            .filter(p => {
                const inCart = cart?.items.some(item => item.productId === p.id);
                return !inCart && p.ratings && p.ratings.average >= 4.0;
            })
            .sort((a, b) => (b.ratings?.average || 0) - (a.ratings?.average || 0))
            .slice(0, 3)
            .map(p => ({
                product: p,
                reason: `Highly rated (${p.ratings.average.toFixed(1)} ⭐)`,
                score: 0.65
            }));
    }

    removeDuplicates(recommendations) {
        const seen = new Set();
        return recommendations.filter(rec => {
            if (seen.has(rec.product.id)) return false;
            seen.add(rec.product.id);
            return true;
        });
    }

    onBlackboardUpdate(change) {
        if (change.type === 'CART_UPDATED' || change.type === 'USER_UPDATED') {
            console.log(`[${this.name}] Updating recommendations`);
        }
    }
}

// Inventory Checker Knowledge Source
class InventoryCheckerKS extends KnowledgeSource {
    constructor(blackboard) {
        super('InventoryChecker', blackboard);
        this.priority = 8;
    }

    canExecute(context) {
        return this.enabled && context.cart;
    }

    processKnowledge(context) {
        const { cart } = context;
        const issues = [];

        // Check stock availability
        for (const item of cart.items) {
            const inventory = this.blackboard.getInventory(item.productId);
            
            if (!inventory) {
                issues.push({
                    type: 'NOT_FOUND',
                    productId: item.productId,
                    message: `Product ${item.name} not found in inventory`
                });
            } else if (inventory.stock < item.quantity) {
                issues.push({
                    type: 'LOW_STOCK',
                    productId: item.productId,
                    requested: item.quantity,
                    available: inventory.stock,
                    message: `Only ${inventory.stock} units available for ${item.name}`
                });
            }
        }

        return {
            source: this.name,
            hasIssues: issues.length > 0,
            issues: issues
        };
    }
}

// Cart Optimizer Knowledge Source
class CartOptimizerKS extends KnowledgeSource {
    constructor(blackboard, rules) {
        super('CartOptimizer', blackboard);
        this.rules = rules;
        this.priority = 6;
    }

    canExecute(context) {
        return this.enabled && context.cart && context.cart.items.length > 0;
    }

    processKnowledge(context) {
        const { cart, user } = context;
        const suggestions = [];

        // Check for bundle opportunities
        const bundleSuggestions = this.checkBundles(cart);
        suggestions.push(...bundleSuggestions);

        // Check for free shipping threshold
        const shippingSuggestions = this.checkShipping(cart);
        suggestions.push(...shippingSuggestions);

        // Check for better alternatives
        const alternativeSuggestions = this.checkAlternatives(cart);
        suggestions.push(...alternativeSuggestions);

        // Remove duplicates
        const removeDuplicates = this.checkDuplicates(cart);
        suggestions.push(...removeDuplicates);

        return {
            source: this.name,
            suggestionCount: suggestions.length,
            suggestions: suggestions,
            potentialSavings: this.calculateSavings(suggestions)
        };
    }

    checkBundles(cart) {
        const suggestions = [];
        const electronics = cart.items.filter(item => item.category === 'electronics');
        
        if (electronics.length === 1) {
            suggestions.push({
                type: 'BUNDLE',
                priority: 'HIGH',
                message: 'Add one more electronics item to get 20% off!',
                potentialSaving: cart.getSubtotal() * 0.2
            });
        }

        return suggestions;
    }

    checkShipping(cart) {
        const suggestions = [];
        const subtotal = cart.getSubtotal();
        const threshold = 50;

        if (subtotal > 0 && subtotal < threshold) {
            suggestions.push({
                type: 'FREE_SHIPPING',
                priority: 'HIGH',
                message: `Add $${(threshold - subtotal).toFixed(2)} more for FREE shipping!`,
                potentialSaving: 9.99
            });
        }

        return suggestions;
    }

    checkAlternatives(cart) {
        // Would check for cheaper alternatives
        return [];
    }

    checkDuplicates(cart) {
        const suggestions = [];
        const duplicates = cart.items.filter(item => item.quantity > 1);

        duplicates.forEach(item => {
            suggestions.push({
                type: 'DUPLICATE',
                priority: 'LOW',
                message: `You have ${item.quantity} of "${item.name}"`
            });
        });

        return suggestions;
    }

    calculateSavings(suggestions) {
        return suggestions
            .filter(s => s.potentialSaving)
            .reduce((sum, s) => sum + s.potentialSaving, 0);
    }
}

module.exports = {
    RuleInterpreterKS,
    DiscountCalculatorKS,
    PersonalizationEngineKS,
    InventoryCheckerKS,
    CartOptimizerKS
};
