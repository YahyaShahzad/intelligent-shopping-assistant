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
        commit('SET_RECOMMENDATIONS', response.data.items || [])
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
