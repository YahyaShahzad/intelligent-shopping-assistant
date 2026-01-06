/**
 * Vuex Admin Module
 * Manages admin dashboard state and operations
 */

import api from '../../services/api'

const state = {
  stats: {
    totalUsers: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalRevenue: 0,
    lowStockCount: 0
  },
  analytics: {
    totalOrders: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0
  },
  products: [],
  orders: [],
  users: [],
  lowStockProducts: [],
  salesAnalytics: null,
  customerAnalytics: null,
  loading: false,
  error: null
}

const getters = {
  stats: state => state.stats,
  analytics: state => state.analytics,
  products: state => state.products,
  orders: state => state.orders,
  users: state => state.users,
  lowStockProducts: state => state.lowStockProducts,
  salesAnalytics: state => state.salesAnalytics,
  customerAnalytics: state => state.customerAnalytics,
  loading: state => state.loading,
  error: state => state.error
}

const mutations = {
  SET_LOADING(state, loading) {
    state.loading = loading
  },
  SET_ERROR(state, error) {
    state.error = error
  },
  SET_STATS(state, stats) {
    state.stats = stats
  },
  SET_ANALYTICS(state, analytics) {
    state.analytics = analytics
  },
  SET_PRODUCTS(state, products) {
    state.products = products
  },
  SET_ORDERS(state, orders) {
    state.orders = orders
  },
  SET_USERS(state, users) {
    state.users = users
  },
  SET_LOW_STOCK_PRODUCTS(state, products) {
    state.lowStockProducts = products
  },
  SET_SALES_ANALYTICS(state, analytics) {
    state.salesAnalytics = analytics
  },
  SET_CUSTOMER_ANALYTICS(state, analytics) {
    state.customerAnalytics = analytics
  },
  ADD_PRODUCT(state, product) {
    state.products.unshift(product)
  },
  UPDATE_PRODUCT(state, updatedProduct) {
    const index = state.products.findIndex(p => p._id === updatedProduct._id)
    if (index !== -1) {
      state.products.splice(index, 1, updatedProduct)
    }
  },
  DELETE_PRODUCT(state, productId) {
    state.products = state.products.filter(p => p._id !== productId)
  },
  UPDATE_ORDER_STATUS(state, { orderId, status }) {
    const order = state.orders.find(o => o._id === orderId)
    if (order) {
      order.status = status
    }
  },
  UPDATE_USER(state, updatedUser) {
    const index = state.users.findIndex(u => u._id === updatedUser._id)
    if (index !== -1) {
      state.users.splice(index, 1, updatedUser)
    }
  },
  DELETE_USER(state, userId) {
    state.users = state.users.filter(u => u._id !== userId)
  }
}

