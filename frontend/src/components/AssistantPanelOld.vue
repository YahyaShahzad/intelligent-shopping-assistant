<template>
  <aside class="assistant-panel">
    <!-- Header -->
    <div class="assistant-header">
      <div class="header-content">
        <div class="ai-avatar">
          <div class="avatar-icon">🤖</div>
          <div class="status-indicator"></div>
        </div>
        <div class="header-info">
          <h2>AI Shopping Assistant</h2>
          <p class="status-text">Always here to help</p>
        </div>
      </div>
    </div>

    <!-- Chat Messages -->
    <div class="chat-container" ref="chatContainer">
      <!-- Welcome Message -->
      <div v-if="messages.length === 0" class="welcome-message">
        <div class="welcome-icon">👋</div>
        <h3>Hello! I'm your AI Shopping Assistant</h3>
        <p>I can help you with:</p>
        <ul class="capabilities">
          <li>🎯 Personalized product recommendations</li>
          <li>💰 Finding the best deals and discounts</li>
          <li>🛒 Cart optimization suggestions</li>
          <li>🎫 Available coupons and promotions</li>
        </ul>
        <p class="hint">Start shopping and I'll provide real-time insights!</p>
      </div>

      <!-- Chat Messages -->
      <div v-for="(msg, index) in messages" :key="index" class="message" :class="msg.type">
        <div class="message-avatar" v-if="msg.type === 'assistant'">
          <span>🤖</span>
        </div>
        <div class="message-content">
          <div class="message-bubble" v-html="msg.content"></div>
          <span class="message-time">{{ msg.time }}</span>
        </div>
        <div class="message-avatar" v-if="msg.type === 'user'">
          <span>👤</span>
        </div>
      </div>

      <!-- Typing Indicator -->
      <div v-if="isTyping" class="message assistant">
        <div class="message-avatar">
          <span>🤖</span>
        </div>
        <div class="message-content">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Active Insights Section -->
    <div class="insights-section" v-if="hasActiveInsights">
      <div class="insights-header">
        <span class="insights-icon">💡</span>
        <span class="insights-title">Active Insights</span>
      </div>
      
      <!-- Discounts Section -->
      
      <!-- Discounts -->
      <div v-if="discounts && discounts.totalDiscount > 0" class="insight-card discount-card">
        <div class="card-header">
          <span class="card-icon">🎉</span>
          <span class="card-title">Active Discounts</span>
        </div>
        <div class="discount-amount">Save ${{ discounts.totalDiscount.toFixed(2) }}</div>
        <ul class="discount-list">
          <li v-for="(rule, index) in discounts.appliedRules" :key="index">
            {{ rule.rule || rule }}
          </li>
        </ul>
      </div>

      <!-- Available Coupons -->
      <div v-if="availableCoupons && availableCoupons.length > 0" class="insight-card">
        <div class="card-header">
          <span class="card-icon">🎫</span>
          <span class="card-title">Available Coupons ({{ availableCoupons.length }})</span>
        </div>
        <div 
          v-for="(coupon, index) in availableCoupons.slice(0, 2)" 
          :key="index"
          class="coupon-item"
          @click="applyCoupon(coupon)"
        >
          <div class="coupon-code">{{ coupon.code }}</div>
          <div class="coupon-description">{{ coupon.description }}</div>
          <div class="coupon-value">{{ coupon.discount }}</div>
        </div>
      </div>

      <!-- Suggestions -->
      <div v-if="suggestions && suggestions.length > 0" class="insight-card">
        <div class="card-header">
          <span class="card-icon">💡</span>
          <span class="card-title">Smart Suggestions</span>
        </div>
        <div 
          v-for="(suggestion, index) in suggestions.slice(0, 3)" 
          :key="index"
          class="suggestion-item"
          :class="`priority-${suggestion.priority?.toLowerCase()}`"
        >
          <div class="suggestion-header">
            <span class="suggestion-type">{{ suggestion.type }}</span>
            <span class="suggestion-priority-badge">{{ suggestion.priority }}</span>
          </div>
          <p class="suggestion-message">{{ suggestion.message }}</p>
          <div class="suggestion-footer">
            <span v-if="suggestion.potentialSaving" class="savings">
              💰 Save ${{ suggestion.potentialSaving.toFixed(2) }}
            </span>
            <button class="apply-btn-sm" @click="$emit('apply-suggestion', suggestion)">
              Apply
            </button>
          </div>
        </div>
      </div>

      <!-- Recommendations -->
      <div v-if="recommendations && recommendations.length > 0" class="insight-card">
        <div class="card-header">
          <span class="card-icon">⭐</span>
          <span class="card-title">Recommended Products</span>
        </div>
        <div 
          v-for="(rec, index) in recommendations.slice(0, 3)" 
          :key="index"
          class="recommendation-item"
        >
          <div class="rec-info">
            <h4>{{ rec.product?.name || rec.name }}</h4>
            <p class="rec-reason">{{ rec.reason }}</p>
            <div class="rec-footer">
              <span class="rec-price">${{ (rec.product?.price || rec.price).toFixed(2) }}</span>
              <div v-if="rec.score" class="rec-score-mini">
                <div class="score-bar-mini">
                  <div class="score-fill-mini" :style="{ width: (rec.score * 100) + '%' }"></div>
                </div>
                <span class="score-text">{{ (rec.score * 100).toFixed(0) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="input-area">
      <input 
        v-model="userInput"
        @keyup.enter="sendMessage"
        type="text" 
        placeholder="Ask me anything about products..."
        class="chat-input"
      />
      <button 
        @click="sendMessage"
        :disabled="!userInput.trim()"
        class="send-btn"
      >
        <span class="send-icon">📤</span>
      </button>
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

  data() {
    return {
      messages: [],
      userInput: '',
      isTyping: false
    }
  },

  computed: {
    hasActiveInsights() {
      return (this.discounts && this.discounts.totalDiscount > 0) ||
             (this.availableCoupons && this.availableCoupons.length > 0) ||
             (this.suggestions && this.suggestions.length > 0) ||
             (this.recommendations && this.recommendations.length > 0)
    }
  },

  watch: {
    discounts: {
      handler(newVal) {
        if (newVal && newVal.totalDiscount > 0 && !this.hasDiscountMessage()) {
          this.addAssistantMessage(
            `Great news! I've found <strong>$${newVal.totalDiscount.toFixed(2)}</strong> in discounts for your cart. ${newVal.appliedRules.length} discount rule${newVal.appliedRules.length > 1 ? 's' : ''} applied automatically.`
          )
        }
      },
      deep: true
    },

    suggestions: {
      handler(newVal) {
        if (newVal && newVal.length > 0 && !this.hasSuggestionMessage()) {
          const highPriority = newVal.filter(s => s.priority === 'HIGH')
          if (highPriority.length > 0) {
            this.addAssistantMessage(
              `💡 I have <strong>${highPriority.length}</strong> high-priority suggestion${highPriority.length > 1 ? 's' : ''} to optimize your cart and save more money!`
            )
          }
        }
      },
      deep: true
    },

    availableCoupons: {
      handler(newVal) {
        if (newVal && newVal.length > 0 && !this.hasCouponMessage()) {
          this.addAssistantMessage(
            `🎫 You have <strong>${newVal.length}</strong> coupon${newVal.length > 1 ? 's' : ''} available! Check the insights section below to apply them.`
          )
        }
      },
      deep: true
    }
  },

  methods: {
    sendMessage() {
      if (!this.userInput.trim()) return

      // Add user message
      this.messages.push({
        type: 'user',
        content: this.userInput,
        time: this.getCurrentTime()
      })

      const userQuestion = this.userInput.toLowerCase()
      this.userInput = ''

      // Scroll to bottom
      this.$nextTick(() => this.scrollToBottom())

      // Simulate typing
      this.isTyping = true

      // Generate response
      setTimeout(() => {
        this.isTyping = false
        const response = this.generateResponse(userQuestion)
        this.addAssistantMessage(response)
      }, 1000 + Math.random() * 1000)
    },

    generateResponse(question) {
      // Simple keyword-based responses
      if (question.includes('discount') || question.includes('deal') || question.includes('save')) {
        const totalDiscount = this.discounts?.totalDiscount || 0
        if (totalDiscount > 0) {
          return `You currently have <strong>$${totalDiscount.toFixed(2)}</strong> in active discounts! ${this.discounts.appliedRules.length} rules have been automatically applied to your cart.`
        }
        return `Add items to your cart and I'll automatically find the best discounts for you. Our system checks multiple discount rules in real-time!`
      }

      if (question.includes('coupon') || question.includes('promo')) {
        if (this.availableCoupons && this.availableCoupons.length > 0) {
          return `You have <strong>${this.availableCoupons.length}</strong> coupon${this.availableCoupons.length > 1 ? 's' : ''} available! Check the "Available Coupons" section below to apply them to your order.`
        }
        return `I don't see any available coupons for your account right now. Keep shopping and check back later for exclusive deals!`
      }

      if (question.includes('recommend') || question.includes('suggest') || question.includes('product')) {
        if (this.recommendations && this.recommendations.length > 0) {
          return `Based on ${this.recommendations[0].isPurchaseBased ? 'your purchase history' : 'trending products'}, I have <strong>${this.recommendations.length}</strong> personalized recommendations for you. Check them out in the insights section!`
        }
        return `Start adding products to your cart and I'll provide personalized recommendations based on your preferences and shopping patterns.`
      }

      if (question.includes('cart') || question.includes('optimize')) {
        if (this.suggestions && this.suggestions.length > 0) {
          const totalSavings = this.suggestions
            .filter(s => s.potentialSaving)
            .reduce((sum, s) => sum + s.potentialSaving, 0)
          if (totalSavings > 0) {
            return `I've analyzed your cart and found opportunities to save an additional <strong>$${totalSavings.toFixed(2)}</strong>! Check my suggestions below.`
          }
        }
        return `Your cart looks good! Add more items and I'll analyze it for optimization opportunities and potential savings.`
      }

      if (question.includes('help') || question.includes('what') || question.includes('how')) {
        return `I'm here to help you shop smarter! I can:<br>
                • Find personalized product recommendations<br>
                • Apply automatic discounts and coupons<br>
                • Suggest cart optimizations to save money<br>
                • Answer questions about deals and promotions<br><br>
                Just ask me anything!`
      }

      // Default response
      return `I'm here to help you find the best products and deals! Try asking me about discounts, recommendations, coupons, or cart optimization.`
    },

    addAssistantMessage(content) {
      this.messages.push({
        type: 'assistant',
        content: content,
        time: this.getCurrentTime()
      })
      this.$nextTick(() => this.scrollToBottom())
    },

    getCurrentTime() {
      const now = new Date()
      return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    },

    scrollToBottom() {
      if (this.$refs.chatContainer) {
        this.$refs.chatContainer.scrollTop = this.$refs.chatContainer.scrollHeight
      }
    },

    hasDiscountMessage() {
      return this.messages.some(m => m.content.includes('discount'))
    },

    hasSuggestionMessage() {
      return this.messages.some(m => m.content.includes('suggestion'))
    },

    hasCouponMessage() {
      return this.messages.some(m => m.content.includes('coupon'))
    },

    isPurchaseBased(rec) {
      return rec.reason && (
        rec.reason.includes('Based on your previous') || 
        rec.reason.includes('Similar to items you bought') ||
        rec.reason.includes('Perfect accessory for your')
      )
    },

    applyCoupon(coupon) {
      this.$emit('apply-coupon', coupon)
      this.addAssistantMessage(`Applied coupon <strong>${coupon.code}</strong> - ${coupon.description}`)
    }
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
