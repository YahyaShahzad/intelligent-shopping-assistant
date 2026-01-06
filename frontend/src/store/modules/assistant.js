export default {
  namespaced: true,

  state: {
    suggestions: [],
    recommendations: [],
    discounts: {
      totalDiscount: 0,
      appliedRules: []
    },
    message: null
  },

  mutations: {
    SET_SUGGESTIONS(state, suggestions) {
      state.suggestions = suggestions
    },
    
    SET_RECOMMENDATIONS(state, recommendations) {
      state.recommendations = recommendations
    },
    
    SET_DISCOUNTS(state, discounts) {
      state.discounts = discounts
    },
    
    SET_MESSAGE(state, message) {
      state.message = message
    },
    
    CLEAR_ASSISTANT(state) {
      state.suggestions = []
      state.recommendations = []
      state.discounts = {
        totalDiscount: 0,
        appliedRules: []
      }
      state.message = null
    }
  },

  actions: {
    async getRecommendations({ commit, rootState }) {
      try {
        const userId = rootState.session.userId
        const response = await api.get(`/assistant/${userId}`)
        
        // Handle new format with order-based recommendations
        if (response.data.items) {
          // Transform items to recommendation format
          const recommendations = response.data.items.map(item => ({
            product: item,
            name: item.name,
            price: item.price,
            reason: response.data.basedOnOrders 
              ? `Based on your previous ${response.data.orderCount} order${response.data.orderCount > 1 ? 's' : ''}` 
              : 'Trending product',
            score: item.ratings?.average ? item.ratings.average / 5 : 0.7,
            isPurchaseBased: response.data.basedOnOrders
          }))
          
          commit('SET_RECOMMENDATIONS', recommendations)
        }
        
        return response.data
      } catch (error) {
        console.error('Error getting recommendations:', error)
      }
    },

    async applyCoupon({ commit }, { sessionId, couponCode }) {
      try {
        const response = await api.post('/assistant/coupon/apply', {
          sessionId,
          couponCode
        })
        return response.data
      } catch (error) {
        console.error('Error applying coupon:', error)
        throw error
      }
    }
  },

  getters: {
    hasSuggestions: state => state.suggestions.length > 0,
    hasRecommendations: state => state.recommendations.length > 0,
    totalSavings: state => {
      return state.suggestions
        .filter(s => s.potentialSaving)
        .reduce((sum, s) => sum + s.potentialSaving, 0)
    }
  }
}
