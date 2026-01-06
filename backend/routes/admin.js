const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { authenticate, isAdmin } = require('../middleware/auth');

// Apply authentication and admin check to all routes
router.use(authenticate);
router.use(isAdmin);

// ==================== DASHBOARD STATISTICS ====================

/**
 * GET /api/admin/stats
 * Get dashboard statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalOrders, totalProducts, completedOrders, lowStockProducts] = await Promise.all([
      User.countDocuments(),
      Order.countDocuments({ status: { $ne: 'cancelled' } }),
      Product.countDocuments(),
      Order.find({ status: 'delivered' }),
      Product.countDocuments({ stock: { $lt: 10 } })
    ]);

    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);

    res.json({
      totalUsers,
      totalOrders,
      totalProducts,
      totalRevenue,
      lowStockCount: lowStockProducts
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

/**
 * GET /api/admin/analytics
 * Get order analytics
 */
router.get('/analytics', async (req, res) => {
  try {
    const orders = await Order.find();

    const analytics = {
      totalOrders: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

/**
 * GET /api/admin/low-stock
 * Get low stock products
 */
router.get('/low-stock', async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 10;
    const products = await Product.find({ stock: { $lt: threshold } }).sort({ stock: 1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    res.status(500).json({ message: 'Failed to fetch low stock products' });
  }
});

/**
 * GET /api/admin/sales-analytics
 * Get sales analytics with charts data
 */
router.get('/sales-analytics', async (req, res) => {
  try {
    const orders = await Order.find({ status: 'delivered' }).populate('items.productId');
    
    // Calculate total revenue
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    
    // Get top selling products
    const productSales = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.productId?._id?.toString();
        if (productId) {
          if (!productSales[productId]) {
            productSales[productId] = {
              product: item.productId,
              quantity: 0,
              revenue: 0
            };
          }
          productSales[productId].quantity += item.quantity;
          productSales[productId].revenue += item.price * item.quantity;
        }
      });
    });
    
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
    
    // Sales by category
    const categorySales = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const category = item.productId?.category || 'Unknown';
        if (!categorySales[category]) {
          categorySales[category] = 0;
        }
        categorySales[category] += item.price * item.quantity;
      });
    });
    
    res.json({
      totalRevenue,
      totalOrders: orders.length,
      averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
      topProducts,
      categorySales
    });
  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    res.status(500).json({ message: 'Failed to fetch sales analytics' });
  }
});

/**
 * GET /api/admin/customer-analytics
 * Get customer analytics
 */
router.get('/customer-analytics', async (req, res) => {
  try {
    const orders = await Order.find({ status: { $ne: 'cancelled' } }).populate('user');
    
    const customerStats = {};
    orders.forEach(order => {
      const userId = order.user?._id?.toString();
      if (userId) {
        if (!customerStats[userId]) {
          customerStats[userId] = {
            user: order.user,
            orderCount: 0,
            totalSpent: 0
          };
        }
        customerStats[userId].orderCount++;
        if (order.status === 'delivered') {
          customerStats[userId].totalSpent += order.total;
        }
      }
    });
    
    const topCustomers = Object.values(customerStats)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);
    
    const totalCustomers = await User.countDocuments();
    const customersWithOrders = Object.keys(customerStats).length;
    
    res.json({
      topCustomers,
      totalCustomers,
      customersWithOrders,
      conversionRate: totalCustomers > 0 ? (customersWithOrders / totalCustomers * 100).toFixed(2) : 0
    });
  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    res.status(500).json({ message: 'Failed to fetch customer analytics' });
  }
});

// ==================== PRODUCT MANAGEMENT ====================

/**
 * GET /api/admin/products
 * Fetch all products with optional search/filter
 */
