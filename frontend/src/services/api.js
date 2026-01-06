import axios from 'axios'

// Use relative '/api' in browser so it works from any host (localhost, LAN IP, etc.) via dev proxy
const resolvedBaseURL = process.env.VUE_APP_API_URL
  || (typeof window !== 'undefined' ? '/api' : 'http://localhost:3000/api')

const api = axios.create({
  baseURL: resolvedBaseURL,
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
      console.error('API Error:', {
        status: error.response.status,
        message: error.response.data?.message || error.response.data,
        url: error.config?.url
      })
      
      // Don't automatically redirect on 401 - let components handle it
      // This prevents forced logout when there are temporary API issues
      if (error.response.status === 401) {
        console.warn('401 Unauthorized - Token may be invalid or expired')
        // Only clear if the error is from the /auth/me endpoint (token validation)
        if (error.config?.url?.includes('/auth/me')) {
          console.log('Token validation failed, clearing auth')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          localStorage.removeItem('sessionId')
          localStorage.removeItem('userId')
        }
        // Let the component or App.vue handle the redirect
      }
    } else if (error.request) {
      // Request made but no response
      console.error('No response from server:', error.message)
    } else {
      // Error in request setup
      console.error('Request error:', error.message)
    }
    
    return Promise.reject(error)
  }
)

export default api
// Helper methods for theme management
export const themeApi = {
  updateTheme: (theme) => api.put('/auth/theme', { theme }),
  getPreferences: () => api.get('/auth/preferences')
}