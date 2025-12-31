import axios from 'axios'

const api = axios.create({
  baseURL: process.env.VUE_APP_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: false
})

// Request interceptor
api.interceptors.request.use(
  config => {
    // Add auth token if available
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  response => {
    return response
  },
  error => {
    if (error.response) {
      // Server responded with error
      console.error('API Error:', error.response.data)
      
      if (error.response.status === 401) {
        // Handle unauthorized
        localStorage.removeItem('token')
        localStorage.removeItem('sessionId')
        localStorage.removeItem('userId')
        window.location.href = '/auth'
      }
    } else if (error.request) {
      // Request made but no response
      console.error('No response from server')
    } else {
      // Error in request setup
      console.error('Request error:', error.message)
    }
    
    return Promise.reject(error)
  }
)

export default api
