<template>
  <aside class="assistant-panel">
    <h2>💡 Smart Assistant</h2>
    
    <!-- Discounts Section -->
    <div v-if="discounts && discounts.totalDiscount > 0" class="section">
      <h3>🎉 Active Discounts</h3>
      <div class="discount-card">
        <p class="discount-amount">Save ${{ discounts.totalDiscount.toFixed(2) }}</p>
        <ul class="discount-list">
          <li v-for="(rule, index) in discounts.appliedRules" :key="index">
            {{ rule.rule || rule }}
          </li>
        </ul>
      </div>
    </div>

    <!-- Available Coupons Section -->
    <div v-if="availableCoupons && availableCoupons.length > 0" class="section">
      <h3>🎫 Available Coupons</h3>
      <div 
        v-for="(coupon, index) in availableCoupons" 
        :key="index"
        class="coupon-card"
        @click="applyCoupon(coupon)"
      >
        <div class="coupon-header">
          <span class="coupon-code">{{ coupon.code }}</span>
          <span class="coupon-value">{{ coupon.discount }}</span>
        </div>
        <p class="coupon-description">{{ coupon.description }}</p>
        <button class="coupon-apply-btn">Click to Apply</button>
      </div>
    </div>

    <!-- Suggestions Section -->
    <div v-if="suggestions && suggestions.length > 0" class="section">
      <h3>💡 Suggestions</h3>
      <div 
        v-for="(suggestion, index) in suggestions" 
        :key="index"
        class="suggestion-card"
        :class="`priority-${suggestion.priority?.toLowerCase()}`"
      >
        <div class="suggestion-header">
          <span class="suggestion-type">{{ suggestion.type }}</span>
          <span class="suggestion-priority">{{ suggestion.priority }}</span>
        </div>
        <p class="suggestion-message">{{ suggestion.message }}</p>
        <div v-if="suggestion.potentialSaving" class="suggestion-savings">
          💰 Save ${{ suggestion.potentialSaving.toFixed(2) }}
        </div>
        <button 
          class="apply-btn"
          @click="$emit('apply-suggestion', suggestion)"
        >
          Apply
        </button>
      </div>
    </div>

    <!-- Recommendations Section -->
    <div v-if="recommendations && recommendations.length > 0" class="section">
      <h3>⭐ Recommended for You</h3>
      <p v-if="hasPurchaseBasedRecs" class="recommendation-subtitle">
        Based on your purchase history
      </p>
      <div 
        v-for="(rec, index) in recommendations.slice(0, 5)" 
        :key="index"
        class="recommendation-card"
        :class="{ 'purchase-based': isPurchaseBased(rec) }"
      >
        <div class="rec-content">
          <h4>{{ rec.product?.name || rec.name }}</h4>
          <p class="rec-reason">
            <span v-if="isPurchaseBased(rec)" class="purchase-badge">🎯</span>
            {{ rec.reason }}
          </p>
          <p class="rec-price">${{ (rec.product?.price || rec.price).toFixed(2) }}</p>
          <div class="rec-score" v-if="rec.score">
            <span class="score-label">Match:</span>
            <div class="score-bar">
              <div class="score-fill" :style="{ width: (rec.score * 100) + '%' }"></div>
            </div>
            <span class="score-value">{{ (rec.score * 100).toFixed(0) }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="isEmpty" class="empty-state">
      <p>🤔 No suggestions yet</p>
      <p class="empty-subtitle">Add items to your cart to get personalized recommendations!</p>
    </div>
  </aside>
</template>

<script>
export default {
  name: 'AssistantPanel',
  
  props: {
    suggestions: {
      type: Array,
      default: () => []
    },
    recommendations: {
      type: Array,
      default: () => []
    },
    discounts: {
      type: Object,
      default: () => ({})
    },
    availableCoupons: {
      type: Array,
      default: () => []
    }
  },

  emits: ['apply-suggestion', 'apply-coupon'],

  computed: {
    isEmpty() {
      return (!this.suggestions || this.suggestions.length === 0) &&
             (!this.recommendations || this.recommendations.length === 0) &&
             (!this.discounts || !this.discounts.totalDiscount) &&
             (!this.availableCoupons || this.availableCoupons.length === 0)
    },
    
    hasPurchaseBasedRecs() {
      return this.recommendations.some(rec => 
        rec.reason && (
          rec.reason.includes('Based on your previous') || 
          rec.reason.includes('Similar to items you bought') ||
          rec.reason.includes('Perfect accessory for your')
        )
      )
    }
  },
  
  methods: {
    isPurchaseBased(rec) {
      return rec.reason && (
        rec.reason.includes('Based on your previous') || 
        rec.reason.includes('Similar to items you bought') ||
        rec.reason.includes('Perfect accessory for your')
      )
    },

    applyCoupon(coupon) {
      this.$emit('apply-coupon', coupon)
    }
  }
}
</script>

<style scoped>
.assistant-panel {
  width: 400px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(30px) saturate(180%);
  padding: 2rem;
  height: calc(100vh - 70px);
  overflow-y: auto;
  border-right: 2px solid rgba(99, 102, 241, 0.2);
  box-shadow: 4px 0 20px rgba(99, 102, 241, 0.15);
  position: relative;
}

.assistant-panel::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 2px;
  height: 100%;
  background: linear-gradient(180deg, 
    transparent 0%, 
    rgba(99, 102, 241, 0.4) 20%, 
    rgba(139, 92, 246, 0.4) 80%, 
    transparent 100%);
  pointer-events: none;
}

