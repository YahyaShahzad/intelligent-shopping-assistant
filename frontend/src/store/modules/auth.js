import api from '../../services/api'

export default {
  namespaced: true,

  state: {
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
    isAuthenticated: !!localStorage.getItem('token')
  },

  mutations: {
    SET_AUTH(state, { token, user }) {
      state.token = token
      state.user = user
      state.isAuthenticated = true
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      
      // Set default authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    },

    CLEAR_AUTH(state) {
      state.token = null
      state.user = null
      state.isAuthenticated = false
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('userId')
      localStorage.removeItem('sessionId')
      
      // Remove authorization header
      delete api.defaults.headers.common['Authorization']
    },

    UPDATE_USER(state, user) {
      state.user = user
      localStorage.setItem('user', JSON.stringify(user))
    }
  },

  actions: {
    async register({ commit }, { email, password, name, isStudent }) {
      try {
        const response = await api.post('/auth/register', {
          email,
          password,
          name,
          isStudent
        })

        commit('SET_AUTH', {
          token: response.data.token,
          user: response.data.user
        })

        return response.data
      } catch (error) {
        throw new Error(error.response?.data?.error || 'Registration failed')
      }
    },

    async login({ commit, dispatch }, { email, password }) {
      try {
        const response = await api.post('/auth/login', {
          email,
          password
        })

        commit('SET_AUTH', {
          token: response.data.token,
          user: response.data.user
        })

        // Initialize session for the newly logged-in user
        try {
          await dispatch('session/initializeSession', null, { root: true })
          console.log('Session initialized after login')
          
          // Load cart after session is ready
          await dispatch('cart/loadCart', null, { root: true })
          console.log('Cart loaded after login')
        } catch (error) {
          console.warn('Post-login session/cart initialization failed:', error)
        }

        return response.data
      } catch (error) {
        throw new Error(error.response?.data?.error || 'Login failed')
      }
    },

    async logout({ commit, dispatch }) {
      // Clear session first
      await dispatch('session/CLEAR_SESSION', null, { root: true })
      // Clear cart
      commit('cart/CLEAR_CART', null, { root: true })
      // Then clear auth
      commit('CLEAR_AUTH')
    },

    async getCurrentUser({ commit, state }) {
      try {
        if (!state.token) return null

        const response = await api.get('/auth/me')
        commit('UPDATE_USER', response.data.user)
        return response.data.user
      } catch (error) {
        commit('CLEAR_AUTH')
        throw error
      }
    },

    async updateProfile({ commit }, userData) {
      try {
        const response = await api.put('/auth/profile', userData)
        commit('UPDATE_USER', response.data.user)
        return response.data.user
      } catch (error) {
        throw new Error(error.response?.data?.error || 'Profile update failed')
      }
    },

    // Initialize auth from localStorage
    initializeAuth({ commit, state }) {
      if (state.token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`
        commit('SET_AUTH', { token: state.token, user: state.user })
      }
    }
  },

  getters: {
    isAuthenticated: state => state.isAuthenticated,
    currentUser: state => state.user,
    userEmail: state => state.user?.email,
    isStudent: state => state.user?.isStudent || false
  }
}
