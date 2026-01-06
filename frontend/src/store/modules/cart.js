import api from '../../services/api'

export default {
  namespaced: true,

  state: {
    cart: {
      items: [],
      subtotal: 0,
      total: 0,
      totalDiscount: 0
    },
    evaluation: {
      discounts: [],
      suggestions: [],
      recommendations: [],
      inventoryIssues: []
    },
    loading: false
  },

  mutations: {
    SET_CART(state, cart) {
      state.cart = cart
    },
    
    SET_EVALUATION(state, evaluation) {
      state.evaluation = evaluation
    },
    
    SET_LOADING(state, loading) {
      state.loading = loading
    },
    
    CLEAR_CART(state) {
      state.cart = {
        items: [],
        subtotal: 0,
        total: 0,
        totalDiscount: 0
      }
    }
  },

  actions: {
    async addItem({ commit, rootState, dispatch }, { product, quantity = 1 }) {
      try {
        commit('SET_LOADING', true)
        
        const sessionId = rootState.session.sessionId
        
        if (!sessionId) {
          throw new Error('No active session. Please refresh the page.')
        }
        
        if (!product) {
          console.error('addItem called with undefined product')
          console.trace('Stack trace:')
          throw new Error('Product is required')
        }
        
        // Handle different product structures (direct product, or recommendation with nested product)
        const productData = product.product || product
        
        if (!productData) {
          console.error('productData is undefined after extraction')
          console.error('Original product:', product)
          throw new Error('Invalid product structure')
        }
        
        const productId = productData._id || productData.id
        
        if (!productId) {
          console.error('Product object:', product)
          console.error('Product data:', productData)
          throw new Error('Product must have an ID (_id or id property)')
        }
        
        console.log('Adding to cart:', {
          sessionId,
          productId,
          quantity,
          productData
        })
        
        const response = await api.post('/cart/add', {
          sessionId,
          userId: rootState.auth.user?._id,
          product: {
            productId,
            name: productData.name,
            price: productData.price,
            quantity: quantity,
            category: productData.category,
            tags: productData.tags || []
          }
        })

        console.log('Cart add response:', response.data)

        // Always reload cart to ensure sync
        if (response.data.success) {
          if (response.data.cart) {
            commit('SET_CART', response.data.cart)
          } else {
            // Reload cart from server if not included in response
            await dispatch('loadCart')
          }

          if (response.data.evaluation) {
            commit('SET_EVALUATION', response.data.evaluation)
            commit('assistant/SET_SUGGESTIONS', response.data.evaluation.suggestions, { root: true })
            commit('assistant/SET_RECOMMENDATIONS', response.data.evaluation.recommendations, { root: true })
            commit('assistant/SET_DISCOUNTS', response.data.evaluation.discounts, { root: true })
          }
        } else {
          // If addition failed (e.g., session completed), reload cart to reflect true state
          await dispatch('loadCart')
          throw new Error(response.data.message || 'Failed to add item to cart')
        }

        return response.data
      } catch (error) {
        console.error('Error adding to cart:', error)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },

    async addToCart({ dispatch }, { product, quantity = 1 }) {
      return dispatch('addItem', { product, quantity })
    },

    async updateCartItem({ commit, rootState }, { productId, quantity }) {
      try {
        commit('SET_LOADING', true)
        
        const sessionId = rootState.session.sessionId
        const response = await api.put('/cart/update', {
          sessionId,
          productId,
          quantity
        })

        if (response.data.cart) {
          commit('SET_CART', response.data.cart)
        }

        if (response.data.evaluation) {
          commit('SET_EVALUATION', response.data.evaluation)
        }

        return response.data
      } catch (error) {
        console.error('Error updating cart:', error)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },

    async removeFromCart({ commit, rootState }, productId) {
      try {
        commit('SET_LOADING', true)
        
        const sessionId = rootState.session.sessionId
        const response = await api.delete(`/cart/remove/${sessionId}/${productId}`)

        if (response.data.success) {
          // Reload cart
          const cartResponse = await api.get(`/cart/${sessionId}`)
          commit('SET_CART', cartResponse.data)
        }

        return response.data
      } catch (error) {
        console.error('Error removing from cart:', error)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },

    async evaluateCart({ commit, rootState }) {
      try {
        const sessionId = rootState.session.sessionId
        const response = await api.post('/cart/evaluate', { sessionId })
        
        commit('SET_EVALUATION', response.data)
        return response.data
      } catch (error) {
        console.error('Error evaluating cart:', error)
        throw error
      }
    },

    async loadCart({ commit, rootState }) {
      try {
        const sessionId = rootState.session.sessionId
        
        if (!sessionId) {
          console.log('No session ID available, skipping cart load')
          commit('SET_CART', {
            items: [],
            subtotal: 0,
            total: 0,
            totalDiscount: 0
          })
          return { items: [], subtotal: 0, total: 0, totalDiscount: 0 }
        }
        
        const response = await api.get(`/cart/${sessionId}`)
        
        if (response.data) {
          commit('SET_CART', response.data)
        }
        
        return response.data
      } catch (error) {
        console.error('Error loading cart:', error)
        // Don't throw, just return empty cart
        const emptyCart = { items: [], subtotal: 0, total: 0, totalDiscount: 0 }
        commit('SET_CART', emptyCart)
        return emptyCart
      }
    },

    async refreshCart({ dispatch }) {
      // Alias for loadCart to refresh cart data after coupon application
      return dispatch('loadCart')
    }
  },

  getters: {
    cartItemCount: state => {
      return state.cart.items.reduce((sum, item) => sum + item.quantity, 0)
    },

    cartTotal: state => state.cart.total || 0,

    hasDiscounts: state => {
      return state.evaluation.discounts && 
             state.evaluation.discounts.appliedRules && 
             state.evaluation.discounts.appliedRules.length > 0
    }
  }
}
