import { createStore } from 'vuex'
import auth from './modules/auth'
import session from './modules/session'
import cart from './modules/cart'
import products from './modules/products'
import assistant from './modules/assistant'
import socket from './modules/socket'

export default createStore({
  modules: {
    auth,
    session,
    cart,
    products,
    assistant,
    socket
  },
  
  strict: process.env.NODE_ENV !== 'production'
})
