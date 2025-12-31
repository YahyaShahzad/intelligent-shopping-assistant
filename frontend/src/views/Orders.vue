<template>
  <div class="orders-page">
    <div class="orders-container">
      <div class="page-header">
        <h1>📦 My Orders</h1>
        <router-link to="/products" class="shop-btn">Continue Shopping</router-link>
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Loading your orders...</p>
      </div>

      <div v-else-if="orders.length === 0" class="empty-state">
        <div class="empty-icon">🛒</div>
        <h2>No orders yet</h2>
        <p>Start shopping to see your orders here</p>
        <router-link to="/products" class="shop-btn">Browse Products</router-link>
      </div>

      <div v-else class="orders-list">
        <div v-for="order in orders" :key="order.orderId" class="order-card">
          <div class="order-header">
            <div class="order-id">
              <span class="label">Order ID:</span>
              <span class="value">{{ order.orderId }}</span>
            </div>
            <div class="order-status" :class="'status-' + order.status">
              {{ formatStatus(order.status) }}
            </div>
          </div>

          <div class="order-date">
            <span class="icon">📅</span>
            {{ formatDate(order.createdAt) }}
          </div>

          <div class="order-items">
            <div v-for="item in order.items" :key="item.productId" class="order-item">
              <div class="item-info">
                <h4>{{ item.name }}</h4>
                <p class="item-meta">
                  {{ item.category }} × {{ item.quantity }}
                </p>
              </div>
              <div class="item-price">
                ${{ (item.price * item.quantity).toFixed(2) }}
              </div>
            </div>
          </div>

          <div class="order-totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>${{ order.subtotal.toFixed(2) }}</span>
            </div>
            <div v-if="order.discount > 0" class="total-row discount">
              <span>Discount:</span>
              <span>-${{ order.discount.toFixed(2) }}</span>
            </div>
            <div class="total-row grand-total">
              <span>Total:</span>
              <span>${{ order.total.toFixed(2) }}</span>
            </div>
          </div>

          <div class="order-delivery">
            <div class="delivery-address">
              <span class="icon">📍</span>
              <div>
                <strong>{{ order.billingInfo.name }}</strong>
                <p>{{ order.billingInfo.address }}</p>
                <p>{{ order.billingInfo.city }}, {{ order.billingInfo.postalCode }}</p>
              </div>
            </div>
            <div class="delivery-contact">
              <p><span class="icon">📧</span> {{ order.billingInfo.email }}</p>
              <p><span class="icon">📱</span> {{ order.billingInfo.phone }}</p>
            </div>
          </div>

          <div class="order-actions">
            <button @click="viewOrderDetails(order)" class="view-details-btn">
              View Details
            </button>
            <button v-if="canCancelOrder(order)" @click="cancelOrder(order.orderId)" class="cancel-order-btn">
              Cancel Order
            </button>
            <button v-if="order.status === 'delivered'" class="reorder-btn">
              Order Again
            </button>
          </div>

          <div class="order-tracking">
            <div class="tracking-steps">
              <div class="step" :class="{ active: isStepActive(order, 'confirmed'), completed: isStepCompleted(order, 'confirmed') }">
                <div class="step-icon">✓</div>
                <div class="step-label">Confirmed</div>
              </div>
              <div class="step-line" :class="{ completed: isStepCompleted(order, 'processing') }"></div>
              <div class="step" :class="{ active: isStepActive(order, 'processing'), completed: isStepCompleted(order, 'processing') }">
                <div class="step-icon">📦</div>
                <div class="step-label">Processing</div>
              </div>
              <div class="step-line" :class="{ completed: isStepCompleted(order, 'shipped') }"></div>
              <div class="step" :class="{ active: isStepActive(order, 'shipped'), completed: isStepCompleted(order, 'shipped') }">
                <div class="step-icon">🚚</div>
                <div class="step-label">Shipped</div>
              </div>
              <div class="step-line" :class="{ completed: isStepCompleted(order, 'delivered') }"></div>
              <div class="step" :class="{ active: isStepActive(order, 'delivered'), completed: isStepCompleted(order, 'delivered') }">
                <div class="step-icon">✅</div>
                <div class="step-label">Delivered</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import api from '../services/api'

