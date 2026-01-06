<template>
  <div class="checkout">
    <div class="checkout-container">
      <div class="checkout-header">
        <h1>🛒 Checkout</h1>
        <router-link to="/products" class="back-link">← Continue Shopping</router-link>
      </div>

      <div v-if="!orderComplete" class="checkout-content">
        <!-- Order Summary -->
        <div class="order-summary">
          <h2>Order Summary</h2>
          <div v-if="cart.items && cart.items.length > 0">
            <div v-for="item in cart.items" :key="item.productId" class="cart-item">
              <div class="item-details">
                <h3>{{ item.name }}</h3>
                <p class="item-category">{{ item.category }}</p>
                <p class="item-quantity">Quantity: {{ item.quantity }}</p>
              </div>
              <div class="item-price">
                ${{ (item.price * item.quantity).toFixed(2) }}
              </div>
            </div>

            <div class="summary-totals">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>${{ cart.subtotal ? cart.subtotal.toFixed(2) : '0.00' }}</span>
              </div>
              <div v-if="cart.totalDiscount > 0" class="total-row discount">
                <span>Discount:</span>
                <span>-${{ cart.totalDiscount.toFixed(2) }}</span>
              </div>
              <div class="total-row grand-total">
                <span>Total:</span>
                <span>${{ cart.total ? cart.total.toFixed(2) : '0.00' }}</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-cart">
            <p>Your cart is empty</p>
            <router-link to="/products" class="shop-btn">Start Shopping</router-link>
          </div>
        </div>

        <!-- Checkout Form -->
        <div v-if="cart.items && cart.items.length > 0" class="checkout-form">
          <h2>Billing Information</h2>
          
          <form @submit.prevent="processCheckout">
            <div class="form-group">
              <label>Full Name *</label>
              <input v-model="checkoutData.name" type="text" required placeholder="John Doe" />
            </div>

            <div class="form-group">
              <label>Email *</label>
              <input v-model="checkoutData.email" type="email" required placeholder="john@example.com" />
            </div>

            <div class="form-group">
              <label>Phone *</label>
              <input v-model="checkoutData.phone" type="tel" required placeholder="+1 234 567 8900" />
            </div>

            <div class="form-group">
              <label>Address *</label>
              <textarea v-model="checkoutData.address" required placeholder="123 Main St, Apt 4B" rows="3"></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>City *</label>
                <input v-model="checkoutData.city" type="text" required placeholder="New York" />
              </div>

              <div class="form-group">
                <label>Postal Code *</label>
                <input v-model="checkoutData.postalCode" type="text" required placeholder="10001" />
              </div>
            </div>

            <h3>Shipping Method</h3>

            <div class="shipping-options">
              <label class="shipping-option" :class="{ selected: checkoutData.shippingMethod === 'standard' }">
                <input type="radio" name="shipping" value="standard" v-model="checkoutData.shippingMethod" />
                <div class="option-content">
                  <strong>🚚 Standard Shipping - FREE</strong>
                  <span>Delivery in 5-7 business days</span>
                </div>
              </label>

              <label class="shipping-option" :class="{ selected: checkoutData.shippingMethod === 'express' }">
                <input type="radio" name="shipping" value="express" v-model="checkoutData.shippingMethod" />
                <div class="option-content">
                  <strong>⚡ Express Shipping - $9.99</strong>
                  <span>Delivery in 2-3 business days</span>
                </div>
              </label>

              <label class="shipping-option" :class="{ selected: checkoutData.shippingMethod === 'overnight' }">
                <input type="radio" name="shipping" value="overnight" v-model="checkoutData.shippingMethod" />
                <div class="option-content">
                  <strong>✈️ Overnight Shipping - $19.99</strong>
                  <span>Delivery next business day</span>
                </div>
              </label>
            </div>

            <h3>Payment Information</h3>

            <div class="payment-methods">
              <label class="payment-method" :class="{ selected: checkoutData.paymentMethod === 'credit-card' }">
                <input type="radio" name="payment" value="credit-card" v-model="checkoutData.paymentMethod" />
                <span>💳 Credit/Debit Card</span>
              </label>

              <label class="payment-method" :class="{ selected: checkoutData.paymentMethod === 'paypal' }">
                <input type="radio" name="payment" value="paypal" v-model="checkoutData.paymentMethod" />
                <span>🅿️ PayPal</span>
              </label>

              <label class="payment-method" :class="{ selected: checkoutData.paymentMethod === 'cash' }">
                <input type="radio" name="payment" value="cash" v-model="checkoutData.paymentMethod" />
                <span>💵 Cash on Delivery</span>
              </label>
            </div>

            <div v-if="checkoutData.paymentMethod === 'credit-card'">
              <div class="form-group">
                <label>Card Number *</label>
                <input 
                  v-model="checkoutData.cardNumber" 
                  type="text" 
                  required 
                  placeholder="1234 5678 9012 3456"
                  maxlength="19"
                />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Expiry Date *</label>
                  <input v-model="checkoutData.expiryDate" type="text" required placeholder="MM/YY" maxlength="5" />
                </div>

                <div class="form-group">
                  <label>CVV *</label>
                  <input v-model="checkoutData.cvv" type="text" required placeholder="123" maxlength="4" />
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" @click="$router.push('/products')" class="cancel-btn">
                Cancel
              </button>
              <button type="submit" class="submit-btn" :disabled="processing">
                {{ processing ? '⏳ Processing...' : '✅ Complete Order' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Order Complete -->
      <div v-else class="order-complete">
        <div class="success-icon">✓</div>
        <h2>Order Placed Successfully!</h2>
        <p>Thank you for your purchase, {{ checkoutData.name }}!</p>
        <p class="order-id">Order ID: {{ orderId }}</p>
        <div class="order-details">
          <p>Subtotal: <strong>${{ orderSubtotal.toFixed(2) }}</strong></p>
          <p v-if="orderDiscount > 0">Discount: <strong class="discount-text">-${{ orderDiscount.toFixed(2) }}</strong></p>
          <p class="total-amount">Total Amount: <strong>${{ orderTotal.toFixed(2) }}</strong></p>
          <p>A confirmation email has been sent to <strong>{{ checkoutData.email }}</strong></p>
        </div>
        <button @click="startNewOrder" class="new-order-btn">
          Start New Order
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import api from '../services/api'

export default {
  name: 'CheckoutPage',

  data() {
    return {
      checkoutData: {
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        shippingMethod: 'standard',
        paymentMethod: 'credit-card',
        cardNumber: '',
        expiryDate: '',
        cvv: ''
      },
      processing: false,
      orderComplete: false,
      orderId: null,
      orderTotal: 0,
      orderSubtotal: 0,
      orderDiscount: 0,
      shippingCost: 0
    }
  },

  computed: {
    ...mapState('cart', ['cart']),
    ...mapState('session', ['sessionId'])
  },

  async mounted() {
    // Load cart data
    await this.$store.dispatch('cart/loadCart')
  },

  methods: {
    async processCheckout() {
      if (this.processing) return

      try {
        this.processing = true

        // Step 1: Proceed to checkout state
        await api.put(`/session/${this.sessionId}/state`, {
          action: 'checkout'
        })

        // Step 2: Complete checkout with payment info
        const response = await api.put(`/session/${this.sessionId}/state`, {
          action: 'complete',
          data: {
            billingInfo: {
              name: this.checkoutData.name,
              email: this.checkoutData.email,
              phone: this.checkoutData.phone,
              address: this.checkoutData.address,
              city: this.checkoutData.city,
              postalCode: this.checkoutData.postalCode
            },
            paymentInfo: {
              cardNumber: this.maskCardNumber(this.checkoutData.cardNumber),
              expiryDate: this.checkoutData.expiryDate,
              cvv: '***' // Never store real CVV
            }
          }
        })

        if (response.data.success) {
          // Save order details before clearing cart
          this.orderTotal = this.cart.total || 0
          this.orderSubtotal = this.cart.subtotal || 0
          this.orderDiscount = this.cart.totalDiscount || 0
          this.orderId = this.generateOrderId()
          this.orderComplete = true
          
          // Clear cart
          this.$store.commit('cart/CLEAR_CART')
        } else {
          throw new Error(response.data.message || 'Checkout failed')
        }
      } catch (error) {
        console.error('Checkout error:', error)
        alert('❌ Checkout failed. Please try again.')
      } finally {
        this.processing = false
      }
    },

    maskCardNumber(cardNumber) {
      const cleaned = cardNumber.replace(/\s/g, '')
      return '**** **** **** ' + cleaned.slice(-4)
    },

    generateOrderId() {
      return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase()
    },

    async startNewOrder() {
      try {
        // Reset ALL cart-related state FIRST
        this.$store.commit('cart/CLEAR_CART')
        this.$store.commit('cart/SET_EVALUATION', {
          discounts: [],
          suggestions: [],
          recommendations: [],
          inventoryIssues: []
        })
        
        // Clear assistant state (suggestions and recommendations)
        this.$store.commit('assistant/CLEAR_ASSISTANT')
        
        // Reset order data
        this.orderComplete = false
        this.orderTotal = 0
        this.orderSubtotal = 0
        this.orderDiscount = 0
        this.orderId = null
        this.checkoutData = {
          name: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          postalCode: '',
          cardNumber: '',
          expiryDate: '',
          cvv: ''
        }
        
        // Clear old session from localStorage
        localStorage.removeItem('sessionId')
        
        // Start a completely new session (this will create a fresh empty session)
        await this.$store.dispatch('session/initializeSession')
        
        // Navigate to products
        await this.$router.push('/products')
      } catch (error) {
        console.error('Error starting new order:', error)
        alert('Failed to start new order. Please refresh the page.')
      }
    }
  }
}
</script>

<style scoped>
.checkout {
  flex: 1;
  padding: 2rem;
  background: #f5f7fa;
  min-height: 100vh;
}

.checkout-container {
  max-width: 1200px;
  margin: 0 auto;
}

.checkout-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.checkout-header h1 {
  font-size: 2rem;
  color: #333;
}

.back-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.back-link:hover {
  text-decoration: underline;
}

.checkout-content {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 2rem;
}

.order-summary, .checkout-form {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.order-summary h2, .checkout-form h2 {
  margin-bottom: 1.5rem;
  color: #333;
  font-size: 1.5rem;
}

.cart-item {
  display: flex;
  justify-content: space-between;
  padding: 1rem 0;
  border-bottom: 1px solid #eee;
}

.item-details h3 {
  font-size: 1rem;
  margin-bottom: 0.25rem;
  color: #333;
}

.item-category {
  font-size: 0.875rem;
  color: #999;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}

.item-quantity {
  font-size: 0.875rem;
  color: #666;
}

.item-price {
  font-weight: 700;
  color: #667eea;
  font-size: 1.125rem;
}

.summary-totals {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid #eee;
}

.total-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  font-size: 1rem;
}

.total-row.discount {
  color: #2ecc71;
}

.total-row.grand-total {
  font-size: 1.25rem;
  font-weight: 700;
  color: #333;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 2px solid #333;
}

.empty-cart {
  text-align: center;
  padding: 2rem;
}

.shop-btn {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  text-decoration: none;
  border-radius: 8px;
}

.checkout-form h3 {
  margin-top: 2rem;
  margin-bottom: 1rem;
  font-size: 1.25rem;
  color: #333;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.shipping-options,
.payment-methods {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.shipping-option,
.payment-method {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.shipping-option:hover,
.payment-method:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(99, 102, 241, 0.3);
}

.shipping-option.selected,
.payment-method.selected {
  background: rgba(99, 102, 241, 0.1);
  border-color: #6366f1;
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
}

.shipping-option input[type="radio"],
.payment-method input[type="radio"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.option-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.option-content strong {
  color: #f8fafc;
  font-size: 1rem;
}

.option-content span {
  color: #94a3b8;
  font-size: 0.9rem;
}

.payment-method span {
  color: #f8fafc;
  font-weight: 600;
  font-size: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.cancel-btn, .submit-btn {
  flex: 1;
  padding: 1rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #e0e0e0;
  color: #333;
}

.cancel-btn:hover {
  background: #d0d0d0;
}

.submit-btn {
  background: #667eea;
  color: white;
}

.submit-btn:hover:not(:disabled) {
  background: #5568d3;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.order-complete {
  background: white;
  border-radius: 12px;
  padding: 4rem 2rem;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.success-icon {
  width: 80px;
  height: 80px;
  background: #2ecc71;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  margin: 0 auto 2rem;
}

.order-complete h2 {
  font-size: 2rem;
  color: #333;
  margin-bottom: 1rem;
}

.order-id {
  font-size: 1.125rem;
  color: #667eea;
  font-weight: 600;
  margin: 1.5rem 0;
}

.order-details {
  background: #f5f7fa;
  padding: 1.5rem;
  border-radius: 8px;
  margin: 2rem 0;
}

.order-details p {
  margin: 0.5rem 0;
}

.new-order-btn {
  padding: 1rem 2rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 2rem;
}

.new-order-btn:hover {
  background: #5568d3;
}

@media (max-width: 768px) {
  .checkout-content {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
