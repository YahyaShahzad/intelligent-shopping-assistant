<template>
  <div class="admin-dashboard" :class="{ 'theme-dark': darkMode }">
    <!-- Sidebar Navigation -->
    <aside class="admin-sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-header">
        <h2>Admin Panel</h2>
      </div>
      
      <nav class="sidebar-nav">
        <button 
          @click="currentView = 'dashboard'" 
          :class="{'active': currentView === 'dashboard'}"
          class="nav-item"
        >
          Dashboard
        </button>
        <button 
          @click="currentView = 'analytics'" 
          :class="{'active': currentView === 'analytics'}"
          class="nav-item"
        >
          Analytics
        </button>
        <button 
          @click="currentView = 'products'" 
          :class="{'active': currentView === 'products'}"
          class="nav-item"
        >
          Products
        </button>
        <button 
          @click="currentView = 'orders'" 
          :class="{'active': currentView === 'orders'}"
          class="nav-item"
        >
          Orders
        </button>
        <button 
          @click="currentView = 'users'" 
          :class="{'active': currentView === 'users'}"
          class="nav-item"
        >
          Users
        </button>
        <button 
          @click="currentView = 'lowstock'" 
          :class="{'active': currentView === 'lowstock'}"
          class="nav-item"
        >
          Low Stock
        </button>
        <button @click="handleLogout" class="nav-item logout">
          Logout
        </button>
      </nav>
    </aside>

    <!-- Mobile sidebar overlay -->
    <div v-if="sidebarOpen" class="sidebar-overlay" @click="sidebarOpen = false"></div>

    <!-- Main Content -->
    <main class="admin-main">
      <div class="admin-header">
        <button class="menu-toggle" @click="sidebarOpen = !sidebarOpen" aria-label="Toggle menu">
          <span class="bar"></span>
          <span class="bar"></span>
          <span class="bar"></span>
        </button>
        <h1>{{ viewTitle }}</h1>
        <div class="header-actions">
          <button
            class="theme-toggle"
            @click="toggleDarkMode"
            :aria-label="darkMode ? 'Switch to light mode' : 'Switch to dark mode'"
            :title="darkMode ? 'Light mode' : 'Dark mode'"
          >
            <span v-if="!darkMode">🌙</span>
            <span v-else>☀️</span>
          </button>
        </div>
      </div>

      <div class="admin-content">
        <!-- Dashboard View -->
        <div v-if="currentView === 'dashboard'" class="dashboard-view">
          <div class="stats-grid">
            <div class="stat-card">
              <h3>Total Users</h3>
              <p class="stat-number">{{ stats.totalUsers }}</p>
            </div>
            <div class="stat-card">
              <h3>Total Orders</h3>
              <p class="stat-number">{{ stats.totalOrders }}</p>
            </div>
            <div class="stat-card">
              <h3>Total Products</h3>
              <p class="stat-number">{{ stats.totalProducts }}</p>
            </div>
            <div class="stat-card">
              <h3>Total Revenue</h3>
              <p class="stat-number">${{ stats.totalRevenue.toFixed(2) }}</p>
            </div>
            <div class="stat-card warning" v-if="stats.lowStockCount > 0">
              <h3>Low Stock Items</h3>
              <p class="stat-number">{{ stats.lowStockCount }}</p>
              <button @click="currentView = 'lowstock'" class="view-btn">View</button>
            </div>
          </div>

          <div class="analytics-section">
            <h2>Order Analytics</h2>
            <div class="analytics-grid">
              <div class="analytics-card pending">
                <h4>Pending</h4>
                <p>{{ analytics.pending }}</p>
              </div>
              <div class="analytics-card processing">
                <h4>Processing</h4>
                <p>{{ analytics.processing }}</p>
              </div>
              <div class="analytics-card shipped">
                <h4>Shipped</h4>
                <p>{{ analytics.shipped }}</p>
              </div>
              <div class="analytics-card delivered">
                <h4>Delivered</h4>
                <p>{{ analytics.delivered }}</p>
              </div>
              <div class="analytics-card cancelled">
                <h4>Cancelled</h4>
                <p>{{ analytics.cancelled }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Products View -->
        <div v-if="currentView === 'products'" class="products-view">
          <div class="view-header">
            <div class="search-filters">
              <input 
                v-model="productFilters.search" 
                @input="filterProducts" 
                type="text" 
                placeholder="Search products..."
                class="search-input"
              >
              <select v-model="productFilters.category" @change="filterProducts" class="filter-select">
                <option value="">All Categories</option>
                <option value="electronics">Electronics</option>
                <option value="clothing">Clothing</option>
                <option value="books">Books</option>
                <option value="home">Home</option>
                <option value="accessories">Accessories</option>
              </select>
              <button @click="clearProductFilters" class="btn-clear" v-if="productFilters.search || productFilters.category">
                Clear Filters
              </button>
            </div>
            <div class="action-buttons">
              <button @click="exportProducts" class="btn-secondary">Export CSV</button>
              <button @click="showProductModal = true; editingProduct = null" class="btn-primary">
                Add New Product
              </button>
            </div>
          </div>

          <div class="table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="product in products" :key="product._id">
                  <td :data-label="'Image'">
                    <img 
                      v-if="product.images && product.images.length > 0" 
                      :src="product.images[0]" 
                      :alt="product.name"
                      class="product-thumbnail"
                      @error="handleImageError"
                    />
                    <div v-else class="thumbnail-placeholder">📦</div>
                  </td>
                  <td :data-label="'Name'">{{ product.name }}</td>
                  <td :data-label="'Category'">{{ product.category }}</td>
                  <td :data-label="'Price'">${{ product.price }}</td>
                  <td :data-label="'Stock'">{{ product.stock }}</td>
                  <td :data-label="'Actions'">
                    <button @click="editProduct(product)" class="btn-edit">Edit</button>
                    <button @click="handleDeleteProduct(product._id)" class="btn-delete">Delete</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Orders View -->
        <div v-if="currentView === 'orders'" class="orders-view">
          <div class="view-header">
            <div class="search-filters">
              <input 
                v-model="orderFilters.search" 
                @input="filterOrders" 
                type="text" 
                placeholder="Search orders..."
                class="search-input"
              >
              <select v-model="orderFilters.status" @change="filterOrders" class="filter-select">
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select v-model="orderFilters.category" @change="filterOrders" class="filter-select">
                <option value="">All Categories</option>
                <option value="electronics">Electronics</option>
                <option value="clothing">Clothing</option>
                <option value="books">Books</option>
                <option value="home">Home</option>
                <option value="accessories">Accessories</option>
              </select>
              <button @click="clearOrderFilters" class="btn-clear" v-if="orderFilters.search || orderFilters.status || orderFilters.category">
                Clear Filters
              </button>
            </div>
            <button @click="exportOrders" class="btn-secondary">Export CSV</button>
          </div>
          
          <div class="table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in orders" :key="order._id">
                  <td :data-label="'Order ID'">{{ order._id.substring(0, 8) }}</td>
                  <td :data-label="'Customer'">{{ order.user?.name || 'N/A' }}</td>
                  <td :data-label="'Total'">${{ order.total.toFixed(2) }}</td>
                  <td :data-label="'Status'">
                    <span :class="'status-badge ' + order.status">
                      {{ order.status }}
                    </span>
                  </td>
                  <td :data-label="'Date'">{{ formatDate(order.createdAt) }}</td>
                  <td :data-label="'Actions'">
                    <button 
                      @click="editOrder(order)"
                      class="btn-edit"
                      title="Edit order details"
                      style="margin-right: 8px; margin-bottom: 4px;"
                    >
                      Edit
                    </button>
                    <select 
                      @change="updateStatus(order._id, $event.target.value)"
                      :value="order.status"
                      class="status-select"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Users View -->
        <div v-if="currentView === 'users'" class="users-view">
          <div class="view-header">
            <div class="search-filters">
              <input 
                v-model="userFilters.search" 
                @input="filterUsers" 
                type="text" 
                placeholder="Search users..."
                class="search-input"
              >
              <select v-model="userFilters.isStudent" @change="filterUsers" class="filter-select">
                <option value="">All Users</option>
                <option value="true">Students Only</option>
                <option value="false">Non-Students</option>
              </select>
              <button @click="clearUserFilters" class="btn-clear" v-if="userFilters.search || userFilters.isStudent">
                Clear Filters
              </button>
            </div>
            <button @click="exportUsers" class="btn-secondary">Export CSV</button>
          </div>
          
          <div class="table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Student</th>
                  <th>Admin</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user._id">
                  <td :data-label="'Name'">{{ user.name }}</td>
                  <td :data-label="'Email'">{{ user.email }}</td>
                  <td :data-label="'Student'">{{ user.isStudent ? 'Yes' : 'No' }}</td>
                  <td :data-label="'Admin'">{{ user.isAdmin ? 'Yes' : 'No' }}</td>
                  <td :data-label="'Joined'">{{ formatDate(user.createdAt) }}</td>
                  <td :data-label="'Actions'">
                    <button 
                      @click="editUser(user)"
                      class="btn-edit"
                      title="Edit user"
                      style="margin-right: 8px;"
                    >
                      Edit
                    </button>
                    <button 
                      @click="viewUserOrders(user)"
                      class="btn-edit"
                      title="View orders"
                      style="margin-right: 8px;"
                    >
                      Orders
                    </button>
                    <button 
                      v-if="!user.isAdmin"
                      @click="handleDeleteUser(user._id, user.name)"
                      class="btn-delete"
                      title="Delete user"
                    >
                      Delete
                    </button>
                    <span v-else class="text-muted">Protected</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Analytics View -->
        <div v-if="currentView === 'analytics'" class="analytics-view">
          <div class="analytics-cards">
            <div class="analytics-section">
              <h2>Sales Analytics</h2>
              <div v-if="salesAnalytics" class="sales-stats">
                <div class="stat-card">
                  <h3>Total Revenue</h3>
                  <p class="stat-number">${{ salesAnalytics.totalRevenue.toFixed(2) }}</p>
                </div>
                <div class="stat-card">
                  <h3>Total Orders</h3>
                  <p class="stat-number">{{ salesAnalytics.totalOrders }}</p>
                </div>
                <div class="stat-card">
                  <h3>Avg Order Value</h3>
                  <p class="stat-number">${{ salesAnalytics.averageOrderValue.toFixed(2) }}</p>
                </div>
              </div>

              <div v-if="salesAnalytics" class="top-products">
                <h3>Top Selling Products</h3>
                <div class="product-list">
                  <div v-for="item in salesAnalytics.topProducts" :key="item.product._id" class="product-item">
                    <span class="product-name">{{ item.product.name }}</span>
                    <span class="product-sales">{{ item.quantity }} sold</span>
                    <span class="product-revenue">${{ item.revenue.toFixed(2) }}</span>
                  </div>
                </div>
              </div>

              <div class="revenue-sparkline" v-if="revenueBars.length">
                <h3>Revenue (last 14 days)</h3>
                <div class="sparkline">
                  <div class="sparkline-bars">
                    <div
                      v-for="b in revenueBars"
                      :key="b.date"
                      class="sparkline-bar"
                      :style="{ height: b.percent + '%'}"
                      :title="b.dateLabel + ': $' + b.value.toFixed(2)"
                    ></div>
                  </div>
                  <div class="sparkline-legend">
                    <span>{{ revenueBars[0].dateLabel }}</span>
                    <span>{{ revenueBars[revenueBars.length - 1].dateLabel }}</span>
                  </div>
                </div>
              </div>

              <div v-if="salesAnalytics" class="category-sales">
                <h3>Sales by Category</h3>
                <div class="category-list">
                  <div v-for="(revenue, category) in salesAnalytics.categorySales" :key="category" class="category-item">
                    <span class="category-name">{{ category }}</span>
                    <span class="category-revenue">${{ revenue.toFixed(2) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="analytics-section">
              <h2>Customer Analytics</h2>
              <div v-if="customerAnalytics" class="customer-stats">
                <div class="stat-card">
                  <h3>Total Customers</h3>
                  <p class="stat-number">{{ customerAnalytics.totalCustomers }}</p>
                </div>
                <div class="stat-card">
                  <h3>Customers with Orders</h3>
                  <p class="stat-number">{{ customerAnalytics.customersWithOrders }}</p>
                </div>
                <div class="stat-card">
                  <h3>Conversion Rate</h3>
                  <p class="stat-number">{{ customerAnalytics.conversionRate }}%</p>
                </div>
              </div>

              <div v-if="customerAnalytics" class="top-customers">
                <h3>Top Customers</h3>
                <div class="customer-list">
                  <div v-for="item in customerAnalytics.topCustomers" :key="item.user._id" class="customer-item">
                    <span class="customer-name">{{ item.user.name }}</span>
                    <span class="customer-orders">{{ item.orderCount }} orders</span>
                    <span class="customer-spent">${{ item.totalSpent.toFixed(2) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="analytics-section">
            <h2>Order Status Overview</h2>
            <div class="mini-bars" v-if="statusBars.length">
              <div class="mini-bar" v-for="b in statusBars" :key="b.label">
                <span class="mini-bar-label">{{ b.label }}</span>
                <div class="mini-bar-track">
                  <div class="mini-bar-fill" :style="{ width: b.percent + '%', background: b.color }"></div>
                </div>
                <span class="mini-bar-value">{{ b.value }}</span>
              </div>
            </div>
            <p v-else class="text-muted">No status data available</p>
          </div>
        </div>

        <!-- Low Stock View -->
        <div v-if="currentView === 'lowstock'" class="lowstock-view">
          <div class="view-header">
            <h2>Low Stock Products (Stock < 10)</h2>
            <button @click="loadLowStockProducts" class="btn-secondary">Refresh</button>
          </div>
          
          <div class="table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="product in lowStockProducts" :key="product._id" class="low-stock-row">
                  <td :data-label="'Name'">{{ product.name }}</td>
                  <td :data-label="'Category'">{{ product.category }}</td>
                  <td :data-label="'Price'">${{ product.price }}</td>
                  <td :data-label="'Stock'" class="stock-warning">{{ product.stock }}</td>
                  <td :data-label="'Actions'">
                    <button @click="editProduct(product)" class="btn-edit">Restock</button>
                  </td>
                </tr>
                <tr v-if="lowStockProducts.length === 0">
                  <td colspan="5" class="text-center">No low stock products</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>

    <!-- User Orders Modal -->
    <div v-if="showUserOrdersModal" class="modal-overlay" @click="closeUserOrdersModal">
      <div class="modal-content" @click.stop style="max-width: 900px;">
        <h2>Order History - {{ selectedUser?.name }}</h2>
        <p style="color: #7f8c8d; margin-bottom: 20px;">{{ selectedUser?.email }}</p>
        
        <div v-if="loadingUserOrders" style="text-align: center; padding: 40px;">
          <p>Loading orders...</p>
        </div>
        
        <div v-else-if="userOrders.length === 0" style="text-align: center; padding: 40px; color: #95a5a6;">
          <p>No orders found for this user</p>
        </div>
        
        <div v-else class="table-container">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in userOrders" :key="order._id">
                <td :data-label="'Order ID'">{{ order.orderId || (order._id ? order._id.substring(0, 8) : 'N/A') }}</td>
                <td :data-label="'Date'">{{ formatDate(order.createdAt) }}</td>
                <td :data-label="'Items'">{{ order.items?.length || 0 }} items</td>
                <td :data-label="'Total'">${{ order.total?.toFixed(2) || '0.00' }}</td>
                <td :data-label="'Status'">
                  <span :class="'status-badge status-' + order.status">
                    {{ order.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div style="margin-top: 20px; text-align: right;">
          <button @click="closeUserOrdersModal" class="btn-secondary">Close</button>
        </div>
      </div>
    </div>

    <!-- Product Modal -->
    <div v-if="showProductModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h2>{{ editingProduct ? 'Edit Product' : 'Add New Product' }}</h2>
        <form @submit.prevent="saveProduct">
          <div class="form-group">
            <label>Product Name *</label>
            <input v-model="productForm.name" type="text" required>
          </div>
          
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="productForm.description" rows="3"></textarea>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Price *</label>
              <input v-model="productForm.price" type="number" step="0.01" required>
            </div>
            
            <div class="form-group">
              <label>Stock *</label>
              <input v-model="productForm.stock" type="number" required>
            </div>
          </div>
          
          <div class="form-group">
            <label>Category *</label>
            <select v-model="productForm.category" required>
              <option value="">Select Category</option>
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing</option>
              <option value="home-garden">Home & Garden</option>
              <option value="books">Books</option>
              <option value="sports">Sports</option>
              <option value="toys">Toys</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Image URL</label>
            <input v-model="productForm.image" type="text" placeholder="https://example.com/image.jpg">
            <small style="color: #666; display: block; margin-top: 4px;">Paste a direct image URL (e.g., from Imgur, ImgBB)</small>
          </div>
          
          <div class="form-group" v-if="productForm.image">
            <label>Image Preview</label>
            <div class="image-preview">
              <img :src="productForm.image" :alt="productForm.name" @error="handleImagePreviewError" />
            </div>
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">Save Product</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Order Modal -->
    <div v-if="showEditOrderModal" class="modal-overlay" @click="closeEditOrderModal">
      <div class="modal-content" @click.stop>
        <h2>Edit Order Details</h2>
        <form @submit.prevent="saveOrder">
          <h3 style="margin-top: 0; color: #666;">Billing Information</h3>
          
          <div class="form-group">
            <label>Name *</label>
            <input v-model="orderForm.billingInfo.name" type="text" required>
          </div>
          
          <div class="form-group">
            <label>Email *</label>
            <input v-model="orderForm.billingInfo.email" type="email" required>
          </div>
          
          <div class="form-group">
            <label>Phone *</label>
            <input v-model="orderForm.billingInfo.phone" type="tel" required>
          </div>
          
          <div class="form-group">
            <label>Address *</label>
            <input v-model="orderForm.billingInfo.address" type="text" required>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>City *</label>
              <input v-model="orderForm.billingInfo.city" type="text" required>
            </div>
            
            <div class="form-group">
              <label>Postal Code *</label>
              <input v-model="orderForm.billingInfo.postalCode" type="text" required>
            </div>
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="closeEditOrderModal" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">Save Order</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit User Modal -->
    <div v-if="showEditUserModal" class="modal-overlay" @click="closeEditUserModal">
      <div class="modal-content" @click.stop>
        <h2>Edit User</h2>
        <form @submit.prevent="saveUser">
          <div class="form-group">
            <label>Name *</label>
            <input v-model="userForm.name" type="text" required>
          </div>
          
          <div class="form-group">
            <label>Email *</label>
            <input v-model="userForm.email" type="email" required>
          </div>
          
          <div class="form-group" style="display: flex; align-items: center;">
            <label style="display: flex; align-items: center; cursor: pointer; margin: 0;">
              <input v-model="userForm.isStudent" type="checkbox" style="margin-right: 8px;">
              <span>Student</span>
            </label>
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="closeEditUserModal" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">Save User</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="error-toast">
      {{ error }}
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  name: 'AdminDashboard',
  
  data() {
    return {
      sidebarOpen: false,
      darkMode: false,
      currentView: 'dashboard',
      showProductModal: false,
      editingProduct: null,
      productForm: {
        name: '',
        description: '',
        price: '',
        category: '',
        stock: '',
        image: 'https://via.placeholder.com/300'
      },
      showUserOrdersModal: false,
      selectedUser: null,
      userOrders: [],
      loadingUserOrders: false,
      showEditUserModal: false,
      editingUser: null,
      userForm: {
        name: '',
        email: '',
        isStudent: false
      },
      showEditOrderModal: false,
      editingOrder: null,
      orderForm: {
        billingInfo: {
          name: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          postalCode: ''
        }
      },
      editingOrder: null,
      productFilters: {
        search: '',
        category: '',
        minPrice: '',
        maxPrice: '',
        minStock: '',
        maxStock: ''
      },
      orderFilters: {
        search: '',
        status: '',
        category: '',
        startDate: '',
        endDate: ''
      },
      userFilters: {
        search: '',
        isStudent: ''
      }
    }
  },
  
  computed: {
    ...mapState('admin', [
      'stats', 
      'analytics', 
      'products', 
      'orders', 
      'users', 
      'lowStockProducts',
      'salesAnalytics',
      'customerAnalytics',
      'loading', 
      'error'
    ]),
    
    viewTitle() {
      const titles = {
        dashboard: 'Dashboard Overview',
        analytics: 'Analytics & Reports',
        products: 'Product Management',
        orders: 'Order Management',
        users: 'User Management',
        lowstock: 'Low Stock Alert'
      }
      return titles[this.currentView] || 'Dashboard'
    },

    statusBars() {
      const items = [
        { label: 'Pending', key: 'pending', color: '#f39c12' },
        { label: 'Processing', key: 'processing', color: '#3498db' },
        { label: 'Shipped', key: 'shipped', color: '#9b59b6' },
        { label: 'Delivered', key: 'delivered', color: '#27ae60' },
        { label: 'Cancelled', key: 'cancelled', color: '#e74c3c' }
      ]
      const data = items.map(i => ({
        label: i.label,
        value: Number(this.analytics?.[i.key] || 0),
        color: i.color
      }))
      const max = Math.max(1, ...data.map(d => d.value))
      return data.map(d => ({ ...d, percent: Math.round((d.value / max) * 100) }))
    },

    revenueBars() {
      // Aggregate last 14 days revenue from orders list
      const days = 14
      const today = new Date()
      const map = new Map()
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(today.getDate() - i)
        const key = d.toISOString().slice(0, 10)
        map.set(key, { date: key, value: 0, dateLabel: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) })
      }
      for (const o of this.orders || []) {
        if (!o?.createdAt || !o?.total) continue
        const key = new Date(o.createdAt).toISOString().slice(0, 10)
        if (map.has(key)) {
          const cur = map.get(key)
          cur.value += Number(o.total) || 0
        }
      }
      const arr = Array.from(map.values())
      const max = Math.max(1, ...arr.map(x => x.value))
      return arr.map(x => ({ ...x, percent: Math.round((x.value / max) * 100) }))
    }
  },
  
  watch: {
    currentView(newView) {
      if (newView === 'analytics') {
        this.loadAnalytics()
      } else if (newView === 'lowstock') {
        this.loadLowStockProducts()
      }
    }
  },
  
  async mounted() {
    try {
      const stored = localStorage.getItem('adminTheme')
      this.darkMode = stored === 'dark'
    } catch (e) {}
    await this.loadDashboardData()
  },
  
  methods: {
    ...mapActions('admin', [
      'fetchStats',
      'fetchAnalytics',
      'fetchProducts',
      'createProduct',
      'updateProduct',
      'fetchOrders',
      'updateOrderStatus',
      'fetchUsers',
      'updateUser',
      'deleteUser',
      'fetchLowStockProducts',
      'fetchSalesAnalytics',
      'fetchCustomerAnalytics'
    ]),
    ...mapActions('auth', ['logout']),
    
    async loadDashboardData() {
      try {
        await Promise.all([
          this.fetchStats(),
          this.fetchAnalytics(),
          this.fetchProducts(),
          this.fetchOrders(),
          this.fetchUsers()
        ])
        
        // Load analytics if on analytics view
        if (this.currentView === 'analytics') {
          await this.loadAnalytics()
        }
        
        // Load low stock if on low stock view
        if (this.currentView === 'lowstock') {
          await this.loadLowStockProducts()
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      }
    },
    
    toggleDarkMode() {
      this.darkMode = !this.darkMode
      try {
        const mode = this.darkMode ? 'dark' : 'light'
        localStorage.setItem('adminTheme', mode)
        localStorage.setItem('appTheme', mode)
        window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: mode } }))
      } catch (e) {}
    },

    async loadAnalytics() {
      try {
        await Promise.all([
          this.fetchSalesAnalytics(),
          this.fetchCustomerAnalytics()
        ])
      } catch (error) {
        console.error('Error loading analytics:', error)
      }
    },
    
    async loadLowStockProducts() {
      try {
        await this.fetchLowStockProducts(10)
      } catch (error) {
        console.error('Error loading low stock products:', error)
      }
    },
    
    async filterProducts() {
      const filters = {}
      if (this.productFilters.search) filters.search = this.productFilters.search
      if (this.productFilters.category) filters.category = this.productFilters.category
      if (this.productFilters.minPrice) filters.minPrice = this.productFilters.minPrice
      if (this.productFilters.maxPrice) filters.maxPrice = this.productFilters.maxPrice
      if (this.productFilters.minStock !== '') filters.minStock = this.productFilters.minStock
      if (this.productFilters.maxStock !== '') filters.maxStock = this.productFilters.maxStock
      
      await this.fetchProducts(filters)
    },
    
    clearProductFilters() {
      this.productFilters = {
        search: '',
        category: '',
        minPrice: '',
        maxPrice: '',
        minStock: '',
        maxStock: ''
      }
      this.fetchProducts()
    },
    
    async filterOrders() {
      const filters = {}
      if (this.orderFilters.search) filters.search = this.orderFilters.search
      if (this.orderFilters.status) filters.status = this.orderFilters.status
      if (this.orderFilters.category) filters.category = this.orderFilters.category
      if (this.orderFilters.startDate) filters.startDate = this.orderFilters.startDate
      if (this.orderFilters.endDate) filters.endDate = this.orderFilters.endDate
      
      await this.fetchOrders(filters)
    },
    
    clearOrderFilters() {
      this.orderFilters = {
        search: '',
        status: '',
        category: '',
        startDate: '',
        endDate: ''
      }
      this.fetchOrders()
    },
    
    async filterUsers() {
      const filters = {}
      if (this.userFilters.search) filters.search = this.userFilters.search
      if (this.userFilters.isStudent !== '') filters.isStudent = this.userFilters.isStudent
      
      await this.fetchUsers(filters)
    },
    
    clearUserFilters() {
      this.userFilters = {
        search: '',
        isStudent: ''
      }
      this.fetchUsers()
    },
    
    async exportProducts() {
      try {
        await this.$store.dispatch('admin/exportProducts')
      } catch (error) {
        alert('Failed to export products')
      }
    },
    
    async exportOrders() {
      try {
        const filters = {}
        if (this.orderFilters.startDate) filters.startDate = this.orderFilters.startDate
        if (this.orderFilters.endDate) filters.endDate = this.orderFilters.endDate
        
        await this.$store.dispatch('admin/exportOrders', filters)
      } catch (error) {
        alert('Failed to export orders')
      }
    },
    
    async exportUsers() {
      try {
        await this.$store.dispatch('admin/exportUsers')
      } catch (error) {
        alert('Failed to export users')
      }
    },
    
    editProduct(product) {
      this.editingProduct = product
      this.productForm = {
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        stock: product.stock,
        image: product.images && product.images.length > 0 ? product.images[0] : ''
      }
      this.showProductModal = true
    },
    
    handleImageError(event) {
      event.target.style.display = 'none'
      event.target.nextElementSibling?.classList.add('show')
    },
    
    handleImagePreviewError(event) {
      event.target.src = 'https://via.placeholder.com/300?text=Invalid+Image+URL'
    },
    
    async saveProduct() {
      try {
        console.log('Saving product...', {
          editing: !!this.editingProduct,
          formData: this.productForm
        })
        
        if (this.editingProduct) {
          console.log('Updating product:', this.editingProduct._id)
          await this.updateProduct({
            id: this.editingProduct._id,
            productData: this.productForm
          })
          alert('Product updated successfully!')
        } else {
          console.log('Creating new product with data:', this.productForm)
          const result = await this.createProduct(this.productForm)
          console.log('Product created:', result)
          alert('Product created successfully!')
        }
        this.closeModal()
        await this.fetchProducts()
      } catch (error) {
        console.error('Error saving product:', error)
        alert(`Failed to save product: ${error.message || 'Unknown error'}`)
      }
    },
    
    async handleDeleteProduct(productId) {
      if (confirm('Are you sure you want to delete this product?')) {
        try {
          await this.$store.dispatch('admin/deleteProduct', productId)
          await this.fetchProducts()
        } catch (error) {
          console.error('Error deleting product:', error)
        }
      }
    },
    
    async updateStatus(orderId, newStatus) {
      try {
        await this.updateOrderStatus({ orderId, status: newStatus })
        await this.fetchAnalytics()
      } catch (error) {
        console.error('Error updating order status:', error)
      }
    },
    
    closeModal() {
      this.showProductModal = false
      this.editingProduct = null
      this.productForm = {
        name: '',
        description: '',
        price: '',
        category: '',
        stock: '',
        image: 'https://via.placeholder.com/300'
      }
    },
    
    async handleLogout() {
      await this.logout()
      this.$router.push('/auth')
    },
    
    async handleDeleteUser(userId, userName) {
      if (!confirm(`Are you sure you want to delete user "${userName}"?`)) {
        return
      }
      
      try {
        await this.deleteUser(userId)
        alert('User deleted successfully')
      } catch (error) {
        alert(error.message || 'Failed to delete user')
      }
    },
    
    async viewUserOrders(user) {
      this.selectedUser = user
      this.showUserOrdersModal = true
      this.loadingUserOrders = true
      this.userOrders = []
      
      try {
        const api = require('@/services/api').default
        const response = await api.get(`/orders/user/${user._id}`)
        this.userOrders = response.data.orders || []
      } catch (error) {
        console.error('Error fetching user orders:', error)
        alert('Failed to load user orders')
      } finally {
        this.loadingUserOrders = false
      }
    },
    
    closeUserOrdersModal() {
      this.showUserOrdersModal = false
      this.selectedUser = null
      this.userOrders = []
    },
    
    editUser(user) {
      this.editingUser = user
      this.userForm = {
        name: user.name,
        email: user.email,
        isStudent: user.isStudent
      }
      this.showEditUserModal = true
    },
    
    closeEditUserModal() {
      this.showEditUserModal = false
      this.editingUser = null
      this.userForm = {
        name: '',
        email: '',
        isStudent: false
      }
    },
    
    async saveUser() {
      try {
        await this.updateUser({
          userId: this.editingUser._id,
          userData: this.userForm
        })
        alert('User updated successfully')
        this.closeEditUserModal()
      } catch (error) {
        alert(error.message || 'Failed to update user')
      }
    },
    
    editOrder(order) {
      this.editingOrder = order
      this.orderForm = {
        billingInfo: {
          name: order.billingInfo?.name || '',
          email: order.billingInfo?.email || '',
          phone: order.billingInfo?.phone || '',
          address: order.billingInfo?.address || '',
          city: order.billingInfo?.city || '',
          postalCode: order.billingInfo?.postalCode || ''
        }
      }
      this.showEditOrderModal = true
    },
    
    closeEditOrderModal() {
      this.showEditOrderModal = false
      this.editingOrder = null
      this.orderForm = {
        billingInfo: {
          name: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          postalCode: ''
        }
      }
    },
    
    async saveOrder() {
      try {
        const api = require('@/services/api').default
        await api.put(`/admin/orders/${this.editingOrder._id}`, this.orderForm)
        alert('Order updated successfully')
        this.closeEditOrderModal()
        await this.fetchOrders()
      } catch (error) {
        console.error('Error updating order:', error)
        alert(error.response?.data?.message || 'Failed to update order')
      }
    },
    
    formatDate(date) {
      return new Date(date).toLocaleDateString()
    }
  }
}
</script>

<style scoped>
/* Admin Dashboard Layout */
.admin-dashboard {
  display: flex;
  min-height: 100vh;
  background: #f5f7fa;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* Sidebar */
.admin-sidebar {
  width: 250px;
  background: #2c3e50;
  color: white;
  box-shadow: 2px 0 10px rgba(0,0,0,0.1);
}

/* Mobile/Tablet sidebar behavior */
@media (max-width: 1024px) {
  .admin-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    z-index: 1200;
  }
  .admin-sidebar.open {
    transform: translateX(0);
  }
  .sidebar-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    z-index: 1100;
  }
}