h2 {
  font-size: 1.85rem;
  margin-bottom: 2rem;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%);
  background-size: 200% 200%;
  animation: gradientText 5s ease infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 900;
  letter-spacing: -0.5px;
  text-shadow: 0 0 40px rgba(99, 102, 241, 0.5);
  position: relative;
}

h2::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 0;
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #6366f1, transparent);
  border-radius: 2px;
}

@keyframes gradientText {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

h3 {
  font-size: 1.15rem;
  margin-bottom: 1.2rem;
  color: #1e293b;
  font-weight: 700;
}

.section {
  margin-bottom: 2.5rem;
}

.discount-card {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.discount-amount {
  font-size: 1.8rem;
  font-weight: 800;
  margin-bottom: 0.8rem;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.discount-list {
  list-style: none;
  padding: 0;
}

.discount-list li {
  padding: 0.4rem 0;
  font-size: 0.925rem;
  opacity: 0.95;
}

.discount-list li::before {
  content: '✓ ';
  font-weight: bold;
  margin-right: 0.5rem;
}

.coupon-card {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%);
  color: white;
  padding: 1.2rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px dashed rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
}

.coupon-card:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.5);
  border-color: rgba(255, 255, 255, 0.6);
}

.coupon-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.coupon-code {
  font-size: 1.2rem;
  font-weight: 800;
  font-family: 'Courier New', monospace;
  letter-spacing: 1px;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.3rem 0.8rem;
  border-radius: 6px;
}

.coupon-value {
  font-size: 1.3rem;
  font-weight: 900;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.coupon-description {
  font-size: 0.9rem;
  margin-bottom: 0.8rem;
  opacity: 0.95;
  line-height: 1.4;
}

.coupon-apply-btn {
  background: rgba(255, 255, 255, 0.25);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.4);
  padding: 0.6rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  width: 100%;
}

.coupon-apply-btn:hover {
  background: rgba(255, 255, 255, 0.35);
  transform: scale(1.05);
}

.suggestion-card {
  background: rgba(99, 102, 241, 0.05);
  backdrop-filter: blur(10px);
  padding: 1.2rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  border-left: 4px solid #6366f1;
  transition: all 0.3s ease;
  border: 1px solid rgba(99, 102, 241, 0.15);
}

.suggestion-card:hover {
  background: rgba(99, 102, 241, 0.08);
  transform: translateX(5px);
  box-shadow: 0 5px 20px rgba(99, 102, 241, 0.2);
}

.suggestion-card.priority-high {
  border-left-color: #ef4444;
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.15);
}

.suggestion-card.priority-medium {
  border-left-color: #f59e0b;
  background: rgba(245, 158, 11, 0.05);
  border: 1px solid rgba(245, 158, 11, 0.15);
}

.suggestion-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.7rem;
}

.suggestion-type {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #6366f1;
  letter-spacing: 0.5px;
}

.suggestion-priority {
  font-size: 0.75rem;
  padding: 0.25rem 0.7rem;
  border-radius: 15px;
  background: rgba(99, 102, 241, 0.15);
  color: #6366f1;
  font-weight: 600;
}

.suggestion-message {
  font-size: 0.925rem;
  margin-bottom: 0.7rem;
  color: #475569;
  line-height: 1.5;
}

.suggestion-savings {
  font-size: 0.95rem;
  color: #10b981;
  font-weight: 700;
  margin-bottom: 0.8rem;
}

.apply-btn {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  padding: 0.7rem 1.3rem;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 700;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.apply-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(99, 102, 241, 0.5);
  background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%);
}

.recommendation-card {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(99, 102, 241, 0.15);
  padding: 1.2rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
}

.recommendation-card:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateX(5px);
  box-shadow: 0 5px 20px rgba(99, 102, 241, 0.2);
}

.rec-content h4 {
  font-size: 1rem;
  margin-bottom: 0.4rem;
  color: #1e293b;
  font-weight: 700;
}

.rec-reason {
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 0.7rem;
  line-height: 1.4;
}

.rec-price {
  font-size: 1.15rem;
  font-weight: 800;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.recommendation-subtitle {
  font-size: 0.85rem;
  color: #10b981;
  margin-top: -0.5rem;
  margin-bottom: 1rem;
  font-style: italic;
  font-weight: 600;
}

.purchase-based {
  border-left: 3px solid #10b981;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.purchase-badge {
  display: inline-block;
  margin-right: 0.3rem;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.rec-score {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.8rem;
  font-size: 0.8rem;
}

.score-label {
  color: #94a3b8;
  font-weight: 600;
}

.score-bar {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981 0%, #6366f1 100%);
  border-radius: 10px;
  transition: width 0.3s ease;
}

.score-value {
  color: #10b981;
  font-weight: 700;
  min-width: 40px;
  text-align: right;
}

.empty-state {
  text-align: center;
  padding: 4rem 1rem;
  color: #64748b;
}

.empty-state p:first-child {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-subtitle {
  font-size: 0.95rem;
  color: #94a3b8;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .assistant-panel {
    width: 100%;
    height: auto;
    border-right: none;
    border-bottom: 1px solid rgba(99, 102, 241, 0.3);
  }
}
</style>
