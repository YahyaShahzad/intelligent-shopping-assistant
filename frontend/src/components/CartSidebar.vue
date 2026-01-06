<template>
  <div class="cart-overlay" @click.self="$emit('close')">
    <aside class="cart-sidebar">
      <div class="cart-header">
        <h2>Shopping Cart</h2>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div v-if="cart.items && cart.items.length > 0" class="cart-content">
        <div class="cart-items">
          <div 
            v-for="item in cart.items" 
            :key="item.productId"
            class="cart-item"
          >
            <div class="item-info">
              <h3>{{ item.name }}</h3>
              <p class="item-category">{{ item.category }}</p>
              
              <div class="item-price">
                <span v-if="item.originalPrice > item.price" class="original-price">
                  ${{ item.originalPrice.toFixed(2) }}
                </span>
                <span class="current-price">${{ item.price.toFixed(2) }}</span>
              </div>
            </div>

            <div class="item-actions">
              <div class="quantity-controls">
                <button @click="updateQuantity(item, -1)">-</button>
                <span>{{ item.quantity }}</span>
                <button @click="updateQuantity(item, 1)">+</button>
              </div>
              <button class="remove-btn" @click="removeItem(item.productId)">
                🗑️
              </button>
            </div>

            <div class="item-total">
              ${{ (item.price * item.quantity).toFixed(2) }}
            </div>
          </div>
        </div>

        <!-- Cart Summary -->
        <div class="cart-summary">
          <div class="summary-row">
            <span>Subtotal:</span>
            <span>${{ cart.subtotal?.toFixed(2) || '0.00' }}</span>
          </div>
          
          <div v-if="cart.totalDiscount > 0" class="summary-row discount">
            <span>Discount:</span>
            <span>-${{ cart.totalDiscount.toFixed(2) }}</span>
          </div>

          <div class="summary-row total">
            <span>Total:</span>
            <span>${{ cart.total?.toFixed(2) || '0.00' }}</span>
          </div>

          <!-- Applied Discounts -->
          <div v-if="evaluation && evaluation.discounts && evaluation.discounts.appliedRules" 
               class="applied-discounts">
            <p class="discount-label">💰 Applied Discounts:</p>
            <ul>
              <li v-for="(rule, index) in evaluation.discounts.appliedRules" :key="index">
                {{ rule.rule || rule }}
              </li>
            </ul>
          </div>

          <button class="checkout-btn" @click="$emit('checkout')">
            Proceed to Checkout
          </button>
        </div>
      </div>

      <div v-else class="empty-cart">
        <p>🛒</p>
        <p>Your cart is empty</p>
        <button @click="$emit('close')">Continue Shopping</button>
      </div>
    </aside>
  </div>
</template>

<script>
export default {
  name: 'CartSidebar',
  
  props: {
    cart: {
      type: Object,
      required: true
    },
    evaluation: {
      type: Object,
      default: () => ({})
    }
  },

  methods: {
    updateQuantity(item, delta) {
      const newQuantity = item.quantity + delta
      if (newQuantity > 0) {
        this.$emit('update-quantity', {
          productId: item.productId,
          quantity: newQuantity
        })
      } else {
        this.removeItem(item.productId)
      }
    },

    removeItem(productId) {
      this.$emit('remove-item', productId)
    }
  }
}
</script>

<style scoped>
.cart-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.cart-sidebar {
  width: 500px;
  max-width: 100%;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(30px) saturate(180%);
  height: 100vh;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: -8px 0 40px rgba(99, 102, 241, 0.2);
  border-left: 2px solid rgba(99, 102, 241, 0.3);
  position: relative;
}

.cart-sidebar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 2px;
  height: 100%;
  background: linear-gradient(180deg,
    transparent 0%,
    rgba(99, 102, 241, 0.6) 20%,
    rgba(139, 92, 246, 0.6) 80%,
    transparent 100%);
  pointer-events: none;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  border-bottom: 2px solid rgba(99, 102, 241, 0.3);
  background: linear-gradient(135deg, 
    rgba(99, 102, 241, 0.15) 0%, 
    rgba(139, 92, 246, 0.15) 100%);
  box-shadow: 0 2px 20px rgba(99, 102, 241, 0.2);
}

.cart-header h2 {
  font-size: 1.75rem;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 800;
}

.close-btn {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  font-size: 1.5rem;
  cursor: pointer;
  color: #ef4444;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: #ef4444;
  transform: rotate(90deg);
}

.cart-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.cart-items {
  flex: 1;
  overflow-y: auto;
  padding: 1.2rem;
}

.cart-item {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 1.2rem;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  align-items: center;
  background: #f8fafc;
  border-radius: 16px;
  margin-bottom: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid #e2e8f0;
}

.cart-item:hover {
  background: #f0f4ff;
  transform: translateX(-8px);
  border-color: #6366f1;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.2);
}

.item-info h3 {
  font-size: 1.05rem;
  margin-bottom: 0.35rem;
  color: #0f172a;
  font-weight: 700;
}

