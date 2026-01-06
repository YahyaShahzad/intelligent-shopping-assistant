import io from 'socket.io-client'

let socket = null

export default {
  namespaced: true,

  state: {
    connected: false,
    socket: null
  },

  mutations: {
    SET_CONNECTED(state, connected) {
      state.connected = connected
    },
    
    SET_SOCKET(state, socketInstance) {
      state.socket = socketInstance
    }
  },

  actions: {
    connectWebSocket({ commit, rootState, dispatch }) {
      const socketURL = process.env.VUE_APP_SOCKET_URL ||
        (typeof window !== 'undefined'
          ? `${window.location.protocol}//${window.location.hostname}:3000`
          : 'http://localhost:3000')
      
      socket = io(socketURL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      })

      socket.on('connect', () => {
        console.log('Socket connected:', socket.id)
        commit('SET_CONNECTED', true)
        
        // Join session room
        const sessionId = rootState.session.sessionId
        if (sessionId) {
          socket.emit('join-session', sessionId)
        }
      })

      socket.on('disconnect', () => {
        console.log('Socket disconnected')
        commit('SET_CONNECTED', false)
      })

      // Cart updated event
      socket.on('cart:updated', (data) => {
        commit('cart/SET_CART', data.cart, { root: true })
        commit('cart/SET_EVALUATION', data.evaluation, { root: true })
      })

      // Suggestions updated
      socket.on('suggestions:update', (suggestions) => {
        commit('assistant/SET_SUGGESTIONS', suggestions, { root: true })
      })

      // Recommendations updated
      socket.on('recommendations:update', (recommendations) => {
        commit('assistant/SET_RECOMMENDATIONS', recommendations, { root: true })
      })

      // Session alive check
      socket.on('session:alive', (data) => {
        commit('session/SET_SESSION_STATE', data.state, { root: true })
      })

      // Error handling
      socket.on('error', (error) => {
        console.error('Socket error:', error)
      })

      commit('SET_SOCKET', socket)
    },

    emitCartUpdate({ rootState }, { action, payload }) {
      if (socket && socket.connected) {
        socket.emit('cart:update', {
          sessionId: rootState.session.sessionId,
          action,
          payload
        })
      }
    },

    requestRuleEvaluation({ rootState }) {
      if (socket && socket.connected) {
        socket.emit('rules:request', {
          sessionId: rootState.session.sessionId
        })
      }
    },

    sendHeartbeat({ rootState }) {
      if (socket && socket.connected) {
        socket.emit('session:heartbeat', rootState.session.sessionId)
      }
    },

    disconnectWebSocket({ commit }) {
      if (socket) {
        socket.disconnect()
        socket = null
        commit('SET_SOCKET', null)
        commit('SET_CONNECTED', false)
      }
    }
  }
}