export default {
  name: 'OrdersPage',

  data() {
    return {
      orders: [],
      loading: false
    }
  },

  computed: {
    ...mapGetters('auth', ['currentUser'])
  },

  async mounted() {
    await this.loadOrders()
  },

  methods: {
    async loadOrders() {
      try {
        this.loading = true
        const response = await api.get(`/orders/user/${this.currentUser._id}`)
        this.orders = response.data.orders
      } catch (error) {
        console.error('Error loading orders:', error)
        alert('Failed to load orders. Please try again.')
      } finally {
        this.loading = false
      }
    },

    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    formatStatus(status) {
      const statusMap = {
        'pending': 'Pending',
        'confirmed': 'Confirmed',
        'processing': 'Processing',
        'shipped': 'Shipped',
        'delivered': 'Delivered',
        'cancelled': 'Cancelled'
      }
      return statusMap[status] || status
    },

    canCancelOrder(order) {
      return ['pending', 'confirmed'].includes(order.status)
    },

    async cancelOrder(orderId) {
      if (!confirm('Are you sure you want to cancel this order?')) {
        return
      }

      try {
        await api.patch(`/orders/${orderId}/status`, { status: 'cancelled' })
        alert('Order cancelled successfully')
        await this.loadOrders()
      } catch (error) {
        console.error('Error cancelling order:', error)
        alert('Failed to cancel order. Please try again.')
      }
    },

    viewOrderDetails(order) {
      this.$router.push(`/orders/${order.orderId}`)
    },

    isStepActive(order, status) {
      return order.status === status
    },

    isStepCompleted(order, status) {
      const statusOrder = ['confirmed', 'processing', 'shipped', 'delivered']
      const currentIndex = statusOrder.indexOf(order.status)
      const stepIndex = statusOrder.indexOf(status)
      return currentIndex > stepIndex || (order.status === 'delivered' && status === 'delivered')
    }
  }
}
</script>

<style scoped>
.orders-page {
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
}

.orders-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-header h1 {
  font-size: 2.5rem;
  color: #f8fafc;
  font-weight: 800;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.shop-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s ease;
  display: inline-block;
}

.shop-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
}

.loading {
  text-align: center;
  padding: 4rem 2rem;
  color: #94a3b8;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: 1rem;
}

.empty-state h2 {
  color: #f8fafc;
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #94a3b8;
  margin-bottom: 2rem;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.order-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 2rem;
  transition: all 0.3s ease;
}

.order-card:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.order-id .label {
  color: #94a3b8;
  margin-right: 0.5rem;
}

.order-id .value {
  color: #f8fafc;
  font-weight: 600;
  font-family: monospace;
}

.order-status {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-pending { background: rgba(251, 191, 36, 0.2); color: #fbbf24; }
.status-confirmed { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
.status-processing { background: rgba(139, 92, 246, 0.2); color: #8b5cf6; }
.status-shipped { background: rgba(99, 102, 241, 0.2); color: #6366f1; }
.status-delivered { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
.status-cancelled { background: rgba(239, 68, 68, 0.2); color: #ef4444; }

.order-date {
  color: #94a3b8;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.order-items {
  margin-bottom: 1.5rem;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  margin-bottom: 0.5rem;
}

.order-item:last-child {
  margin-bottom: 0;
}

.item-info h4 {
  color: #f8fafc;
  margin-bottom: 0.25rem;
}

.item-meta {
  color: #94a3b8;
  font-size: 0.9rem;
}

.item-price {
  color: #6366f1;
  font-weight: 600;
  font-size: 1.1rem;
}

.order-totals {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.total-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  color: #e2e8f0;
}

.total-row.discount {
  color: #22c55e;
}

.total-row.grand-total {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 0.5rem;
  padding-top: 1rem;
  font-size: 1.2rem;
  font-weight: 700;
  color: #f8fafc;
}

.order-delivery {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.delivery-address,
.delivery-contact {
  color: #e2e8f0;
}

.delivery-address strong,
.delivery-contact p {
  display: block;
  margin-bottom: 0.25rem;
}

.icon {
  margin-right: 0.5rem;
}

.order-tracking {
  margin: 2rem 0 1.5rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
}

.tracking-steps {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
}

.step-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
}

.step.active .step-icon {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-color: #6366f1;
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
}

.step.completed .step-icon {
  background: #22c55e;
  border-color: #22c55e;
}

.step-label {
  color: #94a3b8;
  font-size: 0.85rem;
  font-weight: 500;
}

.step.active .step-label {
  color: #f8fafc;
  font-weight: 600;
}

.step-line {
  flex: 1;
  height: 2px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 -1rem 1.5rem;
}

.step-line.completed {
  background: #22c55e;
}

.order-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.order-actions button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.view-details-btn {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
}

.view-details-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(99, 102, 241, 0.4);
}

.cancel-order-btn {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.cancel-order-btn:hover {
  background: rgba(239, 68, 68, 0.3);
}

.reorder-btn {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.reorder-btn:hover {
  background: rgba(34, 197, 94, 0.3);
}

@media (max-width: 768px) {
  .orders-page {
    padding: 1rem;
  }

  .page-header h1 {
    font-size: 2rem;
  }

  .order-delivery {
    grid-template-columns: 1fr;
  }

  .tracking-steps {
    flex-wrap: wrap;
  }

  .step-line {
    display: none;
  }

  .order-actions {
    flex-direction: column;
  }

  .order-actions button {
    width: 100%;
  }
}
</style>
