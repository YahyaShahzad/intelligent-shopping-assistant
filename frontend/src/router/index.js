import { createRouter, createWebHistory } from 'vue-router'
import store from '../store'
import Home from '../views/Home.vue'
import Products from '../views/Products.vue'
import ProductDetails from '../views/ProductDetails.vue'
import Checkout from '../views/Checkout.vue'
import Orders from '../views/Orders.vue'
import Profile from '../views/Profile.vue'
import Auth from '../views/Auth.vue'
import AdminDashboard from '../views/AdminDashboard.vue'

const routes = [
  {
    path: '/auth',
    name: 'Auth',
    component: Auth,
    meta: { guest: true }
  },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: true }
  },
  {
    path: '/products',
    name: 'Products',
    component: Products,
    meta: { requiresAuth: true }
  },
  {
    path: '/products/:id',
    name: 'ProductDetails',
    component: ProductDetails,
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/products/:category',
    name: 'ProductsByCategory',
    component: Products,
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/checkout',
    name: 'Checkout',
    component: Checkout,
    meta: { requiresAuth: true }
  },
  {
    path: '/orders',
    name: 'Orders',
    component: Orders,
    meta: { requiresAuth: true }
  },
  {
    path: '/orders/:orderId',
    name: 'OrderDetails',
    component: Orders,
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// Navigation guards for authentication
router.beforeEach(async (to, from, next) => {
  const isAuthenticated = store.getters['auth/isAuthenticated']
  let user = store.state.auth.user
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin)
  const isGuestRoute = to.matched.some(record => record.meta.guest)

  console.log('Router guard check:', {
    route: to.path,
    isAuthenticated,
    hasUser: !!user,
    requiresAuth,
    requiresAdmin,
    isGuestRoute
  })

  // If user is not loaded but token exists, try to get user from localStorage
  if (isAuthenticated && !user) {
    const storedUser = localStorage.getItem('user')
    console.log('Loading user from localStorage:', storedUser ? 'found' : 'not found')
    if (storedUser) {
      try {
        user = JSON.parse(storedUser)
        store.commit('auth/UPDATE_USER', user)
        console.log('User loaded from localStorage:', { email: user.email, isAdmin: user.isAdmin })
      } catch (e) {
        console.error('Failed to parse stored user:', e)
      }
    }
  }

  // Debug user object
  if (user) {
    console.log('Current user:', { email: user.email, isAdmin: user.isAdmin, isStudent: user.isStudent })
  } else {
    console.log('No user object available')
  }

  if (requiresAuth && !isAuthenticated) {
    console.log('Redirecting to Auth: Not authenticated')
    next({ name: 'Auth' })
  } else if (requiresAdmin && (!user || !user.isAdmin)) {
    console.log('Admin access denied. User:', user, 'isAdmin:', user?.isAdmin)
    next({ name: 'Home' })
  } else if (isGuestRoute && isAuthenticated) {
    // Redirect authenticated users away from auth page
    if (user && user.isAdmin) {
      console.log('Redirecting admin to dashboard')
      next({ name: 'AdminDashboard' })
    } else {
      console.log('Redirecting user to home')
      next({ name: 'Home' })
    }
  } else {
    console.log('Allowing navigation to:', to.path)
    next()
  }
})

export default router
