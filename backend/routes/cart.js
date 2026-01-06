const express = require('express');
const router = express.Router();
const { getShoppingAssistantService } = require('../services/ShoppingAssistantService');

const service = getShoppingAssistantService();

// Add item to cart
router.post('/add', async (req, res) => {
    try {
        const { sessionId, product, userId } = req.body;
        
        if (!sessionId || !product) {
            return res.status(400).json({ error: 'sessionId and product are required' });
        }

        // Validate session belongs to user if userId provided
        if (userId) {
            const session = service.getSession(sessionId);
            if (session.userId !== userId) {
                return res.status(403).json({ error: 'Session does not belong to this user' });
            }
        }

        const result = await service.addToCart(sessionId, product);
        
        // Get updated evaluation
        const session = service.getSession(sessionId);
        const evaluation = await service.evaluateCart(session);

        res.json({
            ...result,
            evaluation
        });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get cart
router.get('/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required' });
        }

        const session = service.getSession(sessionId);
        
        if (!session) {
            console.log('Session not found:', sessionId);
            return res.json({ items: [], total: 0, subtotal: 0, totalDiscount: 0 });
        }
        
        if (!session.cart) {
            return res.json({ items: [], total: 0, subtotal: 0, totalDiscount: 0 });
        }

        res.json(session.cart.toJSON());
    } catch (error) {
        console.error('Error getting cart:', error);
        // Return empty cart instead of 404
        res.json({ items: [], total: 0, subtotal: 0, totalDiscount: 0 });
    }
});

// Update cart item
router.put('/update', async (req, res) => {
    try {
        const { sessionId, productId, quantity } = req.body;
        
        if (!sessionId || !productId || quantity === undefined) {
            return res.status(400).json({ error: 'sessionId, productId, and quantity are required' });
        }

        const result = await service.updateCartItem(sessionId, productId, quantity);
        
        // Get updated evaluation if cart has items
        let evaluation = null;
        if (result.success && result.cart) {
            const session = service.getSession(sessionId);
            evaluation = await service.evaluateCart(session);
        }

        res.json({
            ...result,
            evaluation
        });
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ error: error.message });
    }
});

// Remove item from cart
router.delete('/remove/:sessionId/:productId', async (req, res) => {
    try {
        const { sessionId, productId } = req.params;
        
        const result = await service.removeFromCart(sessionId, productId);
        res.json(result);
    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).json({ error: error.message });
    }
});

// Evaluate cart (get discounts and suggestions)
router.post('/evaluate', async (req, res) => {
    try {
        const { sessionId } = req.body;
        
        if (!sessionId) {
            return res.status(400).json({ error: 'sessionId is required' });
        }

        const session = service.getSession(sessionId);
        const evaluation = await service.evaluateCart(session);

        res.json(evaluation);
    } catch (error) {
        console.error('Error evaluating cart:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
