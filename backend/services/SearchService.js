// Search and filter service for production
const Product = require('../models/Product');

class SearchService {
    // Full-text search with filters
    async searchProducts(query, filters = {}) {
        try {
            let searchQuery = {};

            // Text search
            if (query && query.trim()) {
                searchQuery.$text = { $search: query };
            }

            // Category filter
            if (filters.category && filters.category !== 'all') {
                searchQuery.category = filters.category;
            }

            // Price range filter
            if (filters.minPrice || filters.maxPrice) {
                searchQuery.price = {};
                if (filters.minPrice) searchQuery.price.$gte = parseFloat(filters.minPrice);
                if (filters.maxPrice) searchQuery.price.$lte = parseFloat(filters.maxPrice);
            }

            // Rating filter
            if (filters.minRating) {
                searchQuery['ratings.average'] = { $gte: parseFloat(filters.minRating) };
            }

            // In-stock only
            if (filters.inStockOnly) {
                searchQuery.stock = { $gt: 0 };
            }

            // Pagination
            const page = Math.max(1, parseInt(filters.page) || 1);
            const limit = Math.min(50, parseInt(filters.limit) || 20);
            const skip = (page - 1) * limit;

            // Sorting
            let sortOptions = { relevance: { $meta: 'textScore' } };
            if (filters.sortBy === 'price_low') {
                sortOptions = { price: 1 };
            } else if (filters.sortBy === 'price_high') {
                sortOptions = { price: -1 };
            } else if (filters.sortBy === 'newest') {
                sortOptions = { createdAt: -1 };
            } else if (filters.sortBy === 'rating') {
                sortOptions = { 'ratings.average': -1 };
            }

            // Execute search
            const products = await Product.find(searchQuery)
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .lean()
                .exec();

            // Get total count for pagination
            const total = await Product.countDocuments(searchQuery);

            return {
                data: products,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            throw new Error(`Search failed: ${error.message}`);
        }
    }

    // Get recommendations based on browsing history
    async getRecommendations(userId, limit = 6) {
        try {
            const User = require('../models/User');
            const user = await User.findById(userId).lean();

            if (!user || !user.browsingHistory || user.browsingHistory.length === 0) {
                // Return trending products if no history
                return await Product.find({ stock: { $gt: 0 } })
                    .sort({ 'ratings.average': -1 })
                    .limit(limit)
                    .lean();
            }

            // Get categories from browsing history
            const categories = [...new Set(user.browsingHistory.map(h => h.category))];

            // Find similar products
            const recommendations = await Product.find({
                category: { $in: categories },
                stock: { $gt: 0 }
            })
                .sort({ 'ratings.average': -1 })
                .limit(limit)
                .lean();

            return recommendations;
        } catch (error) {
            throw new Error(`Recommendation failed: ${error.message}`);
        }
    }

    // Get trending products
    async getTrendingProducts(limit = 6) {
        try {
            return await Product.find({ stock: { $gt: 0 } })
                .sort({ 'ratings.average': -1, 'ratings.count': -1 })
                .limit(limit)
                .lean();
        } catch (error) {
            throw new Error(`Trending products failed: ${error.message}`);
        }
    }

    // Get products by category
    async getByCategory(category, page = 1, limit = 20) {
        try {
            const skip = (page - 1) * limit;

            const products = await Product.find({ category, stock: { $gt: 0 } })
                .sort({ 'ratings.average': -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            const total = await Product.countDocuments({ category });

            return {
                data: products,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            throw new Error(`Category fetch failed: ${error.message}`);
        }
    }

    // Create search index (run once)
    async createSearchIndex() {
        try {
            await Product.collection.createIndex({
                name: 'text',
                description: 'text',
                tags: 'text'
            });
            console.log('Search index created successfully');
        } catch (error) {
            console.error('Search index creation failed:', error);
        }
    }
}

module.exports = new SearchService();
