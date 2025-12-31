import { createRouter, createWebHistory } from 'vue-router'
import store from '../store'
import Home from '../views/Home.vue'
import Products from '../views/Products.vue'
import ProductDetails from '../views/ProductDetails.vue'
import Checkout from '../views/Checkout.vue'
import Orders from '../views/Orders.vue'
import Profile from '../views/Profile.vue'
import Auth from '../views/Auth.vue'

const routes = [
  {
    path: '/auth',
    name: 'Auth',
    component: Auth,
    meta: { guest: true }
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
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const isGuestRoute = to.matched.some(record => record.meta.guest)

  if (requiresAuth && !isAuthenticated) {
    // Redirect to auth if trying to access protected route
    next({ name: 'Auth' })
  } else if (isGuestRoute && isAuthenticated) {
    // Redirect to home if already authenticated
    next({ name: 'Home' })
  } else {
    next()
  }
})

export default router
