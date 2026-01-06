<template>
  <div class="search-filters">
    <div class="search-box">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search products..."
        class="search-input"
        @input="debouncedSearch"
        @keypress.enter="performSearch"
      />
      <button class="search-btn" @click="performSearch">
        <span>🔍</span>
      </button>
    </div>

    <div class="filters-panel">
      <div class="filter-group">
        <label>Category</label>
        <select v-model="filters.category" @change="performSearch" class="filter-select">
          <option value="all">All Categories</option>
          <option value="electronics">Electronics</option>
          <option value="books">Books</option>
          <option value="clothing">Clothing</option>
          <option value="home">Home & Garden</option>
          <option value="sports">Sports</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Price Range: ${filters.minPrice || '0'} - ${filters.maxPrice || '∞'}</label>
        <div class="price-inputs">
          <input v-model.number="filters.minPrice" type="number" placeholder="Min" @change="performSearch" />
          <input v-model.number="filters.maxPrice" type="number" placeholder="Max" @change="performSearch" />
        </div>
      </div>

      <div class="filter-group">
        <label>Minimum Rating</label>
        <select v-model.number="filters.minRating" @change="performSearch" class="filter-select">
          <option :value="0">All ratings</option>
          <option :value="3">3★ and above</option>
          <option :value="4">4★ and above</option>
          <option :value="5">5★ only</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Sort By</label>
        <select v-model="filters.sortBy" @change="performSearch" class="filter-select">
          <option value="relevance">Most Relevant</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
          <option value="newest">Newest</option>
          <option value="rating">Highest Rating</option>
        </select>
      </div>

      <div class="filter-group">
        <label>
          <input v-model="filters.inStockOnly" type="checkbox" @change="performSearch" />
          In Stock Only
        </label>
      </div>

      <button class="reset-filters" @click="resetFilters">Reset Filters</button>
    </div>

    <div v-if="loading" class="loading">Searching...</div>

    <div v-else-if="searchResults.length > 0" class="search-results">
      <p class="result-count">Found {{ pagination.total }} products</p>
      
      <div class="products-grid">
        <div v-for="product in searchResults" :key="product._id" class="product-card">
          <img :src="product.images?.[0]" :alt="product.name" class="product-image" />
          <h3>{{ product.name }}</h3>
          <p class="category">{{ product.category }}</p>
          <div class="rating">
            <span class="stars">★★★★☆</span>
            <span>{{ product.ratings?.average?.toFixed(1) || 0 }}/5</span>
          </div>
          <div class="price-section">
            <span class="price">${{ product.price }}</span>
            <span v-if="product.originalPrice" class="original-price">${{ product.originalPrice }}</span>
          </div>
          <button 
            class="add-btn"
            :disabled="product.stock === 0"
            @click="addToCart(product)"
          >
            {{ product.stock > 0 ? 'Add to Cart' : 'Out of Stock' }}
          </button>
        </div>
      </div>

      <div v-if="pagination.pages > 1" class="pagination">
        <button 
          v-if="filters.page > 1"
          @click="previousPage"
          class="page-btn"
        >
          ← Previous
        </button>
        <span class="page-info">Page {{ filters.page }} of {{ pagination.pages }}</span>
        <button 
          v-if="filters.page < pagination.pages"
          @click="nextPage"
          class="page-btn"
        >
          Next →
        </button>
      </div>
    </div>

    <div v-else class="no-results">
      No products found. Try adjusting your filters.
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';

