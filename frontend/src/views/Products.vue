<template>
  <div class="products">
    <div class="products-header">
      <h1>Products</h1>
      <div class="filters">
        <select v-model="selectedCategory" @change="applyFilters">
          <option value="">All Categories</option>
          <option v-for="category in categories" :key="category" :value="category">
            {{ category }}
          </option>
        </select>
        <input 
          v-model="searchQuery" 
          @input="applyFilters"
          type="text" 
          placeholder="Search products..."
        />
      </div>
    </div>

    <div v-if="loading" class="loading">Loading products...</div>

    <div v-else-if="!products || products.length === 0" class="empty-state">
      <p>No products found</p>
    </div>

    <div v-else class="products-grid">
      <div 
        v-for="product in products" 
        :key="product._id || product.id"
        class="product-card"
      >
        <div class="product-image" @click="viewProduct(product)">
          <img 
            v-if="product.images && product.images.length > 0" 
            :src="product.images[0]" 
            :alt="product.name"
            @error="handleImageError"
          />
          <div v-else class="image-placeholder">📦</div>
          <div v-if="product.originalPrice && product.originalPrice > product.price" class="discount-badge">
            SALE
          </div>
          <div class="rating-badge" v-if="product.ratings && product.ratings.average">
            ⭐ {{ product.ratings.average.toFixed(1) }}
          </div>
        </div>
        <div class="product-info">
          <h3 @click="viewProduct(product)">{{ product.name }}</h3>
          <p class="description">{{ product.description }}</p>
          <p class="category">{{ product.category }}</p>
          <div class="price-row">
            <span class="price">${{ product.price.toFixed(2) }}</span>
            <span v-if="product.originalPrice && product.originalPrice > product.price" 
                  class="original-price">
              ${{ product.originalPrice.toFixed(2) }}
            </span>
            <span v-if="product.originalPrice && product.originalPrice > product.price" 
                  class="discount-percent">
              -{{ Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) }}%
            </span>
          </div>
          <div class="stock-info" :class="{'low-stock': product.stock < 10, 'out-of-stock': product.stock === 0}">
            <span v-if="product.stock === 0">Out of Stock</span>
            <span v-else-if="product.stock < 10">Only {{ product.stock }} left!</span>
            <span v-else>In Stock ({{ product.stock }})</span>
          </div>
          <div class="tags">
            <span v-for="tag in product.tags" :key="tag" class="tag">
              {{ tag }}
            </span>
          </div>
          <button 
            class="add-to-cart-btn"
            @click.stop="addToCart(product)"
            :disabled="product.stock === 0"
          >
            <span v-if="product.stock === 0">Out of Stock</span>
            <span v-else>🛒 Add to Cart</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="!loading && products.length === 0" class="no-products">
      <p>No products found</p>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  name: 'Products',

  data() {
    return {
      selectedCategory: '',
      searchQuery: ''
    }
  },

  computed: {
    ...mapState('products', ['products', 'categories', 'loading'])
  },

  async mounted() {
    await this.loadCategories()
    await this.loadProducts()
    // Fetch personalized recommendations based on purchase history
    await this.fetchRecommendations()
  },

  methods: {
    ...mapActions('products', ['loadProducts', 'loadCategories', 'setFilters']),

    async fetchRecommendations() {
      try {
        await this.$store.dispatch('assistant/getRecommendations')
      } catch (error) {
        console.error('Failed to fetch recommendations:', error)
      }
    },

    applyFilters() {
      this.setFilters({
        category: this.selectedCategory,
        search: this.searchQuery
      })
    },

    async addToCart(product) {
      try {
        if (!product) {
          console.error('Product is undefined in addToCart method')
          alert('Error: Product data is missing. Please refresh the page.')
          return
        }
        
        console.log('Adding product to cart:', product)
        
        const result = await this.$store.dispatch('cart/addItem', {
          product: product,
          quantity: 1
        })
        
        console.log('Add to cart result:', result)
        
        // Check if the add was successful
        if (result && result.success) {
          this.$emit('product-added', product)
          // Show success notification via parent component
        } else if (result && !result.success) {
          console.error('Failed to add to cart:', result.message)
          alert(result.message || 'Failed to add item to cart')
        }
      } catch (error) {
        console.error('Failed to add to cart:', error)
        alert(error.message || 'Failed to add item to cart. Please try again.')
      }
    },

    viewProduct(product) {
      this.$router.push(`/products/${product._id}`)
    },

    handleImageError(event) {
      event.target.style.display = 'none'
      event.target.parentElement.innerHTML = '<div class="image-placeholder">📦</div>'
    }
  }
}
</script>

