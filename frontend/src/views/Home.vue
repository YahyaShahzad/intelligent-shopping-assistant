<template>
  <div class="home">
    <div class="hero">
      <h1>Welcome to Your Intelligent Shopping Assistant</h1>
      <p>Get personalized recommendations and smart discounts</p>
      <router-link to="/products" class="cta-button">Start Shopping</router-link>
    </div>

    <!-- Order-Based Recommendations -->
    <div v-if="recommendations.length > 0 && hasPurchaseHistory" class="recommendations-section personalized">
      <div class="section-header">
        <h2>🎯 AI Picks Just for You</h2>
        <span class="ai-powered-badge">AI Powered</span>
      </div>
      <p class="section-subtitle">
        Based on your {{ orderCount }} previous order{{ orderCount > 1 ? 's' : '' }} - Curated by our intelligent shopping assistant
      </p>
      <div class="recommendations-grid">
        <div 
          v-for="rec in recommendations" 
          :key="rec.product._id"
          class="recommendation-card personalized-card"
          @click="viewProduct(rec.product)"
        >
          <div class="product-image">
            <img 
              v-if="rec.product.images && rec.product.images.length > 0" 
              :src="rec.product.images[0]" 
              :alt="rec.product.name"
            />
            <div v-else class="image-placeholder">📦</div>
            <div class="ai-badge">AI Pick</div>
          </div>
          <div class="product-info">
            <h3>{{ rec.product.name }}</h3>
            <p class="reason personalized-reason">{{ rec.reason }}</p>
            <div class="price-row">
              <span class="price">${{ rec.product.price.toFixed(2) }}</span>
              <span v-if="rec.product.ratings" class="rating">⭐ {{ rec.product.ratings.average.toFixed(1) }}</span>
            </div>
            <div class="match-score">
              <span class="score-label">Match:</span>
              <div class="score-bar">
                <div class="score-fill" :style="{ width: (rec.score * 100) + '%' }"></div>
              </div>
              <span class="score-value">{{ (rec.score * 100).toFixed(0) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Trending Products for New Users -->
    <div v-else-if="recommendations.length > 0 && !hasPurchaseHistory" class="recommendations-section trending">
      <div class="section-header">
        <h2>🔥 Trending Products</h2>
        <span class="trending-badge">Popular Now</span>
      </div>
      <p class="section-subtitle">
        Start shopping to get personalized AI recommendations based on your preferences!
      </p>
      <div class="new-user-callout">
        <div class="callout-icon">🛍️</div>
        <div class="callout-content">
          <h3>Welcome! You haven't placed any orders yet</h3>
          <p>Browse our products and make your first purchase. Our AI will learn your preferences and suggest items you'll love!</p>
        </div>
      </div>
      <div class="recommendations-grid">
        <div 
          v-for="rec in recommendations" 
          :key="rec.product._id"
          class="recommendation-card trending-card"
          @click="viewProduct(rec.product)"
        >
          <div class="product-image">
            <img 
              v-if="rec.product.images && rec.product.images.length > 0" 
              :src="rec.product.images[0]" 
              :alt="rec.product.name"
            />
            <div v-else class="image-placeholder">📦</div>
            <div class="trending-badge-sm">Popular</div>
          </div>
          <div class="product-info">
            <h3>{{ rec.product.name }}</h3>
            <p class="reason trending-reason">{{ rec.reason }}</p>
            <div class="price-row">
              <span class="price">${{ rec.product.price.toFixed(2) }}</span>
              <span v-if="rec.product.ratings" class="rating">⭐ {{ rec.product.ratings.average.toFixed(1) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="features">
      <div class="feature">
        <div class="feature-icon">🎯</div>
        <h3>Smart Recommendations</h3>
        <p>AI-powered suggestions based on your preferences</p>
      </div>
      <div class="feature">
        <div class="feature-icon">💰</div>
        <h3>Automatic Discounts</h3>
        <p>Rule-based system applies best deals automatically</p>
      </div>
      <div class="feature">
        <div class="feature-icon">📊</div>
        <h3>Cart Optimization</h3>
        <p>Get suggestions to maximize savings</p>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'Home',
  
  computed: {
    ...mapState('assistant', ['recommendations']),
    
    hasPurchaseHistory() {
      return this.recommendations.some(rec => rec.isPurchaseBased)
    },
    
    orderCount() {
      // Extract order count from recommendation reason text
      const firstRec = this.recommendations.find(rec => rec.isPurchaseBased)
      if (firstRec && firstRec.reason) {
        const match = firstRec.reason.match(/(\d+) order/)
        return match ? parseInt(match[1]) : 0
      }
      return 0
    }
  },
  
  methods: {
    viewProduct(product) {
      this.$router.push({ name: 'ProductDetails', params: { id: product._id } })
    }
  },
  
  async mounted() {
    // Fetch personalized recommendations based on purchase history
    try {
      await this.$store.dispatch('assistant/getRecommendations')
    } catch (error) {
      console.error('Failed to fetch recommendations:', error)
    }
  }
}
</script>

<style scoped>
.home {
  flex: 1;
  padding: 2rem;
}

.hero {
  text-align: center;
  padding: 5rem 2rem;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%);
  color: white;
  border-radius: 24px;
  margin-bottom: 3rem;
  box-shadow: 0 10px 40px rgba(99, 102, 241, 0.3);
  position: relative;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/></pattern></defs><rect width="100%" height="100%" fill="url(%23grid)"/></svg>');
  opacity: 0.5;
}

.hero h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  position: relative;
  z-index: 1;
  font-weight: 800;
  letter-spacing: -1px;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.2);
}

