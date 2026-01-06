<template>
  <header class="header">
    <div class="container">
      <div class="logo">
        <router-link to="/" class="logo-link">
          <h1>🛍️ SmartShop</h1>
        </router-link>
      </div>
      
      <nav class="nav">
        <router-link v-if="user && user.isAdmin" to="/admin" class="nav-link admin-link">
          🔐 Admin Dashboard
        </router-link>
        <router-link v-else to="/" class="nav-link">Home</router-link>
        <router-link to="/products" class="nav-link">Products</router-link>
        <router-link to="/orders" class="nav-link">My Orders</router-link>
        <router-link to="/profile" class="nav-link">Profile</router-link>
      </nav>

      <div class="header-actions">
        <div class="user-info" v-if="user">
          <span class="user-name">
            {{ user.isAdmin ? '👑 Admin User' : '👤 ' + user.name }}
          </span>
          <span v-if="user.isStudent" class="student-badge">🎓 Student</span>
        </div>

        <div class="cart-button" @click="$emit('toggle-cart')">
          🛒 Cart
          <span v-if="cartCount > 0" class="badge">{{ cartCount }}</span>
        </div>

        <button class="logout-btn" @click="$emit('logout')" title="Logout">
          🚪 Logout
        </button>
      </div>
    </div>
  </header>
</template>

<script>
export default {
  name: 'Header',
  props: {
    cartCount: {
      type: Number,
      default: 0
    },
    user: {
      type: Object,
      default: null
    }
  }
}
</script>

<style scoped>
.header {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
  color: white;
  padding: 1.2rem 0;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3), 0 2px 8px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  position: sticky;
  top: 0;
  z-index: 100;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-link {
  text-decoration: none;
  color: white;
}

.logo h1 {
  font-size: 1.65rem;
  font-weight: 800;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 40px rgba(255, 255, 255, 0.3);
  letter-spacing: -0.5px;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.logo-link:hover h1 {
  transform: scale(1.05) translateY(-2px);
  filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.8));
}

.nav {
  display: flex;
  gap: 2rem;
}

.nav-link {
  color: white;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  position: relative;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 2px;
  background: white;
  transition: width 0.3s ease;
}

.nav-link.router-link-active {
  background: rgba(255, 255, 255, 0.2);
  font-weight: 700;
}

.nav-link.router-link-active::after {
  width: 80%;
}

.nav-link:hover::after {
  width: 80%;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
}

:root #app.theme-dark .header {
  background: linear-gradient(135deg, #1d4ed8 0%, #4c1d95 50%, #831843 100%);
  border-bottom-color: rgba(100, 116, 139, 0.3);
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.5), 0 2px 8px rgba(0, 0, 0, 0.4);
}

.admin-link {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  font-weight: 700;
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.admin-link:hover {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.student-badge {
  background: rgba(251, 191, 36, 0.3);
  padding: 0.3rem 0.7rem;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid rgba(251, 191, 36, 0.5);
}

.cart-button {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.7rem 1.5rem;
  border-radius: 30px;
  cursor: pointer;
  font-weight: 600;
  position: relative;
  transition: all 0.3s ease;
  border: 2px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
}

.cart-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.logout-btn {
  background: rgba(239, 68, 68, 0.2);
  border: 2px solid rgba(239, 68, 68, 0.3);
  color: white;
  padding: 0.7rem 1rem;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.3s ease;
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(239, 68, 68, 0.3);
}

.badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
  box-shadow: 0 2px 10px rgba(239, 68, 68, 0.5);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* Mobile Responsive Styles */
@media (max-width: 768px) {
  .header {
    padding: 0.8rem 0;
  }

  .container {
    padding: 0 1rem;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .logo h1 {
    font-size: 1.3rem;
  }

  .nav {
    gap: 0.5rem;
    font-size: 0.9rem;
  }

  .nav-link {
    padding: 0.4rem 0.8rem;
  }

  .header-actions {
    gap: 0.5rem;
  }

  .cart-btn, .logout-btn {
    padding: 0.5rem 0.8rem;
    font-size: 0.85rem;
  }

  .badge {
    width: 20px;
    height: 20px;
    font-size: 0.65rem;
  }
}

@media (max-width: 480px) {
  .logo h1 {
    font-size: 1.1rem;
  }

  .nav {
    width: 100%;
    justify-content: center;
    order: 3;
  }

  .nav-link {
    padding: 0.3rem 0.6rem;
    font-size: 0.85rem;
  }
}

/* Dark theme overrides for header */
#app.theme-dark .logout-btn {
  background: rgba(185, 28, 28, 0.2);
  border-color: rgba(220, 38, 38, 0.4);
}

#app.theme-dark .logout-btn:hover {
  background: rgba(220, 38, 38, 0.3);
  box-shadow: 0 5px 15px rgba(220, 38, 38, 0.4);
}

#app.theme-dark .cart-button {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.3);
}

#app.theme-dark .cart-button:hover {
  background: rgba(59, 130, 246, 0.25);
  box-shadow: 0 5px 15px rgba(59, 130, 246, 0.3);
}

#app.theme-dark .student-badge {
  background: rgba(99, 102, 241, 0.2);
  border-color: rgba(99, 102, 241, 0.4);
  color: #a5f3fc;
}
</style>