const actions = {
  /**
   * Fetch dashboard statistics
   */
  async fetchStats({ commit }) {
    try {
      commit('SET_LOADING', true)
      const response = await api.get('/admin/stats')
      commit('SET_STATS', response.data)
      commit('SET_ERROR', null)
    } catch (error) {
      console.error('Error fetching stats:', error)
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch statistics')
    } finally {
      commit('SET_LOADING', false)
    }
  },

  /**
   * Fetch order analytics
   */
  async fetchAnalytics({ commit }) {
    try {
      commit('SET_LOADING', true)
      const response = await api.get('/admin/analytics')
      commit('SET_ANALYTICS', response.data)
      commit('SET_ERROR', null)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch analytics')
    } finally {
      commit('SET_LOADING', false)
    }
  },

  /**
   * Fetch all products with optional filters
   */
  async fetchProducts({ commit }, filters = {}) {
    try {
      commit('SET_LOADING', true)
      const params = new URLSearchParams(filters).toString()
      const response = await api.get(`/admin/products${params ? '?' + params : ''}`)
      commit('SET_PRODUCTS', response.data)
      commit('SET_ERROR', null)
    } catch (error) {
      console.error('Error fetching products:', error)
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch products')
    } finally {
      commit('SET_LOADING', false)
    }
  },

  /**
   * Create new product
   */
  async createProduct({ commit }, productData) {
    try {
      commit('SET_LOADING', true)
      const response = await api.post('/admin/products', productData)
      commit('ADD_PRODUCT', response.data.product)
      commit('SET_ERROR', null)
      return response.data
    } catch (error) {
      console.error('Error creating product:', error)
      const errorMsg = error.response?.data?.message || 'Failed to create product'
      commit('SET_ERROR', errorMsg)
      throw new Error(errorMsg)
    } finally {
      commit('SET_LOADING', false)
    }
  },

  /**
   * Update product
   */
  async updateProduct({ commit }, { id, productData }) {
    try {
      commit('SET_LOADING', true)
      const response = await api.put(`/admin/products/${id}`, productData)
      commit('UPDATE_PRODUCT', response.data.product)
      commit('SET_ERROR', null)
      return response.data
    } catch (error) {
      console.error('Error updating product:', error)
      const errorMsg = error.response?.data?.message || 'Failed to update product'
      commit('SET_ERROR', errorMsg)
      throw new Error(errorMsg)
    } finally {
      commit('SET_LOADING', false)
    }
  },

  /**
   * Delete product
   */
  async deleteProduct({ commit }, productId) {
    try {
      commit('SET_LOADING', true)
      await api.delete(`/admin/products/${productId}`)
      commit('DELETE_PRODUCT', productId)
      commit('SET_ERROR', null)
    } catch (error) {
      console.error('Error deleting product:', error)
      const errorMsg = error.response?.data?.message || 'Failed to delete product'
      commit('SET_ERROR', errorMsg)
      throw new Error(errorMsg)
    } finally {
      commit('SET_LOADING', false)
    }
  },

  /**
   * Fetch all orders with optional filters
   */
  async fetchOrders({ commit }, filters = {}) {
    try {
      commit('SET_LOADING', true)
      const params = new URLSearchParams(filters).toString()
      const response = await api.get(`/admin/orders${params ? '?' + params : ''}`)
      commit('SET_ORDERS', response.data)
      commit('SET_ERROR', null)
    } catch (error) {
      console.error('Error fetching orders:', error)
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch orders')
    } finally {
      commit('SET_LOADING', false)
    }
  },

  /**
   * Update order status
   */
  async updateOrderStatus({ commit }, { orderId, status }) {
    try {
      commit('SET_LOADING', true)
      await api.put(`/admin/orders/${orderId}/status`, { status })
      commit('UPDATE_ORDER_STATUS', { orderId, status })
      commit('SET_ERROR', null)
    } catch (error) {
      console.error('Error updating order status:', error)
      const errorMsg = error.response?.data?.message || 'Failed to update order status'
      commit('SET_ERROR', errorMsg)
      throw new Error(errorMsg)
    } finally {
      commit('SET_LOADING', false)
    }
  },

  /**
   * Fetch all users with optional filters
   */
  async fetchUsers({ commit }, filters = {}) {
    try {
      commit('SET_LOADING', true)
      const params = new URLSearchParams(filters).toString()
      const response = await api.get(`/admin/users${params ? '?' + params : ''}`)
      commit('SET_USERS', response.data)
      commit('SET_ERROR', null)
    } catch (error) {
      console.error('Error fetching users:', error)
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch users')
    } finally {
      commit('SET_LOADING', false)
    }
  },

  /**
   * Update user
   */
  async updateUser({ commit }, { userId, userData }) {
    try {
      commit('SET_LOADING', true)
      const response = await api.put(`/admin/users/${userId}`, userData)
      commit('UPDATE_USER', response.data.user)
      commit('SET_ERROR', null)
    } catch (error) {
      console.error('Error updating user:', error)
      const errorMsg = error.response?.data?.message || 'Failed to update user'
      commit('SET_ERROR', errorMsg)
      throw new Error(errorMsg)
    } finally {
      commit('SET_LOADING', false)
    }
  },

  /**
   * Delete user
   */
  async deleteUser({ commit }, userId) {
    try {
      commit('SET_LOADING', true)
      await api.delete(`/admin/users/${userId}`)
      commit('DELETE_USER', userId)
      commit('SET_ERROR', null)
    } catch (error) {
      console.error('Error deleting user:', error)
      const errorMsg = error.response?.data?.message || 'Failed to delete user'
      commit('SET_ERROR', errorMsg)
      throw new Error(errorMsg)
    } finally {
      commit('SET_LOADING', false)
    }
  },

  /**
   * Fetch low stock products
   */
  async fetchLowStockProducts({ commit }, threshold = 10) {
    try {
      commit('SET_LOADING', true)
      const response = await api.get(`/admin/low-stock?threshold=${threshold}`)
      commit('SET_LOW_STOCK_PRODUCTS', response.data)
      commit('SET_ERROR', null)
    } catch (error) {
      console.error('Error fetching low stock products:', error)
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch low stock products')
    } finally {
      commit('SET_LOADING', false)
    }
  },

  /**
   * Fetch sales analytics
   */
  async fetchSalesAnalytics({ commit }) {
    try {
      commit('SET_LOADING', true)
      const response = await api.get('/admin/sales-analytics')
      commit('SET_SALES_ANALYTICS', response.data)
      commit('SET_ERROR', null)
    } catch (error) {
      console.error('Error fetching sales analytics:', error)
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch sales analytics')
    } finally {
      commit('SET_LOADING', false)
    }
  },

  /**
   * Fetch customer analytics
   */
  async fetchCustomerAnalytics({ commit }) {
    try {
      commit('SET_LOADING', true)
      const response = await api.get('/admin/customer-analytics')
      commit('SET_CUSTOMER_ANALYTICS', response.data)
      commit('SET_ERROR', null)
    } catch (error) {
      console.error('Error fetching customer analytics:', error)
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch customer analytics')
    } finally {
      commit('SET_LOADING', false)
    }
  },

  /**
   * Export products to CSV
   */
  async exportProducts() {
    try {
      const response = await api.get('/admin/export/products', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'products.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error exporting products:', error)
      throw new Error('Failed to export products')
    }
  },

  /**
   * Export orders to CSV
   */
  async exportOrders(_, filters = {}) {
    try {
      const params = new URLSearchParams(filters).toString()
      const response = await api.get(`/admin/export/orders${params ? '?' + params : ''}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'orders.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error exporting orders:', error)
      throw new Error('Failed to export orders')
    }
  },

  /**
   * Export users to CSV
   */
  async exportUsers() {
    try {
      const response = await api.get('/admin/export/users', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'users.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error exporting users:', error)
      throw new Error('Failed to export users')
    }
  },

  /**
   * Bulk update product stock
   */
  async bulkUpdateStock({ dispatch }, updates) {
    try {
      await api.put('/admin/products/bulk/stock', { updates })
      // Refresh products list
      await dispatch('fetchProducts')
    } catch (error) {
      console.error('Error bulk updating stock:', error)
      throw new Error('Failed to update product stock')
    }
  },

  /**
   * Bulk delete products
   */
  async bulkDeleteProducts({ dispatch }, productIds) {
    try {
      await api.delete('/admin/products/bulk', { data: { productIds } })
      // Refresh products list
      await dispatch('fetchProducts')
    } catch (error) {
      console.error('Error bulk deleting products:', error)
      throw new Error('Failed to delete products')
    }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