router.get('/products', async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, minStock, maxStock } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) {
      query.category = category;
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    if (minStock !== undefined || maxStock !== undefined) {
      query.stock = {};
      if (minStock !== undefined) query.stock.$gte = parseInt(minStock);
      if (maxStock !== undefined) query.stock.$lte = parseInt(maxStock);
    }
    
    const products = await Product.find(query);
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

/**
 * POST /api/admin/products
 * Create new product
 */
router.post('/products', async (req, res) => {
  try {
    console.log('POST /api/admin/products - Request body:', req.body);
    
    const { name, description, price, category, stock, image, images, tags } = req.body;

    // Validation
    if (!name || !price || !category) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({ message: 'Name, price, and category are required' });
    }

    // Handle images - accept both 'image' (single) and 'images' (array)
    let productImages = [];
    if (images && Array.isArray(images) && images.length > 0) {
      productImages = images;
    } else if (image) {
      productImages = [image];
    } else {
      productImages = ['https://via.placeholder.com/300'];
    }

    const product = new Product({
      name,
      description: description || '',
      price: parseFloat(price),
      category,
      stock: parseInt(stock) || 0,
      images: productImages,
      tags: tags || []
    });

    await product.save();
    console.log('Product created successfully:', product._id);
    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
});

/**
 * PUT /api/admin/products/:id
 * Update product
 */
router.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, stock, image, images, tags } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Update fields
    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (price) product.price = parseFloat(price);
    if (category) product.category = category;
    if (stock !== undefined) product.stock = parseInt(stock);
    if (tags) product.tags = tags;
    
    // Handle images - accept both 'image' (single) and 'images' (array)
    if (images && Array.isArray(images) && images.length > 0) {
      product.images = images;
    } else if (image) {
      product.images = [image];
    }

    await product.save();
    res.json({ message: 'Product updated successfully', product });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Failed to update product' });
  }
});

/**
 * DELETE /api/admin/products/:id
 * Delete product
 */
router.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

/**
 * PUT /api/admin/products/bulk/stock
 * Update stock for multiple products
 */
router.put('/products/bulk/stock', async (req, res) => {
  try {
    const { updates } = req.body; // Array of { productId, stock }
    
    const results = await Promise.all(
      updates.map(async ({ productId, stock }) => {
        const product = await Product.findByIdAndUpdate(
          productId,
          { stock: parseInt(stock) },
          { new: true }
        );
        return product;
      })
    );
    
    res.json({ message: 'Products updated successfully', products: results });
  } catch (error) {
    console.error('Error updating products:', error);
    res.status(500).json({ message: 'Failed to update products' });
  }
});

/**
 * DELETE /api/admin/products/bulk
 * Delete multiple products
 */
router.delete('/products/bulk', async (req, res) => {
  try {
    const { productIds } = req.body;
    
    await Product.deleteMany({ _id: { $in: productIds } });
    
    res.json({ message: 'Products deleted successfully' });
  } catch (error) {
    console.error('Error deleting products:', error);
    res.status(500).json({ message: 'Failed to delete products' });
  }
});

// ==================== ORDER MANAGEMENT ====================

/**
 * GET /api/admin/orders
 * Get all orders with user details and optional search/filter
 */
router.get('/orders', async (req, res) => {
  try {
    const { search, status, startDate, endDate, minAmount, maxAmount } = req.query;
    
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    if (minAmount || maxAmount) {
      query.total = {};
      if (minAmount) query.total.$gte = parseFloat(minAmount);
      if (maxAmount) query.total.$lte = parseFloat(maxAmount);
    }
    
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('items.product', 'name price')
      .sort({ createdAt: -1 });
    
    // Log for debugging - check if user is populated correctly
    if (orders.length > 0) {
      console.log('Sample order user data:', {
        orderId: orders[0]._id,
        user: orders[0].user,
        userId: orders[0].userId
      });
    }
    
    // If search is provided, filter by user name/email
    let filteredOrders = orders;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredOrders = orders.filter(order => 
        order.user?.name?.toLowerCase().includes(searchLower) ||
        order.user?.email?.toLowerCase().includes(searchLower) ||
        order._id.toString().includes(search)
      );
    }

    res.json(filteredOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

/**
 * GET /api/admin/orders/:id/details
 * Get detailed information for a specific order
 */
router.get('/orders/:id/details', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.productId', 'name price image category');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ message: 'Failed to fetch order details' });
  }
});

/**
 * PUT /api/admin/orders/:id/status
 * Update order status (MORE SPECIFIC ROUTE - MUST BE FIRST)
 */
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    await order.save();

    res.json({ message: 'Order status updated successfully', order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Failed to update order status' });
  }
});

