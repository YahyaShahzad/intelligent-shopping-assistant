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
      localStorage.removeItem('sessionId')
      localStorage.removeItem('userId')
    }
  },

  actions: {
    async initializeSession({ commit, rootState }) {
      try {
        // Get authenticated user from auth module
        const user = rootState.auth.user
        
        if (!user) {
          throw new Error('User not authenticated')
        }

        // First, try to find ANY active session for this user on the backend
        try {
          const activeSessionResponse = await api.get(`/session/user/${user._id}/active`)
          if (activeSessionResponse.data && activeSessionResponse.data.sessionId) {
            const sessionData = activeSessionResponse.data
            commit('SET_SESSION', {
              sessionId: sessionData.sessionId,
              userId: user._id,
              user: user
            })
            commit('SET_SESSION_STATE', sessionData.currentState || 'Browsing')
            localStorage.setItem('sessionId', sessionData.sessionId)
            localStorage.setItem('userId', user._id)
            console.log('Restored active session from backend:', sessionData.sessionId)
            return sessionData
          }
        } catch (e) {
          console.log('No active session found on backend, will create new one')
        }

        // Check if we have a stored session for THIS user
        const storedSessionId = localStorage.getItem('sessionId')
        const storedUserId = localStorage.getItem('userId')
        
        if (storedSessionId && storedUserId === user._id) {
          // Try to validate existing session for this user
          try {
            const response = await api.get(`/session/${storedSessionId}?userId=${user._id}`)
            // Verify session belongs to current user
            if (response.data.userId === user._id) {
              commit('SET_SESSION', {
                sessionId: storedSessionId,
                userId: user._id,
                user: user
              })
              commit('SET_SESSION_STATE', response.data.currentState)
              console.log('Restored existing session for user:', user._id, storedSessionId)
              return response.data
            }
          } catch (e) {
            console.log('Stored session invalid or belongs to different user, creating new session')
          }
        }

        // Clear any old session data from different user
        localStorage.removeItem('sessionId')
        localStorage.removeItem('userId')

        // Start new session with authenticated user
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
        localStorage.setItem('userId', user._id)
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
