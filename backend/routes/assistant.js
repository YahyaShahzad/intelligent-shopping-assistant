const express = require('express');
const router = express.Router();
const { getShoppingAssistantService } = require('../services/ShoppingAssistantService');

const service = getShoppingAssistantService();

// FIX: Put specific routes BEFORE parameterized routes to avoid conflicts
// Get system statistics
router.get('/system/stats', (req, res) => {
    try {
        const stats = service.getStatistics();
        res.json(stats);
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get user profile analysis (NEW)
router.get('/profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const profile = await professionalAssistant.buildUserProfile(userId);
        res.json(profile);
    } catch (error) {
        console.error('Error building user profile:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get bundle suggestions (NEW)
router.get('/bundles/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const bundles = await professionalAssistant.generateBundleSuggestions(userId);
        res.json({ bundles });
    } catch (error) {
        console.error('Error generating bundles:', error);
        res.status(500).json({ error: error.message });
    }
});

// Apply coupon to session
router.post('/coupon/apply', async (req, res) => {
    try {
        const { sessionId, couponCode } = req.body;
        const result = await service.applyCoupon(sessionId, couponCode);
        
        res.json(result);
    } catch (error) {
        console.error('Error applying coupon:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get available coupons for user (must be before /:userId route)
router.get('/coupons/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const coupons = await service.getAvailableCoupons(userId);
        
        res.json(coupons || []);
    } catch (error) {
        console.error('Error getting coupons:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get recommendations for user
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const recommendations = await service.getRecommendations(userId);
        
        res.json(recommendations || { items: [] });
    } catch (error) {
        console.error('Error getting recommendations:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