/**
 * PUT /api/admin/orders/:id
 * Update order details (billing info) - GENERAL ROUTE
 */
router.put('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { billingInfo } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update billing info if provided
    if (billingInfo) {
      if (billingInfo.name !== undefined) order.billingInfo.name = billingInfo.name;
      if (billingInfo.email !== undefined) order.billingInfo.email = billingInfo.email;
      if (billingInfo.phone !== undefined) order.billingInfo.phone = billingInfo.phone;
      if (billingInfo.address !== undefined) order.billingInfo.address = billingInfo.address;
      if (billingInfo.city !== undefined) order.billingInfo.city = billingInfo.city;
      if (billingInfo.postalCode !== undefined) order.billingInfo.postalCode = billingInfo.postalCode;
    }

    order.updatedAt = new Date();
    await order.save();

    res.json({ message: 'Order updated successfully', order });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ message: 'Failed to update order' });
  }
});

/**
 * GET /api/admin/users
 * Get all users with optional search/filter
 */
router.get('/users', async (req, res) => {
  try {
    const { search, isStudent } = req.query;
    
    let query = {};
    
    if (isStudent !== undefined) {
      query.isStudent = isStudent === 'true';
    }
    
    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    
    // If search is provided, filter by name/email
    let filteredUsers = users;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = users.filter(user => 
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower)
      );
    }
    
    res.json(filteredUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

/**
 * PUT /api/admin/users/:id
 * Update user information
 */
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, isStudent } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent changing admin status through this endpoint
    if (req.body.isAdmin !== undefined && req.body.isAdmin !== user.isAdmin) {
      return res.status(403).json({ message: 'Cannot change admin status' });
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Update user fields
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (isStudent !== undefined) user.isStudent = isStudent;

    await user.save();

    res.json({ 
      message: 'User updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isStudent: user.isStudent,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete a user
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (id === req.user.id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting other admins
    if (user.isAdmin) {
      return res.status(403).json({ message: 'Cannot delete admin users' });
    }

    await User.findByIdAndDelete(id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// ==================== EXPORT FUNCTIONALITY ====================

/**
 * GET /api/admin/export/products
 * Export products as CSV
 */
router.get('/export/products', async (req, res) => {
  try {
    const products = await Product.find();
    
    // Create CSV header
    let csv = 'ID,Name,Category,Price,Stock,Description\n';
    
    // Add product rows
    products.forEach(product => {
      csv += `${product._id},`;
      csv += `"${product.name}",`;
      csv += `"${product.category}",`;
      csv += `${product.price},`;
      csv += `${product.stock},`;
      csv += `"${(product.description || '').replace(/"/g, '""')}"\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting products:', error);
    res.status(500).json({ message: 'Failed to export products' });
  }
});

/**
 * GET /api/admin/export/orders
 * Export orders as CSV
 */
router.get('/export/orders', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = {};
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    
    // Create CSV header
    let csv = 'Order ID,Customer Name,Customer Email,Status,Total,Items Count,Date\n';
    
    // Add order rows
    orders.forEach(order => {
      csv += `${order._id},`;
      csv += `"${order.user?.name || 'N/A'}",`;
      csv += `"${order.user?.email || 'N/A'}",`;
      csv += `${order.status},`;
      csv += `${order.total},`;
      csv += `${order.items.length},`;
      csv += `${order.createdAt.toISOString()}\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting orders:', error);
    res.status(500).json({ message: 'Failed to export orders' });
  }
});

/**
 * GET /api/admin/export/users
 * Export users as CSV
 */
router.get('/export/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    // Create CSV header
    let csv = 'ID,Name,Email,Student,Admin,Joined Date\n';
    
    // Add user rows
    users.forEach(user => {
      csv += `${user._id},`;
      csv += `"${user.name}",`;
      csv += `"${user.email}",`;
      csv += `${user.isStudent ? 'Yes' : 'No'},`;
      csv += `${user.isAdmin ? 'Yes' : 'No'},`;
      csv += `${user.createdAt?.toISOString() || 'N/A'}\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting users:', error);
    res.status(500).json({ message: 'Failed to export users' });
  }
});

module.exports = router;
