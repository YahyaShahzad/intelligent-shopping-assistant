<template>
  <div class="professional-layout">
    <!-- Navigation Header -->
    <header class="navbar">
      <div class="navbar-container">
        <div class="logo-section">
          <div class="logo">🛒 ShopAssist</div>
          <span class="tagline">Smart Shopping Assistant</span>
        </div>

        <div class="search-container">
          <input
            v-model="globalSearch"
            type="text"
            placeholder="Search products..."
            class="search-input"
            @keypress.enter="performSearch"
          />
          <button class="search-icon" @click="performSearch">🔍</button>
        </div>

        <div class="nav-items">
          <router-link to="/" class="nav-link">Home</router-link>
          <router-link to="/products" class="nav-link">Shop</router-link>
          <router-link to="/orders" class="nav-link">Orders</router-link>
          
          <div class="auth-section" v-if="user">
            <span class="user-name">{{ user.name }}</span>
            <button class="profile-btn" @click="toggleProfileMenu">👤</button>
            <div v-if="showProfileMenu" class="profile-menu">
              <router-link to="/profile" class="menu-item">My Profile</router-link>
              <router-link to="/orders" class="menu-item">My Orders</router-link>
              <button @click="logout" class="menu-item logout-btn">Logout</button>
            </div>
          </div>
          
          <div class="auth-section" v-else>
            <router-link to="/auth" class="nav-link login">Login</router-link>
            <router-link to="/auth" class="nav-link signup">Sign Up</router-link>
          </div>

          <div class="cart-icon-wrapper" v-if="user">
            <router-link to="/checkout" class="cart-icon">
              🛍️
              <span class="cart-count" v-if="cartCount > 0">{{ cartCount }}</span>
            </router-link>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-container">
        <div class="footer-section">
          <h4>About Us</h4>
          <p>AI-powered shopping assistant providing personalized recommendations and smart discounts.</p>
        </div>
        
        <div class="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><router-link to="/">Home</router-link></li>
            <li><router-link to="/products">Products</router-link></li>
            <li><a href="#">FAQ</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h4>Categories</h4>
          <ul>
            <li><a href="#">Electronics</a></li>
            <li><a href="#">Books</a></li>
            <li><a href="#">Clothing</a></li>
            <li><a href="#">Home</a></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h4>Follow Us</h4>
          <div class="social-links">
            <a href="#" class="social-icon">📘</a>
            <a href="#" class="social-icon">🐦</a>
            <a href="#" class="social-icon">📷</a>
          </div>
        </div>
      </div>
      
      <div class="footer-bottom">
        <p>&copy; 2024 ShopAssist. All rights reserved. | <a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a></p>
      </div>
    </footer>

    <!-- Notifications -->
    <div v-if="notification" :class="['notification', notification.type]">
      {{ notification.message }}
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';

export default {
  name: 'ProfessionalLayout',
  data() {
    return {
      globalSearch: '',
      showProfileMenu: false,
      notification: null
    };
  },
  computed: {
    ...mapState('auth', ['user']),
    ...mapState('cart', ['items']),
    cartCount() {
      return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }
  },
  methods: {
    ...mapActions('auth', ['logout']),
    
    performSearch() {
      if (this.globalSearch.trim()) {
        this.$router.push({
          name: 'Products',
          query: { search: this.globalSearch }
        });
      }
    },

    toggleProfileMenu() {
      this.showProfileMenu = !this.showProfileMenu;
    },

    showNotification(message, type = 'info') {
      this.notification = { message, type };
      setTimeout(() => {
        this.notification = null;
      }, 3000);
    }
  },

  mounted() {
    // Listen for global events
    this.$root.$on('show-notification', this.showNotification);
  }
};
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.professional-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f5f5f5;
}

/* Navigation Bar */
.navbar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 30px;
}

.logo-section {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-shrink: 0;
}

.logo {
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
}

.tagline {
  font-size: 12px;
  opacity: 0.8;
}

.search-container {
  display: flex;
  flex: 1;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50px;
  padding: 8px 15px;
  gap: 10px;
  align-items: center;
}

