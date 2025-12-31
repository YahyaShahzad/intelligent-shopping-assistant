const express = require('express');
const router = express.Router();
const { getShoppingAssistantService } = require('../services/ShoppingAssistantService');

const service = getShoppingAssistantService();

// Start new session
router.post('/start', async (req, res) => {
    try {
        const { userId, userData } = req.body;
        
        if (!userId || !userData) {
            return res.status(400).json({ error: 'userId and userData are required' });
        }

        const result = await service.startSession(userId, userData);
        res.json(result);
    } catch (error) {
        console.error('Error starting session:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get session info
router.get('/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const result = service.getSession(sessionId);
        res.json(result);
    } catch (error) {
        console.error('Error getting session:', error);
        res.status(404).json({ error: error.message });
    }
});

// Update session state
router.put('/:sessionId/state', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { action, data } = req.body;

        let result;
        switch (action) {
            case 'checkout':
                result = await service.proceedToCheckout(sessionId);
                break;
            case 'complete':
                result = await service.completeCheckout(sessionId, data);
                break;
            default:
                return res.status(400).json({ error: 'Invalid action' });
        }

        res.json(result);
    } catch (error) {
        console.error('Error updating session:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get session statistics
router.get('/stats/all', (req, res) => {
    try {
        const stats = service.getStatistics();
        res.json(stats.sessions);
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