.sidebar-header {
  padding: 20px;
  background: #34495e;
  border-bottom: 1px solid #3d566e;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #ecf0f1;
}

.sidebar-nav {
  padding: 20px 0;
}

.nav-item {
  width: 100%;
  padding: 15px 20px;
  background: none;
  border: none;
  color: #ecf0f1;
  text-align: left;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1rem;
}

.nav-item:hover {
  background: #34495e;
}

.nav-item.active {
  background: #3498db;
  border-left: 4px solid #2980b9;
}

.nav-item.logout {
  margin-top: 20px;
  color: #e74c3c;
}

.nav-item.logout:hover {
  background: #c0392b;
  color: white;
}

/* Main Content */
.admin-main {
  flex: 1;
  overflow-y: auto;
}

.admin-header {
  background: white;
  padding: 20px 30px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: space-between;
}

.admin-header h1 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.8rem;
}

.menu-toggle {
  display: none;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background: #fff;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.menu-toggle .bar {
  display: block;
  width: 20px;
  height: 2px;
  background: #2c3e50;
}
@media (max-width: 1024px) {
  .menu-toggle {
    display: inline-flex;
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.theme-toggle {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.admin-content {
  padding: 30px;
}

@media (max-width: 600px) {
  .admin-content {
    padding: 16px;
  }
}

/* Dashboard Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  text-align: center;
}

.stat-card h3 {
  margin: 0 0 10px 0;
  color: #7f8c8d;
  font-size: 0.9rem;
  text-transform: uppercase;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #2c3e50;
  margin: 0;
}

/* Analytics Section */
.analytics-section {
  background: white;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.analytics-section h2 {
  margin: 0 0 20px 0;
  color: #2c3e50;
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.analytics-card {
  padding: 20px;
  border-radius: 6px;
  text-align: center;
  color: white;
}

.analytics-card h4 {
  margin: 0 0 10px 0;
  font-size: 0.9rem;
  opacity: 0.9;
}

.analytics-card p {
  font-size: 1.8rem;
  font-weight: bold;
  margin: 0;
}

.analytics-card.pending { background: #f39c12; }
.analytics-card.processing { background: #3498db; }
.analytics-card.shipped { background: #9b59b6; }
.analytics-card.delivered { background: #27ae60; }
.analytics-card.cancelled { background: #e74c3c; }

/* View Header */
.view-header {
  margin-bottom: 20px;
}

/* Table */
.table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
}

.admin-table thead {
  background: #34495e;
  color: white;
}

.admin-table th {
  padding: 15px;
  text-align: left;
  font-weight: 600;
}

.admin-table td {
  padding: 15px;
  border-bottom: 1px solid #ecf0f1;
}

.admin-table tbody tr:hover {
  background: #f8f9fa;
}

/* Responsive tables */
@media (max-width: 768px) {
  .admin-table thead {
    display: none;
  }
  .admin-table, .admin-table tbody, .admin-table tr, .admin-table td {
    display: block;
    width: 100%;
  }
  .admin-table tr {
    margin-bottom: 12px;
    border: 1px solid #ecf0f1;
    border-radius: 8px;
    overflow: hidden;
  }
  .admin-table td {
    border: none;
    border-bottom: 1px solid #f0f2f5;
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }
  .admin-table td:last-child {
    border-bottom: none;
  }
  .admin-table td::before {
    content: attr(data-label);
    font-weight: 600;
    color: #7f8c8d;
  }
  .product-thumbnail, .thumbnail-placeholder {
    width: 42px;
    height: 42px;
  }
}

/* Mini bar charts */
.mini-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.mini-bar {
  display: grid;
  grid-template-columns: 110px 1fr 48px;
  align-items: center;
  gap: 10px;
}
.mini-bar-label {
  color: #34495e;
  font-weight: 600;
}
.mini-bar-track {
  height: 10px;
  border-radius: 999px;
  background: #edf2f7;
  overflow: hidden;
}
.mini-bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.4s ease;
}
.mini-bar-value {
  text-align: right;
  color: #2c3e50;
  font-weight: 700;
}

/* Status Badges */
.status-badge {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: capitalize;
  color: white;
}

.status-badge.pending { background: #f39c12; }
.status-badge.processing { background: #3498db; }
.status-badge.shipped { background: #9b59b6; }
.status-badge.delivered { background: #27ae60; }
.status-badge.cancelled { background: #e74c3c; }

.status-select {
  padding: 5px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

/* Buttons */
.btn-primary, .btn-secondary, .btn-edit, .btn-delete {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

.btn-clear {
  padding: 10px 20px;
  background: #e67e22;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.btn-clear:hover {
  background: #d35400;
}

.btn-edit {
  background: #27ae60;
  color: white;
  margin-right: 5px;
  padding: 8px 15px;
}

.btn-edit:hover {
  background: #229954;
}

.btn-delete {
  background: #e74c3c;
  color: white;
  padding: 8px 15px;
}

.btn-delete:hover {
  background: #c0392b;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h2 {
  margin: 0 0 20px 0;
  color: #2c3e50;
}

.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #2c3e50;
  font-weight: 600;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 25px;
}

/* Loading */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255,255,255,0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error Toast */
.error-toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #e74c3c;
  color: white;
  padding: 15px 25px;
  border-radius: 5px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  z-index: 2000;
}

/* Muted Text */
.text-muted {
  color: #95a5a6;
  font-style: italic;
  font-size: 0.9em;
}

/* New Styles for Enhanced Features */
.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.search-filters {
  display: flex;
  gap: 10px;
  flex: 1;
}

.search-input {
  flex: 1;
  min-width: 200px;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.filter-select {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.stat-card.warning {
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  color: white;
}

.stat-card .view-btn {
  margin-top: 10px;
  padding: 8px 16px;
  background: rgba(255,255,255,0.3);
  color: white;
  border: 1px solid white;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s;
}

.stat-card .view-btn:hover {
  background: rgba(255,255,255,0.5);
}

/* Analytics View */
.analytics-view {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.analytics-cards {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.analytics-section {
  background: white;
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.analytics-section h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #2c3e50;
}

.sales-stats, .customer-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.top-products, .category-sales, .top-customers {
  margin-top: 20px;
}

.top-products h3, .category-sales h3, .top-customers h3 {
  margin-bottom: 15px;
  color: #34495e;
}

.product-list, .category-list, .customer-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.product-item, .category-item, .customer-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #3498db;
}

.product-name, .category-name, .customer-name {
  flex: 1;
  font-weight: 600;
  color: #2c3e50;
}

.product-sales, .customer-orders {
  color: #7f8c8d;
  margin: 0 15px;
}

.product-revenue, .category-revenue, .customer-spent {
  font-weight: 700;
  color: #27ae60;
}

/* Revenue Sparkline */
.revenue-sparkline { margin-top: 20px; }
.revenue-sparkline h3 { margin-bottom: 12px; color: #34495e; }
.sparkline { display: flex; flex-direction: column; gap: 8px; }
.sparkline-bars { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 6px; align-items: end; height: 80px; }
.sparkline-bar { background: linear-gradient(180deg, #60a5fa, #2563eb); border-radius: 3px 3px 0 0; transition: height .3s ease; }
.sparkline-legend { display: flex; justify-content: space-between; color: #7f8c8d; font-size: 12px; }

/* Low Stock View */
.lowstock-view .view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.low-stock-row {
  background: #fff3cd;
}

.low-stock-row:hover {
  background: #ffe69c;
}

.stock-warning {
  color: #dc3545;
  font-weight: 700;
}

.text-center {
  text-align: center;
  padding: 20px;
  color: #7f8c8d;
}

/* Product Thumbnails */
.product-thumbnail {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.thumbnail-placeholder {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  border-radius: 4px;
  font-size: 24px;
}

/* Image Preview in Modal */
.image-preview {
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
  border: 2px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background: #f8f9fa;
}

.image-preview img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
}

.form-group small {
  font-size: 12px;
  font-style: italic;
}

/* Dark theme overrides */
.admin-dashboard.theme-dark {
  background: #0f172a;
  color: #e2e8f0;
}
.theme-dark .admin-sidebar {
  background: #111827;
  color: #e5e7eb;
}
.theme-dark .sidebar-header {
  background: #0b1220;
  border-bottom-color: #0b1220;
}
.theme-dark .nav-item { color: #e5e7eb; }
.theme-dark .nav-item:hover { background: #1f2937; }
.theme-dark .nav-item.active { background: #2563eb; border-left-color: #1d4ed8; }
.theme-dark .nav-item.logout:hover { background: #7f1d1d; }

.theme-dark .admin-header {
  background: #0b1220;
  box-shadow: none;
  border-bottom: 1px solid #1f2937;
}
.theme-dark .admin-header h1 { color: #e5e7eb; }
.theme-dark .menu-toggle { border-color: #334155; background: #0b1220; }
.theme-dark .menu-toggle .bar { background: #e5e7eb; }
.theme-dark .theme-toggle { border-color: #334155; background: #0b1220; color: #e5e7eb; }

.theme-dark .table-container,
.theme-dark .analytics-section,
.theme-dark .stat-card {
  background: #111827;
  box-shadow: none;
}
.theme-dark .stat-number { color: #e2e8f0; }
.theme-dark .analytics-section h2,
.theme-dark .product-name,
.theme-dark .category-name,
.theme-dark .customer-name { color: #e2e8f0; }

.theme-dark .admin-table thead { background: #1f2937; color: #e5e7eb; }
.theme-dark .admin-table td { border-bottom-color: #1f2937; color: #e5e7eb; }
.theme-dark .admin-table tbody tr:hover { background: #0b1220; }

.theme-dark .search-input,
.theme-dark .filter-select,
.theme-dark .form-group input,
.theme-dark .form-group textarea,
.theme-dark .form-group select {
  background: #0b1220;
  color: #e5e7eb;
  border-color: #1f2937;
}
.theme-dark .image-preview { background: #0b1220; border-color: #1f2937; }
.theme-dark .text-muted { color: #9ca3af; }
.theme-dark .mini-bar-label { color: #cbd5e1; }
.theme-dark .mini-bar-track { background: #0b1220; }
.theme-dark .mini-bar-value { color: #e2e8f0; }

.theme-dark .btn-primary { background: #2563eb; }
.theme-dark .btn-secondary { background: #6b7280; }
.theme-dark .btn-edit { background: #16a34a; }
.theme-dark .btn-delete { background: #dc2626; }

</style>