.search-input {
  flex: 1;
  background: none;
  border: none;
  color: white;
  outline: none;
  font-size: 14px;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.search-icon {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 16px;
}

.nav-items {
  display: flex;
  align-items: center;
  gap: 25px;
  flex-shrink: 0;
}

.nav-link {
  color: white;
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.3s;
  font-size: 14px;
}

.nav-link:hover {
  opacity: 0.8;
}

.nav-link.login {
  padding: 8px 16px;
  border: 2px solid white;
  border-radius: 4px;
  transition: background 0.3s;
}

.nav-link.login:hover {
  background: rgba(255, 255, 255, 0.1);
}

.nav-link.signup {
  padding: 8px 16px;
  background: white;
  color: #667eea;
  border-radius: 4px;
  font-weight: 600;
  transition: opacity 0.3s;
}

.nav-link.signup:hover {
  opacity: 0.9;
}

.auth-section {
  display: flex;
  align-items: center;
  gap: 15px;
  position: relative;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
}

.profile-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background 0.3s;
}

.profile-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.profile-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 180px;
  margin-top: 10px;
  overflow: hidden;
}

.menu-item {
  display: block;
  padding: 12px 16px;
  color: #333;
  text-decoration: none;
  border: none;
  background: none;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: background 0.3s;
  font-size: 14px;
}

.menu-item:hover {
  background: #f5f5f5;
}

.menu-item.logout-btn {
  color: #f44336;
  border-top: 1px solid #eee;
}

.cart-icon-wrapper {
  position: relative;
}

.cart-icon {
  font-size: 20px;
  cursor: pointer;
  transition: transform 0.3s;
  text-decoration: none;
  position: relative;
  display: inline-block;
}

.cart-icon:hover {
  transform: scale(1.1);
}

.cart-count {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ff5252;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

/* Main Content */
.main-content {
  flex: 1;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 30px 20px;
}

/* Footer */
.footer {
  background: #2c3e50;
  color: #ecf0f1;
  padding: 40px 20px 20px;
  margin-top: 40px;
}

.footer-container {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 30px;
  margin-bottom: 30px;
}

.footer-section h4 {
  margin-bottom: 15px;
  font-size: 16px;
}

.footer-section ul {
  list-style: none;
}

.footer-section ul li {
  margin-bottom: 8px;
}

.footer-section a {
  color: #ecf0f1;
  text-decoration: none;
  transition: color 0.3s;
  font-size: 14px;
}

.footer-section a:hover {
  color: #667eea;
}

.social-links {
  display: flex;
  gap: 15px;
}

.social-icon {
  font-size: 20px;
  transition: transform 0.3s;
  display: inline-block;
}

.social-icon:hover {
  transform: scale(1.2);
}

.footer-bottom {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid rgba(236, 240, 241, 0.1);
  font-size: 12px;
}

.footer-bottom a {
  color: #667eea;
  text-decoration: none;
  transition: color 0.3s;
}

.footer-bottom a:hover {
  color: #764ba2;
}

/* Notifications */
.notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 16px 24px;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  animation: slideIn 0.3s ease-out;
  z-index: 1000;
}

.notification.success {
  background: #4CAF50;
}

.notification.error {
  background: #f44336;
}

.notification.info {
  background: #2196F3;
}

.notification.warning {
  background: #ff9800;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Responsive Design */
@media (max-width: 1024px) {
  .navbar-container {
    flex-wrap: wrap;
    gap: 15px;
  }

  .search-container {
    max-width: none;
    flex: 0 0 100%;
    order: 3;
  }

  .nav-items {
    flex: 0 0 100%;
    order: 2;
    gap: 15px;
  }
}

@media (max-width: 768px) {
  .logo-section {
    gap: 4px;
  }

  .logo {
    font-size: 18px;
  }

  .tagline {
    display: none;
  }

  .search-container {
    flex: 1;
    max-width: 100%;
    order: 2;
  }

  .nav-items {
    gap: 10px;
    order: 3;
  }

  .nav-link {
    display: none;
  }

  .nav-link:first-of-type,
  .cart-icon-wrapper {
    display: block;
  }

  .profile-btn {
    font-size: 16px;
    padding: 6px;
  }

  .footer-container {
    grid-template-columns: 1fr;
  }

  .main-content {
    padding: 15px 10px;
  }
}

@media (max-width: 480px) {
  .navbar {
    padding: 10px;
  }

  .navbar-container {
    padding: 10px;
    gap: 10px;
  }

  .search-container {
    padding: 6px 10px;
  }

  .search-input {
    font-size: 12px;
  }

  .user-name {
    display: none;
  }

  .notification {
    left: 10px;
    right: 10px;
    bottom: 10px;
  }
}
</style>
