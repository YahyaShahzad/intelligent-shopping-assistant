const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// FIX: Put specific routes BEFORE parameterized routes
// Get all orders for a user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const orders = await Order.find({ userId })
            .sort({ createdAt: -1 })
            .populate('items.productId', 'name images category');
        
        res.json({
            success: true,
            orders: orders
        });
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get specific order by orderId
router.get('/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findOne({ orderId })
            .populate('items.productId', 'name images category');
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        res.json({
            success: true,
            order: order
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all orders (admin)
router.get('/', async (req, res) => {
    try {
        const { limit = 50, skip = 0, status } = req.query;
        
        const query = status ? { status } : {};
        
        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .populate('items.productId', 'name images category');
        
        const total = await Order.countDocuments(query);
        
        res.json({
            success: true,
            orders: orders,
            total: total,
            limit: parseInt(limit),
            skip: parseInt(skip)
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update order status
router.patch('/:orderId/status', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        
        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        
        const order = await Order.findOneAndUpdate(
            { orderId },
            { status, updatedAt: new Date() },
            { new: true }
        );
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        res.json({
            success: true,
            order: order
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