.hero p {
  font-size: 1.4rem;
  margin-bottom: 2.5rem;
  opacity: 0.95;
  position: relative;
  z-index: 1;
}

.cta-button {
  display: inline-block;
  background: white;
  color: #6366f1;
  padding: 1.2rem 2.5rem;
  border-radius: 50px;
  text-decoration: none;
  font-weight: 700;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
  font-size: 1.1rem;
}

.cta-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  background: #f8fafc;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.feature {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  padding: 2.5rem;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.feature:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(99, 102, 241, 0.3);
  background: rgba(255, 255, 255, 0.08);
}

.feature-icon {
  font-size: 3.5rem;
  margin-bottom: 1.5rem;
  filter: drop-shadow(0 4px 10px rgba(99, 102, 241, 0.5));
}

.feature h3 {
  font-size: 1.4rem;
  margin-bottom: 0.8rem;
  color: #f8fafc;
  font-weight: 700;
}

.feature p {
  color: #cbd5e1;
  line-height: 1.6;
}

/* Recommendations Section */
.recommendations-section {
  margin: 3rem 0;
  padding: 2rem;
  border-radius: 20px;
  border: 2px solid rgba(99, 102, 241, 0.1);
}

.recommendations-section.personalized {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%);
  border-color: rgba(99, 102, 241, 0.2);
}

.recommendations-section.trending {
  background: linear-gradient(135deg, rgba(234, 179, 8, 0.05) 0%, rgba(249, 115, 22, 0.05) 100%);
  border-color: rgba(234, 179, 8, 0.2);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.recommendations-section h2 {
  font-size: 2rem;
  color: #1e293b;
  font-weight: 800;
  margin: 0;
}

.ai-powered-badge {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.trending-badge {
  background: linear-gradient(135deg, #eab308 0%, #f97316 100%);
  color: white;
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(234, 179, 8, 0.3);
}

.section-subtitle {
  color: #64748b;
  margin-bottom: 2rem;
  font-size: 1rem;
}

.new-user-callout {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
  padding: 1.5rem;
  border-radius: 16px;
  margin-bottom: 2rem;
  border: 2px solid rgba(99, 102, 241, 0.1);
}

.callout-icon {
  font-size: 3rem;
  filter: drop-shadow(0 2px 8px rgba(99, 102, 241, 0.3));
}

.callout-content h3 {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  color: #1e293b;
  font-weight: 700;
}

.callout-content p {
  color: #64748b;
  font-size: 0.95rem;
  margin: 0;
  line-height: 1.5;
}

.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.recommendation-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px solid transparent;
}

.recommendation-card.personalized-card {
  border-color: rgba(99, 102, 241, 0.1);
}

.recommendation-card.personalized-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.25);
  border-color: rgba(99, 102, 241, 0.4);
}

.recommendation-card.trending-card {
  border-color: rgba(234, 179, 8, 0.1);
}

.recommendation-card.trending-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(234, 179, 8, 0.25);
  border-color: rgba(234, 179, 8, 0.4);
}

.product-image {
  position: relative;
  height: 200px;
  background: #f8fafc;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.ai-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
}

.trending-badge-sm {
  position: absolute;
  top: 10px;
  right: 10px;
  background: linear-gradient(135deg, #eab308 0%, #f97316 100%);
  color: white;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(234, 179, 8, 0.4);
}

.product-info {
  padding: 1.2rem;
}

.product-info h3 {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  color: #1e293b;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reason {
  font-size: 0.85rem;
  margin-bottom: 0.8rem;
  font-weight: 500;
}

.reason.personalized-reason {
  color: #6366f1;
}

.reason.trending-reason {
  color: #eab308;
}

.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.price {
  font-size: 1.3rem;
  font-weight: 700;
  color: #1e293b;
}

.rating {
  font-size: 0.9rem;
  color: #64748b;
}

.match-score {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.score-label {
  color: #64748b;
  font-weight: 500;
}

.score-bar {
  flex: 1;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
  transition: width 0.3s ease;
}

.score-value {
  color: #6366f1;
  font-weight: 700;
}
</style>