<style scoped>
.products {
  flex: 1;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.products-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.products-header h1 {
  font-size: 2.8rem;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 900;
  text-shadow: none;
  letter-spacing: -1px;
  position: relative;
}

.products-header h1::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 80px;
  height: 4px;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-radius: 2px;
}

.filters {
  display: flex;
  gap: 1rem;
}

.filters select,
.filters input {
  padding: 0.85rem 1.2rem;
  border: 2px solid #e2e8f0;
  background: white;
  backdrop-filter: blur(20px) saturate(180%);
  border-radius: 16px;
  font-size: 1rem;
  color: #1e293b;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
}

.filters select:focus,
.filters input:focus {
  outline: none;
  border-color: #6366f1;
  background: white;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15), 0 4px 16px rgba(99, 102, 241, 0.2);
  transform: translateY(-2px);
}

.filters input {
  min-width: 250px;
}

.filters input::placeholder {
  color: #94a3b8;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #cbd5e1;
  font-size: 1.2rem;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
}

.product-card {
  background: white;
  backdrop-filter: blur(20px) saturate(180%);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.15), 
              0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border: 2px solid #e2e8f0;
  position: relative;
}

.product-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.8), transparent);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.product-card:hover {
  transform: translateY(-12px) scale(1.02);
  box-shadow: 0 20px 40px rgba(99, 102, 241, 0.25),
              0 8px 20px rgba(139, 92, 246, 0.2);
  border-color: #6366f1;
  background: #faf5ff;
}

.product-card:hover::before {
  opacity: 1;
}

.product-image {
  position: relative;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%);
  background-size: 200% 200%;
  animation: gradientMove 8s ease infinite;
  height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.product-image::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, transparent 0%, rgba(0, 0, 0, 0.1) 100%);
  pointer-events: none;
}

@keyframes gradientMove {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.product-card:hover .product-image img {
  transform: scale(1.05);
}

.image-placeholder {
  font-size: 4rem;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.3));
}

.discount-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  padding: 0.4rem 0.9rem;
  border-radius: 25px;
  font-size: 0.75rem;
  font-weight: bold;
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.rating-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 0.4rem 0.9rem;
  border-radius: 25px;
  font-size: 0.8rem;
  font-weight: bold;
  color: #1e293b;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.product-info {
  padding: 1.8rem;
}

.product-info h3 {
  font-size: 1.15rem;
  color: #0f172a;
  margin-bottom: 0.6rem;
  line-height: 1.4;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.description {
  font-size: 0.9rem;
  color: #64748b;
  margin-bottom: 0.7rem;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.category {
  font-size: 0.75rem;
  color: #6366f1;
  text-transform: uppercase;
  margin-bottom: 0.9rem;
  font-weight: 700;
  letter-spacing: 1.2px;
  background: rgba(99, 102, 241, 0.1);
  display: inline-block;
  padding: 0.3rem 0.7rem;
  border-radius: 6px;
}

.price-row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-bottom: 0.7rem;
  flex-wrap: wrap;
}

.price {
  font-size: 1.75rem;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -0.03em;
}

.original-price {
  font-size: 1.1rem;
  color: #64748b;
  text-decoration: line-through;
}

.discount-percent {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: #1e293b;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);
}

.stock-info {
  font-size: 0.9rem;
  margin-bottom: 0.9rem;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  display: inline-block;
  font-weight: 600;
}

.stock-info {
  color: #10b981;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.stock-info.low-stock {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.stock-info.out-of-stock {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.2rem;
}

.tag {
  font-size: 0.7rem;
  padding: 0.3rem 0.65rem;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%);
  backdrop-filter: blur(5px);
  border-radius: 20px;
  color: #6366f1;
  border: 1px solid rgba(99, 102, 241, 0.2);
  font-weight: 600;
  transition: all 0.2s ease;
}

.tag:hover {
  background: rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.4);
  transform: translateY(-1px);
}

.add-to-cart-btn {
  width: 100%;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  padding: 1rem 1.5rem;
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.5), 0 2px 4px -1px rgba(99, 102, 241, 0.3);
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;
}

.add-to-cart-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.add-to-cart-btn:hover::before {
  left: 100%;
}

.add-to-cart-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.5), 0 4px 6px -2px rgba(99, 102, 241, 0.4);
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
}

.add-to-cart-btn:disabled {
  background: linear-gradient(135deg, #94a3b8 0%, #cbd5e1 100%);
  cursor: not-allowed;
  box-shadow: none;
  opacity: 0.6;
}

.no-products {
  text-align: center;
  padding: 3rem;
  color: #cbd5e1;
  font-size: 1.2rem;
}
</style>
