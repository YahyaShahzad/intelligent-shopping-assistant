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
        const { userId } = req.query; // Optional userId to validate ownership
        
        const result = service.getSession(sessionId);
        
        // If userId provided, verify session belongs to this user
        if (userId && result.userId !== userId) {
            return res.status(403).json({ error: 'Session does not belong to this user' });
        }
        
        res.json(result);
    } catch (error) {
        console.error('Error getting session:', error);
        res.status(404).json({ error: error.message });
    }
});

// Get active session for a user
router.get('/user/:userId/active', async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Get all sessions and find the most recent active one for this user
        const sessions = service.getAllSessions();
        const userSession = sessions
            .filter(s => s.userId === userId && s.currentState !== 'Completed')
            .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))[0];
        
        if (userSession) {
            res.json(userSession);
        } else {
            res.status(404).json({ error: 'No active session found for user' });
        }
    } catch (error) {
        console.error('Error getting user active session:', error);
        res.status(500).json({ error: error.message });
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
