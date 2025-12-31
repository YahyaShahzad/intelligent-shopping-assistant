import api from '../../services/api'

export default {
  namespaced: true,

  state: {
    sessionId: null,
    userId: null,
    user: null,
    sessionState: 'Browsing'
  },

  mutations: {
    SET_SESSION(state, { sessionId, userId, user }) {
      state.sessionId = sessionId
      state.userId = userId
      state.user = user
    },
    
    SET_SESSION_STATE(state, sessionState) {
      state.sessionState = sessionState
    },
    
    CLEAR_SESSION(state) {
      state.sessionId = null
      state.userId = null
      state.user = null
      state.sessionState = 'Browsing'
    }
  },

  actions: {
    async initializeSession({ commit, rootState }) {
      try {
        // Check if we already have a session in localStorage
        const storedSessionId = localStorage.getItem('sessionId')
        if (storedSessionId) {
          // Try to validate existing session
          try {
            const response = await api.get(`/session/${storedSessionId}`)
            const user = rootState.auth.user
            commit('SET_SESSION', {
              sessionId: storedSessionId,
              userId: user?._id || response.data.userId,
              user: user
            })
            commit('SET_SESSION_STATE', response.data.currentState)
            console.log('Restored existing session:', storedSessionId)
            return response.data
          } catch (e) {
            // Session is invalid, clear it and create new one
            console.log('Stored session invalid, creating new session')
            localStorage.removeItem('sessionId')
          }
        }

        // Get authenticated user from auth module
        const user = rootState.auth.user
        
        if (!user) {
          throw new Error('User not authenticated')
        }

        // Start session with authenticated user
        console.log('Starting new session for user:', user._id)
        const response = await api.post('/session/start', { 
          userId: user._id,
          userData: {
            id: user._id,
            name: user.name,
            email: user.email,
            isStudent: user.isStudent,
            preferences: user.preferences || {
              categories: [],
              priceRange: { min: 0, max: 10000 }
            },
            browsingHistory: user.browsingHistory || []
          }
        })
        
        commit('SET_SESSION', {
          sessionId: response.data.sessionId,
          userId: user._id,
          user: user
        })

        localStorage.setItem('sessionId', response.data.sessionId)
        console.log('New session created:', response.data.sessionId)
        
        return response.data
      } catch (error) {
        console.error('Error initializing session:', error)
        throw error
      }
    },

    async getSession({ commit, state }) {
      try {
        const response = await api.get(`/session/${state.sessionId}`)
        commit('SET_SESSION_STATE', response.data.currentState)
        return response.data
      } catch (error) {
        console.error('Error getting session:', error)
        throw error
      }
    }
  },

  getters: {
    isSessionActive: state => state.sessionId !== null
  }
}
