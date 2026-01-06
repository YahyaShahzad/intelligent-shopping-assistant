<template>
  <div class="product-details">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading product...</p>
    </div>

    <div v-else-if="product" class="product-container">
      <button @click="$router.back()" class="back-btn">
        ← Back to Products
      </button>

      <div class="product-main">
        <!-- Product Images -->
        <div class="product-gallery">
          <div class="main-image">
            <img 
              :src="selectedImage || product.images[0] || '/placeholder.jpg'" 
              :alt="product.name"
              @error="handleImageError"
            />
            <div v-if="product.originalPrice && product.originalPrice > product.price" class="discount-badge">
              -{{ Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) }}% OFF
            </div>
            <div class="rating-badge" v-if="product.ratings && product.ratings.average">
              ⭐ {{ product.ratings.average.toFixed(1) }} ({{ product.ratings.count }} reviews)
            </div>
          </div>
          <div v-if="product.images && product.images.length > 1" class="thumbnail-list">
            <img 
              v-for="(image, index) in product.images" 
              :key="index"
              :src="image"
              :class="{ active: selectedImage === image }"
              @click="selectedImage = image"
              @error="handleImageError"
            />
          </div>
        </div>

        <!-- Product Info -->
        <div class="product-info">
          <div class="product-category">{{ product.category }}</div>
          <h1 class="product-title">{{ product.name }}</h1>
          
          <div class="product-pricing">
            <div class="price-main">${{ product.price.toFixed(2) }}</div>
            <div v-if="product.originalPrice && product.originalPrice > product.price" class="price-original">
              ${{ product.originalPrice.toFixed(2) }}
            </div>
          </div>

          <div class="stock-info" :class="stockStatus">
            <span class="stock-icon">{{ stockIcon }}</span>
            <span class="stock-text">{{ stockText }}</span>
          </div>

          <div class="product-description">
            <h3>Description</h3>
            <p>{{ product.description }}</p>
          </div>

          <div v-if="product.tags && product.tags.length > 0" class="product-tags">
            <h3>Tags</h3>
            <div class="tags-list">
              <span v-for="tag in product.tags" :key="tag" class="tag">
                {{ tag }}
              </span>
            </div>
          </div>

          <div class="product-actions">
            <div class="quantity-selector">
              <button @click="decrementQuantity" :disabled="quantity <= 1">−</button>
              <input v-model.number="quantity" type="number" min="1" :max="product.stock" />
              <button @click="incrementQuantity" :disabled="quantity >= product.stock">+</button>
            </div>

            <button 
              @click="addToCart" 
              class="add-to-cart-btn"
              :disabled="product.stock === 0 || adding"
            >
              <span v-if="product.stock === 0">Out of Stock</span>
              <span v-else-if="adding">Adding...</span>
              <span v-else>🛒 Add to Cart - ${{ (product.price * quantity).toFixed(2) }}</span>
            </button>

            <button @click="buyNow" class="buy-now-btn" :disabled="product.stock === 0">
              ⚡ Buy Now
            </button>
          </div>

          <div class="product-features">
            <div class="feature">
              <span class="feature-icon">🚚</span>
              <div>
                <strong>Free Shipping</strong>
                <p>On orders over $50</p>
              </div>
            </div>
            <div class="feature">
              <span class="feature-icon">↩️</span>
              <div>
                <strong>Easy Returns</strong>
                <p>30-day return policy</p>
              </div>
            </div>
            <div class="feature">
              <span class="feature-icon">🔒</span>
              <div>
                <strong>Secure Payment</strong>
                <p>100% secure transactions</p>
              </div>
            </div>
            <div class="feature">
              <span class="feature-icon">⚡</span>
              <div>
                <strong>Fast Delivery</strong>
                <p>2-3 business days</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Related Products -->
      <div v-if="relatedProducts.length > 0" class="related-products">
        <h2>Related Products</h2>
        <div class="related-grid">
          <div 
            v-for="relatedProduct in relatedProducts" 
            :key="relatedProduct._id"
            class="related-card"
            @click="viewProduct(relatedProduct._id)"
          >
            <div class="related-image">
              <img 
                :src="relatedProduct.images?.[0] || '/placeholder.jpg'" 
                :alt="relatedProduct.name"
                @error="handleImageError"
              />
            </div>
            <div class="related-info">
              <h4>{{ relatedProduct.name }}</h4>
              <div class="related-price">${{ relatedProduct.price.toFixed(2) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="not-found">
      <h2>Product Not Found</h2>
      <p>The product you're looking for doesn't exist.</p>
      <router-link to="/products" class="shop-btn">Browse Products</router-link>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import api from '../services/api'

export default {
  name: 'ProductDetails',

  data() {
    return {
      product: null,
      relatedProducts: [],
      loading: true,
      adding: false,
      quantity: 1,
      selectedImage: null
    }
  },

  computed: {
    ...mapState('products', ['products']),

    stockStatus() {
      if (!this.product) return ''
      if (this.product.stock === 0) return 'out-of-stock'
      if (this.product.stock < 10) return 'low-stock'
      return 'in-stock'
    },

    stockIcon() {
      if (!this.product) return ''
      if (this.product.stock === 0) return '❌'
      if (this.product.stock < 10) return '⚠️'
      return '✅'
    },

    stockText() {
      if (!this.product) return ''
      if (this.product.stock === 0) return 'Out of Stock'
      if (this.product.stock < 10) return `Only ${this.product.stock} left!`
      return `In Stock (${this.product.stock} available)`
    }
  },

  watch: {
    '$route.params.id': {
      immediate: true,
      handler() {
        this.loadProduct()
      }
    }
  },

  methods: {
    async loadProduct() {
      try {
        this.loading = true
        const productId = this.$route.params.id

        // Try to get product from store first
        let product = this.products.find(p => p._id === productId)

        if (!product) {
          // Fetch from API if not in store
          const response = await api.get(`/products/${productId}`)
          product = response.data
        }

        this.product = product
        this.selectedImage = product.images?.[0] || null

        // Load related products
        await this.loadRelatedProducts()

      } catch (error) {
        console.error('Error loading product:', error)
        this.product = null
      } finally {
        this.loading = false
      }
    },

    async loadRelatedProducts() {
      if (!this.product) return

      // Get products from same category
      this.relatedProducts = this.products
        .filter(p => 
          p._id !== this.product._id && 
          p.category === this.product.category
        )
        .slice(0, 4)
    },

    incrementQuantity() {
      if (this.quantity < this.product.stock) {
        this.quantity++
      }
    },

    decrementQuantity() {
      if (this.quantity > 1) {
        this.quantity--
      }
    },

    async addToCart() {
      try {
        if (!this.product) {
          console.error('Product is not loaded')
          alert('Error: Product data is not loaded. Please refresh the page.')
          return
        }
        
        this.adding = true
        await this.$store.dispatch('cart/addItem', {
          product: this.product,
          quantity: this.quantity
        })
        alert(`${this.quantity} × ${this.product.name} added to cart!`)
      } catch (error) {
        console.error('Error adding to cart:', error)
        alert('Failed to add to cart. Please try again.')
      } finally {
        this.adding = false
      }
    },

    async buyNow() {
      await this.addToCart()
      this.$router.push('/checkout')
    },

    viewProduct(productId) {
      this.$router.push(`/products/${productId}`)
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },

    handleImageError(event) {
      event.target.src = '/placeholder.jpg'
    }
  }
}
</script>

<style scoped>
.product-details {
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
}

.product-container {
  max-width: 1400px;
  margin: 0 auto;
}

.back-btn {
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  margin-bottom: 2rem;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(-5px);
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

.product-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  margin-bottom: 4rem;
}

.product-gallery {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.main-image {
  position: relative;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  overflow: hidden;
  aspect-ratio: 1;
}

.main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.discount-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.9rem;
}

.rating-badge {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
}

.thumbnail-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 0.75rem;
}

.thumbnail-list img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 12px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.thumbnail-list img:hover,
.thumbnail-list img.active {
  border-color: #6366f1;
  transform: scale(1.05);
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.product-category {
  color: #6366f1;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.9rem;
  letter-spacing: 1px;
}

.product-title {
  font-size: 2.5rem;
  color: #f8fafc;
  font-weight: 800;
  line-height: 1.2;
}

.product-pricing {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.price-main {
  font-size: 3rem;
  font-weight: 800;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.price-original {
  font-size: 1.5rem;
  color: #94a3b8;
  text-decoration: line-through;
}

.stock-info {
  padding: 1rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
}

.stock-info.in-stock {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #22c55e;
}

.stock-info.low-stock {
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
  color: #fbbf24;
}

.stock-info.out-of-stock {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.product-description h3,
.product-tags h3 {
  color: #f8fafc;
  font-size: 1.2rem;
  margin-bottom: 0.75rem;
}

.product-description p {
  color: #cbd5e1;
  line-height: 1.7;
  font-size: 1.05rem;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  padding: 0.5rem 1rem;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.3);
  color: #818cf8;
  border-radius: 20px;
  font-size: 0.9rem;
}

.product-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.quantity-selector {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.quantity-selector button {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #f8fafc;
  border-radius: 8px;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.quantity-selector button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.quantity-selector button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.quantity-selector input {
  width: 80px;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #f8fafc;
  border-radius: 8px;
  text-align: center;
  font-size: 1.2rem;
  font-weight: 600;
}

.add-to-cart-btn,
.buy-now-btn {
  padding: 1rem 2rem;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-to-cart-btn {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
}

.add-to-cart-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(99, 102, 241, 0.5);
}

.add-to-cart-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.buy-now-btn {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
}

.buy-now-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(34, 197, 94, 0.5);
}

.product-features {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.feature {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
}

.feature-icon {
  font-size: 2rem;
}

.feature strong {
  color: #f8fafc;
  display: block;
  margin-bottom: 0.25rem;
}

.feature p {
  color: #94a3b8;
  font-size: 0.9rem;
}

.related-products {
  margin-top: 4rem;
}

.related-products h2 {
  color: #f8fafc;
  font-size: 2rem;
  margin-bottom: 2rem;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.related-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.related-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.related-image {
  aspect-ratio: 1;
  overflow: hidden;
}

.related-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.3s ease;
}

.related-card:hover .related-image img {
  transform: scale(1.1);
}

.related-info {
  padding: 1rem;
}

.related-info h4 {
  color: #f8fafc;
  margin-bottom: 0.5rem;
}

.related-price {
  color: #6366f1;
  font-size: 1.2rem;
  font-weight: 700;
}

.not-found {
  text-align: center;
  padding: 4rem 2rem;
  color: #94a3b8;
}

.not-found h2 {
  color: #f8fafc;
  font-size: 2rem;
  margin-bottom: 1rem;
}

.shop-btn {
  display: inline-block;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
  margin-top: 1rem;
  transition: all 0.3s ease;
}

.shop-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
}

@media (max-width: 968px) {
  .product-main {
    grid-template-columns: 1fr;
  }

  .product-title {
    font-size: 2rem;
  }

  .price-main {
    font-size: 2.5rem;
  }

  .product-features {
    grid-template-columns: 1fr;
  }

  .related-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}
</style>
