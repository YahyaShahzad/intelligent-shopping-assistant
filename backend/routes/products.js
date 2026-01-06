const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { getShoppingAssistantService } = require('../services/ShoppingAssistantService');
const SearchService = require('../services/SearchService');
const { authenticate } = require('../middleware/auth');

const service = getShoppingAssistantService();

// ===== SPECIFIC ROUTES (Must come BEFORE /:id routes) =====

// Search with advanced filters
router.get('/search', async (req, res) => {
    try {
        const { q, category, minPrice, maxPrice, minRating, sortBy, inStockOnly, page, limit } = req.query;
        
        const filters = {
            category,
            minPrice,
            maxPrice,
            minRating,
            sortBy,
            inStockOnly,
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20
        };

        const result = await SearchService.searchProducts(q, filters);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get trending products
router.get('/trending', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 6, 50);
        const products = await SearchService.getTrendingProducts(limit);
        res.json({ data: products });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get personalized recommendations
router.get('/recommendations', authenticate, async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 6, 50);
        const products = await SearchService.getRecommendations(req.user._id, limit);
        res.json({ data: products });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get categories
router.get('/meta/categories', async (req, res) => {
    try {
        const categories = await Product.distinct('category', { active: true });
        res.json(categories);
    } catch (error) {
        console.error('Error getting categories:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get trending/popular products
router.get('/meta/trending', async (req, res) => {
    try {
        const products = await Product.find({ active: true })
            .sort({ 'ratings.count': -1, 'ratings.average': -1 })
            .limit(10);

        res.json(products);
    } catch (error) {
        console.error('Error getting trending products:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get products on sale
router.get('/meta/deals', async (req, res) => {
    try {
        const products = await Product.find({
            active: true,
            originalPrice: { $exists: true, $ne: null }
        }).sort({ price: 1 }).limit(20);

        res.json(products);
    } catch (error) {
        console.error('Error getting deals:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get products by category (with pagination)
router.get('/category/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);

        const result = await SearchService.getByCategory(category, page, limit);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== PARAMETERIZED ROUTES =====

// Get all products or filter
router.get('/', async (req, res) => {
    try {
        const { category, minPrice, maxPrice, search, limit = 50, skip = 0 } = req.query;
        
        let query = { active: true };
        
        if (category) {
            query.category = category;
        }
        
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseFloat(minPrice);
            if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }
        
        if (search) {
            query.$text = { $search: search };
        }

        const products = await Product.find(query)
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .sort({ createdAt: -1 });

        res.json(products);
    } catch (error) {
        console.error('Error getting products:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get product by ID
router.get('/:productId', async (req, res) => {
    try {
        const product = await Product.findById(req.params.productId);
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        console.error('Error getting product:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get similar products
router.get('/:productId/similar', async (req, res) => {
    try {
        const product = await Product.findById(req.params.productId);
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const similarProducts = await Product.find({
            _id: { $ne: product._id },
            $or: [
                { category: product.category },
                { tags: { $in: product.tags } }
            ],
            active: true
        }).limit(6);

        res.json(similarProducts);
    } catch (error) {
        console.error('Error getting similar products:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create product (admin)
router.post('/', async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        
        // Add to service inventory
        service.addProduct({
            id: product._id.toString(),
            ...product.toObject()
        });

        res.status(201).json(product);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update product (admin)
router.put('/:productId', async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.productId,
            req.body,
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Update service inventory
        service.addProduct({
            id: product._id.toString(),
            ...product.toObject()
        });

        res.json(product);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete product (admin)
router.delete('/:productId', async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: error.message });
    }
});

// Compare products
router.post('/compare', async (req, res) => {
    try {
        const { productIds } = req.body;
        
        if (!productIds || productIds.length < 2) {
            return res.status(400).json({ error: 'At least 2 product IDs required' });
        }

        const products = await Product.find({ _id: { $in: productIds } });
        
        const comparison = {
            products: products,
            priceRange: {
                min: Math.min(...products.map(p => p.price)),
                max: Math.max(...products.map(p => p.price)),
                average: products.reduce((sum, p) => sum + p.price, 0) / products.length
            },
            ratingRange: {
                highest: Math.max(...products.map(p => p.ratings?.average || 0)),
                lowest: Math.min(...products.map(p => p.ratings?.average || 0))
            },
            commonTags: products.reduce((common, p) => 
                common.filter(tag => p.tags.includes(tag)), 
                products[0].tags || []
            ),
            bestValue: products.reduce((best, p) => 
                (!best || (p.price < best.price && (p.ratings?.average || 0) >= (best.ratings?.average || 0))) ? p : best, 
                null
            )
        };

        res.json(comparison);
    } catch (error) {
        console.error('Error comparing products:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