.item-category {
  font-size: 0.8rem;
  color: #6366f1;
  text-transform: uppercase;
  margin-bottom: 0.6rem;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.item-price {
  display: flex;
  gap: 0.6rem;
  align-items: center;
}

.original-price {
  text-decoration: line-through;
  color: #64748b;
  font-size: 0.9rem;
}

.current-price {
  font-weight: 700;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 1.05rem;
}

.item-actions {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: white;
  backdrop-filter: blur(10px);
  border-radius: 10px;
  padding: 0.4rem;
  border: 1px solid #e2e8f0;
}

.quantity-controls button {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  color: #6366f1;
  transition: all 0.3s ease;
}

.quantity-controls button:hover {
  background: rgba(99, 102, 241, 0.2);
  transform: scale(1.1);
}

.quantity-controls span {
  color: #0f172a;
  font-weight: 700;
  min-width: 25px;
  text-align: center;
}

.remove-btn {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  cursor: pointer;
  font-size: 1.1rem;
  padding: 0.4rem 0.6rem;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.remove-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: scale(1.1);
}

.item-total {
  font-weight: 800;
  font-size: 1.25rem;
  color: #0f172a;
}

.cart-summary {
  padding: 1.8rem;
  border-top: 2px solid rgba(99, 102, 241, 0.3);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%);
  backdrop-filter: blur(10px);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.9rem;
  font-size: 1.05rem;
  color: #475569;
  font-weight: 600;
}

.summary-row.discount {
  color: #10b981;
  font-weight: 700;
}

.summary-row.total {
  font-size: 1.5rem;
  font-weight: 800;
  padding-top: 1rem;
  border-top: 1px solid rgba(99, 102, 241, 0.2);
  margin-top: 1rem;
  color: #0f172a;
}

.applied-discounts {
  background: rgba(16, 185, 129, 0.08);
  backdrop-filter: blur(10px);
  padding: 1.2rem;
  border-radius: 12px;
  margin: 1.2rem 0;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.discount-label {
  font-weight: 700;
  margin-bottom: 0.7rem;
  color: #10b981;
  font-size: 0.95rem;
}

.applied-discounts ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.applied-discounts li {
  font-size: 0.9rem;
  padding: 0.35rem 0;
  color: #0f172a;
  font-weight: 500;
}

.applied-discounts li::before {
  content: '✓ ';
  color: #10b981;
  font-weight: bold;
  margin-right: 0.5rem;
}

.checkout-btn {
  width: 100%;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%);
  color: white;
  border: none;
  padding: 1.2rem;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 1rem;
}

.checkout-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 30px rgba(99, 102, 241, 0.6);
}

.empty-cart {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
}

.empty-cart p:first-child {
  font-size: 5rem;
  margin-bottom: 1.5rem;
  filter: drop-shadow(0 4px 15px rgba(99, 102, 241, 0.5));
}

.empty-cart p:nth-child(2) {
  color: #94a3b8;
  margin-bottom: 2rem;
  font-size: 1.2rem;
}

.empty-cart button {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 700;
  font-size: 1.05rem;
  transition: all 0.3s ease;
  box-shadow: 0 5px 20px rgba(99, 102, 241, 0.3);
}

.empty-cart button:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 30px rgba(99, 102, 241, 0.5);
}

/* Dark theme overrides for cart */
#app.theme-dark .cart-sidebar {
  background: #111827;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.5);
}

#app.theme-dark .cart-header {
  background: #0b1220;
  border-bottom-color: #1f2937;
  color: #e5e7eb;
}

#app.theme-dark .cart-header h2 {
  color: #f3f4f6;
}

#app.theme-dark .close-btn {
  color: #9ca3af;
}

#app.theme-dark .close-btn:hover {
  color: #f3f4f6;
  background: #1f2937;
}

#app.theme-dark .cart-item {
  background: #1f2937;
  border-color: #111827;
}

#app.theme-dark .cart-item:hover {
  background: #374151;
  border-color: #3b82f6;
}

#app.theme-dark .item-info h3 {
  color: #f3f4f6;
}

#app.theme-dark .item-category {
  color: #9ca3af;
}

#app.theme-dark .current-price {
  color: #86efac;
}

#app.theme-dark .original-price {
  color: #6b7280;
}

#app.theme-dark .item-total {
  color: #e5f3ff;
}

#app.theme-dark .quantity-controls button {
  background: #111827;
  color: #e5e7eb;
  border-color: #374151;
}

#app.theme-dark .quantity-controls button:hover {
  background: #374151;
  border-color: #4b5563;
}

#app.theme-dark .remove-btn {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

#app.theme-dark .remove-btn:hover {
  background: rgba(239, 68, 68, 0.2);
}

#app.theme-dark .cart-summary {
  background: #0b1220;
  border-top-color: #1f2937;
}

#app.theme-dark .summary-row {
  color: #e5e7eb;
  border-color: #1f2937;
}

#app.theme-dark .summary-row span:last-child {
  color: #f0fdf4;
}

#app.theme-dark .summary-row.total {
  color: #e5f3ff;
}

#app.theme-dark .discount-label {
  color: #a7f3d0;
}

#app.theme-dark .applied-discounts li {
  color: #e5e7eb;
}

#app.theme-dark .applied-discounts li::before {
  color: #10b981;
}

#app.theme-dark .checkout-btn {
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #c026d3 100%);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.3);
}

#app.theme-dark .checkout-btn:hover {
  box-shadow: 0 8px 30px rgba(37, 99, 235, 0.5);
}

#app.theme-dark .empty-cart {
  background: #111827;
  color: #e5e7eb;
}

#app.theme-dark .empty-cart p:nth-child(2) {
  color: #9ca3af;
}

#app.theme-dark .empty-cart button {
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
  box-shadow: 0 5px 20px rgba(37, 99, 235, 0.3);
}

#app.theme-dark .empty-cart button:hover {
  box-shadow: 0 8px 30px rgba(37, 99, 235, 0.5);
}
</style>
