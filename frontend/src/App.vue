<template>
  <div id="app">
    <Header 
      v-if="isAuthenticated"
      :cartCount="cartItemCount" 
      :user="currentUser"
      @toggle-cart="toggleCart"
      @logout="handleLogout"
    />
    
    <div class="main-container" v-if="isAuthenticated">
      <AssistantPanel 
        v-if="showAssistant"
        :suggestions="suggestions"
        :recommendations="recommendations"
        :discounts="discounts"
        :availableCoupons="availableCoupons"
        @apply-suggestion="applySuggestion"
        @apply-coupon="applyCoupon"
      />
      
      <router-view 
        @product-added="handleProductAdded"
        :products="products"
      />
      
      <CartSidebar 
        v-if="showCart"
        :cart="cart"
        :evaluation="evaluation"
        @close="toggleCart"
        @update-quantity="updateQuantity"
        @remove-item="removeItem"
        @checkout="proceedToCheckout"
      />
    </div>

    <router-view v-else />

    <LoadingOverlay v-if="loading" />
    <NotificationToast 
      v-if="notification"
      :message="notification.message"
      :type="notification.type"
      @close="notification = null"
    />
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import Header from './components/Header.vue'
import AssistantPanel from './components/AssistantPanel.vue'
import CartSidebar from './components/CartSidebar.vue'
import LoadingOverlay from './components/LoadingOverlay.vue'
import NotificationToast from './components/NotificationToast.vue'

export default {
  name: 'App',
  
  components: {
    Header,
    AssistantPanel,
    CartSidebar,
    LoadingOverlay,
    NotificationToast
  },

  data() {
    return {
      showCart: false,
      showAssistant: true,
      notification: null,
      availableCoupons: []
    }
  },

  computed: {
    ...mapState('cart', ['cart', 'evaluation', 'loading']),
    ...mapState('assistant', ['suggestions', 'recommendations', 'discounts']),
    ...mapState('products', ['products']),
    ...mapGetters('cart', ['cartItemCount']),
    ...mapGetters('auth', ['isAuthenticated', 'currentUser'])
  },

  async mounted() {
    // Initialize auth from localStorage
    this.initializeAuth()
    
    if (this.isAuthenticated) {
      try {
        console.log('User is authenticated, initializing app...')
        await this.getCurrentUser()
        console.log('Current user loaded:', this.currentUser)
        
        await this.initializeSession()
        console.log('Session initialized')
        
        await this.loadProducts()
        console.log('Products loaded')
        
        await this.loadCoupons()
        console.log('Coupons loaded')
        
        this.connectWebSocket()
        console.log('WebSocket connected')
      } catch (error) {
        console.error('Initialization error:', error)
        this.showNotification('Failed to initialize app: ' + error.message, 'error')
        
        // If there's an error, redirect to auth after a delay
        setTimeout(() => {
          this.$router.push('/auth')
        }, 2000)
      }
    }
  },

  // FIX: Add cleanup to prevent memory leaks
  beforeUnmount() {
    // Disconnect WebSocket when component unmounts
    if (this.$store.state.socket.connected) {
      this.$store.dispatch('socket/disconnectWebSocket')
    }
  },

  methods: {
    ...mapActions('auth', ['initializeAuth', 'getCurrentUser', 'logout']),
    ...mapActions('session', ['initializeSession']),
    ...mapActions('cart', ['addToCart', 'updateCartItem', 'removeFromCart']),
    ...mapActions('products', ['loadProducts']),
    ...mapActions('socket', ['connectWebSocket']),

    async handleLogout() {
      await this.logout()
      this.$router.push('/auth')
      this.showNotification('Logged out successfully', 'info')
    },

    toggleCart() {
      this.showCart = !this.showCart
    },

    async handleProductAdded(product) {
      try {
        await this.addToCart(product)
        this.showNotification('Product added to cart!', 'success')
      } catch (error) {
        this.showNotification(error.message, 'error')
      }
    },

    async updateQuantity({ productId, quantity }) {
      try {
        await this.updateCartItem({ productId, quantity })
      } catch (error) {
        this.showNotification(error.message, 'error')
      }
    },

    async removeItem(productId) {
      try {
        await this.removeFromCart(productId)
        this.showNotification('Item removed from cart', 'info')
      } catch (error) {
        this.showNotification(error.message, 'error')
      }
    },

    async applySuggestion(suggestion) {
      // Handle different suggestion types
      console.log('Applying suggestion:', suggestion)
    },

    async applyCoupon(coupon) {
      try {
        const sessionId = this.$store.state.session.sessionId
        const response = await this.$store.dispatch('assistant/applyCoupon', {
          sessionId,
          couponCode: coupon.code
        })
        
        if (response.success) {
          this.showNotification(response.message, 'success')
          // Refresh cart to show updated discount
          await this.$store.dispatch('cart/refreshCart')
        } else {
          this.showNotification(response.error, 'error')
        }
      } catch (error) {
        this.showNotification(error.message || 'Failed to apply coupon', 'error')
      }
    },

    async loadCoupons() {
      try {
        const userId = this.currentUser._id || this.currentUser.id
        const response = await this.$axios.get(`/assistant/coupons/${userId}`)
        this.availableCoupons = response.data
      } catch (error) {
        console.error('Error loading coupons:', error)
      }
    },

    async proceedToCheckout() {
      this.$router.push('/checkout')
    },

    showNotification(message, type = 'info') {
      this.notification = { message, type }
      setTimeout(() => {
        this.notification = null
      }, 3000)
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

#app {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 25%, #fae8ff 50%, #e0e7ff 75%, #f0f4ff 100%);
  background-size: 200% 200%;
  animation: gradientShift 15s ease infinite;
  color: #1e293b;
  position: relative;
}

#app::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.08) 0%, transparent 50%),
              radial-gradient(circle at 80% 50%, rgba(236, 72, 153, 0.08) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.main-container {
  display: flex;
  min-height: calc(100vh - 70px);
  position: relative;
  z-index: 1;
  padding: 0;
}

/* Mobile Responsive Styles */
@media (max-width: 768px) {
  #app {
    font-size: 14px;
  }

  .main-container {
    flex-direction: column;
    min-height: calc(100vh - 60px);
    padding: 0;
  }
  
  /* Make body scrollable on mobile */
  body {
    overflow-x: hidden;
  }
}

@media (max-width: 480px) {
  #app {
    font-size: 13px;
  }
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

::-webkit-scrollbar-track {
  background: rgba(241, 245, 249, 0.8);
  border-radius: 10px;
  margin: 4px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 10px;
  border: 2px solid rgba(241, 245, 249, 0.8);
  transition: all 0.3s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
  border-color: rgba(99, 102, 241, 0.3);
}
</style>
