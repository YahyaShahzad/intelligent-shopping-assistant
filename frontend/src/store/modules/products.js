import api from '../../services/api'

export default {
  namespaced: true,

  state: {
    products: [],
    categories: [],
    loading: false,
    filters: {
      category: null,
      minPrice: null,
      maxPrice: null,
      search: ''
    }
  },

  mutations: {
    SET_PRODUCTS(state, products) {
      state.products = products
    },
    
    SET_CATEGORIES(state, categories) {
      state.categories = categories
    },
    
    SET_LOADING(state, loading) {
      state.loading = loading
    },
    
    SET_FILTERS(state, filters) {
      state.filters = { ...state.filters, ...filters }
    }
  },

  actions: {
    async loadProducts({ commit, state }) {
      try {
        commit('SET_LOADING', true)
        
        const params = {}
        if (state.filters.category) params.category = state.filters.category
        if (state.filters.minPrice) params.minPrice = state.filters.minPrice
        if (state.filters.maxPrice) params.maxPrice = state.filters.maxPrice
        if (state.filters.search) params.search = state.filters.search

        const response = await api.get('/products', { params })
        commit('SET_PRODUCTS', response.data)
        
        return response.data
      } catch (error) {
        console.error('Error loading products:', error)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },

    async loadCategories({ commit }) {
      try {
        const response = await api.get('/products/meta/categories')
        commit('SET_CATEGORIES', response.data)
        return response.data
      } catch (error) {
        console.error('Error loading categories:', error)
        throw error
      }
    },

    async getProduct({ commit }, productId) {
      try {
        const response = await api.get(`/products/${productId}`)
        return response.data
      } catch (error) {
        console.error('Error getting product:', error)
        throw error
      }
    },

    setFilters({ commit, dispatch }, filters) {
      commit('SET_FILTERS', filters)
      dispatch('loadProducts')
    }
  },

  getters: {
    filteredProducts: state => {
      return state.products
    }
  }
}
