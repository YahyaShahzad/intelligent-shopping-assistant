<template>
  <div class="recommendations">
    <h2>{{ title }}</h2>
    <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
    
    <div v-if="loading" class="loading">Loading recommendations...</div>
    
    <div v-else-if="products.length > 0" class="products-carousel">
      <button v-if="canScrollLeft" class="scroll-btn left" @click="scrollLeft">❮</button>
      
      <div class="carousel-container" ref="carousel">
        <div v-for="product in products" :key="product._id" class="recommendation-card">
          <div class="image-wrapper">
            <img :src="product.images?.[0]" :alt="product.name" class="product-image" />
            <div v-if="product.originalPrice" class="discount-badge">
              -{{ Math.round((1 - product.price / product.originalPrice) * 100) }}%
            </div>
          </div>
          
          <div class="card-content">
            <h3>{{ product.name }}</h3>
            
            <div class="rating">
              <span class="stars">★★★★☆</span>
              <span class="rating-value">{{ product.ratings?.average?.toFixed(1) || 0 }}</span>
            </div>
            
            <div class="price">
              <span class="current">${{ product.price }}</span>
              <span v-if="product.originalPrice" class="original">${{ product.originalPrice }}</span>
            </div>
            
            <button 
              class="add-btn"
              @click="addToCart(product)"
              :disabled="product.stock === 0"
            >
              {{ product.stock > 0 ? 'Add to Cart' : 'Out of Stock' }}
            </button>
          </div>
        </div>
      </div>
      
      <button v-if="canScrollRight" class="scroll-btn right" @click="scrollRight">❯</button>
    </div>
    
    <div v-else class="no-products">
      No recommendations available
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';

export default {
  name: 'Recommendations',
  props: {
    title: {
      type: String,
      default: 'Recommended for You'
    },
    subtitle: String,
    type: {
      type: String,
      enum: ['personalized', 'trending', 'category'],
      default: 'personalized'
    },
    category: String,
    limit: {
      type: Number,
      default: 8
    }
  },
  data() {
    return {
      products: [],
      loading: false,
      canScrollLeft: false,
      canScrollRight: true
    };
  },
  computed: {
    ...mapState('auth', ['user']),
    ...mapState('cart', ['sessionId'])
  },
  methods: {
    ...mapActions('cart', ['addItem']),

    async loadRecommendations() {
      this.loading = true;
      try {
        let url = '/products/recommendations';
        if (this.type === 'trending') {
          url = '/products/trending';
        } else if (this.type === 'category' && this.category) {
          url = `/products/category/${this.category}`;
        }

        const response = await this.$api.get(url, {
          params: { limit: this.limit }
        });
        this.products = response.data.data || response.data;
      } catch (error) {
        console.error('Failed to load recommendations:', error);
      } finally {
        this.loading = false;
      }
    },

    async addToCart(product) {
      if (!this.user) {
        this.$emit('show-login');
        return;
      }

      try {
        await this.addItem({
          sessionId: this.sessionId,
          product: {
            productId: product._id,
            name: product.name,
            price: product.price,
            quantity: 1,
            category: product.category,
            tags: product.tags
          }
        });
        this.$emit('item-added', product.name);
      } catch (error) {
        this.$emit('error', 'Failed to add to cart');
      }
    },

    scrollLeft() {
      this.$refs.carousel.scrollBy({ left: -250, behavior: 'smooth' });
      this.checkScroll();
    },

    scrollRight() {
      this.$refs.carousel.scrollBy({ left: 250, behavior: 'smooth' });
      this.checkScroll();
    },

    checkScroll() {
      const carousel = this.$refs.carousel;
      this.canScrollLeft = carousel.scrollLeft > 0;
      this.canScrollRight = carousel.scrollLeft < carousel.scrollWidth - carousel.clientWidth - 10;
    }
  },

  mounted() {
    this.loadRecommendations();
    // Check scroll position after content loads
    this.$nextTick(() => {
      this.checkScroll();
      window.addEventListener('resize', () => this.checkScroll());
    });
  },

  beforeUnmount() {
    window.removeEventListener('resize', () => this.checkScroll());
  }
};
</script>

<style scoped>
.recommendations {
  margin: 40px 0;
  padding: 20px;
  background: white;
  border-radius: 8px;
}

h2 {
  margin-bottom: 5px;
  color: #333;
  font-size: 22px;
}

.subtitle {
  color: #999;
  font-size: 14px;
  margin-bottom: 20px;
}

.loading {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.products-carousel {
  position: relative;
  display: flex;
  align-items: center;
  gap: 15px;
}

.carousel-container {
  display: flex;
  gap: 15px;
  overflow-x: auto;
  scroll-behavior: smooth;
  flex: 1;
  padding: 10px 0;
  scrollbar-width: none;
}

.carousel-container::-webkit-scrollbar {
  display: none;
}

.recommendation-card {
  flex: 0 0 200px;
  background: #f9f9f9;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
}

.recommendation-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.image-wrapper {
  position: relative;
  height: 180px;
  overflow: hidden;
  background: #f0f0f0;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.recommendation-card:hover .product-image {
  transform: scale(1.05);
}

.discount-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #ff5252;
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.card-content {
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-content h3 {
  font-size: 14px;
  margin: 0;
  min-height: 35px;
  line-height: 1.2;
  color: #333;
}

.rating {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
}

.stars {
  color: #ffc107;
  font-size: 12px;
}

.rating-value {
  color: #666;
}

.price {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.current {
  font-size: 18px;
  font-weight: bold;
  color: #2196F3;
}

.original {
  font-size: 12px;
  color: #999;
  text-decoration: line-through;
}

.add-btn {
  width: 100%;
  padding: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: opacity 0.3s;
}

.add-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.add-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.scroll-btn {
  flex: 0 0 40px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: #2196F3;
  color: white;
  cursor: pointer;
  font-size: 18px;
  transition: background 0.3s;
  z-index: 10;
}

.scroll-btn:hover {
  background: #1976D2;
}

.scroll-btn.left {
  margin-right: -10px;
}

.scroll-btn.right {
  margin-left: -10px;
}

.no-products {
  text-align: center;
  padding: 40px;
  color: #999;
}

@media (max-width: 768px) {
  .recommendation-card {
    flex: 0 0 150px;
  }

  .scroll-btn {
    width: 35px;
    height: 35px;
    font-size: 16px;
  }

  .image-wrapper {
    height: 130px;
  }

  .card-content {
    padding: 10px;
  }

  .card-content h3 {
    font-size: 13px;
  }

  .current {
    font-size: 16px;
  }
}
</style>