export default {
  name: 'SearchFilters',
  data() {
    return {
      searchQuery: '',
      filters: {
        category: 'all',
        minPrice: null,
        maxPrice: null,
        minRating: 0,
        sortBy: 'relevance',
        inStockOnly: false,
        page: 1,
        limit: 20
      },
      searchResults: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      loading: false,
      searchTimeout: null
    };
  },
  computed: {
    ...mapState('auth', ['user']),
    ...mapState('cart', ['sessionId'])
  },
  methods: {
    ...mapActions('cart', ['addItem']),
    
    debouncedSearch() {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.performSearch();
      }, 300);
    },

    async performSearch() {
      this.loading = true;
      try {
        const params = new URLSearchParams();
        if (this.searchQuery) params.append('q', this.searchQuery);
        if (this.filters.category !== 'all') params.append('category', this.filters.category);
        if (this.filters.minPrice) params.append('minPrice', this.filters.minPrice);
        if (this.filters.maxPrice) params.append('maxPrice', this.filters.maxPrice);
        if (this.filters.minRating > 0) params.append('minRating', this.filters.minRating);
        params.append('sortBy', this.filters.sortBy);
        if (this.filters.inStockOnly) params.append('inStockOnly', 'true');
        params.append('page', this.filters.page);
        params.append('limit', this.filters.limit);

        const response = await this.$api.get(`/products/search?${params.toString()}`);
        this.searchResults = response.data.data;
        this.pagination = response.data.pagination;
      } catch (error) {
        console.error('Search failed:', error);
        this.$emit('error', 'Search failed. Please try again.');
      } finally {
        this.loading = false;
      }
    },

    async addToCart(product) {
      if (!this.user) {
        this.$emit('error', 'Please log in first');
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
        this.$emit('success', `${product.name} added to cart!`);
      } catch (error) {
        this.$emit('error', 'Failed to add to cart');
      }
    },

    resetFilters() {
      this.searchQuery = '';
      this.filters = {
        category: 'all',
        minPrice: null,
        maxPrice: null,
        minRating: 0,
        sortBy: 'relevance',
        inStockOnly: false,
        page: 1,
        limit: 20
      };
      this.performSearch();
    },

    nextPage() {
      this.filters.page += 1;
      this.performSearch();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    previousPage() {
      if (this.filters.page > 1) {
        this.filters.page -= 1;
        this.performSearch();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  },

  mounted() {
    this.performSearch();
  }
};
</script>

<style scoped>
.search-filters {
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 30px;
}

.search-box {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #2196F3;
}

.search-btn {
  padding: 12px 20px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.3s;
}

.search-btn:hover {
  background: #1976D2;
}

.filters-panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-group label {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.filter-select,
.price-inputs input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.price-inputs {
  display: flex;
  gap: 8px;
}

.price-inputs input {
  flex: 1;
}

.reset-filters {
  padding: 8px 16px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

.reset-filters:hover {
  background: #da190b;
}

.loading,
.no-results {
  text-align: center;
  padding: 40px 20px;
  font-size: 16px;
  color: #666;
}

.loading {
  color: #2196F3;
}

.search-results {
  margin-top: 20px;
}

.result-count {
  color: #666;
  margin-bottom: 15px;
  font-size: 14px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.product-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.product-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 10px;
}

.product-card h3 {
  font-size: 14px;
  margin: 5px 0;
  min-height: 30px;
}

.category {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.rating {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  margin-bottom: 8px;
}

.stars {
  color: #ffc107;
}

.price-section {
  display: flex;
  gap: 8px;
  align-items: baseline;
  margin-bottom: 10px;
}

.price {
  font-size: 16px;
  font-weight: bold;
  color: #2196F3;
}

.original-price {
  font-size: 12px;
  color: #999;
  text-decoration: line-through;
}

.add-btn {
  width: 100%;
  padding: 8px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: background 0.3s;
  margin-top: auto;
}

.add-btn:hover:not(:disabled) {
  background: #45a049;
}

.add-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 30px;
  padding: 20px;
  background: white;
  border-radius: 8px;
}

.page-btn {
  padding: 10px 20px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

.page-btn:hover {
  background: #1976D2;
}

.page-info {
  font-weight: 600;
  color: #333;
}

@media (max-width: 768px) {
  .filters-panel {
    grid-template-columns: 1fr;
  }

  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }
}
</style>
