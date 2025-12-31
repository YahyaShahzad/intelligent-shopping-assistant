<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h1>🛍️ SmartShop</h1>
        <p class="tagline">Intelligent Shopping Assistant</p>
      </div>

      <div class="auth-tabs">
        <button 
          :class="['tab', { active: isLogin }]"
          @click="isLogin = true"
        >
          Login
        </button>
        <button 
          :class="['tab', { active: !isLogin }]"
          @click="isLogin = false"
        >
          Sign Up
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div v-if="!isLogin" class="form-group">
          <label for="name">Full Name</label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            placeholder="Enter your name"
            required
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            placeholder="Enter your email"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="formData.password"
            type="password"
            placeholder="Enter your password"
            minlength="6"
            required
          />
        </div>

        <div v-if="!isLogin" class="form-group checkbox">
          <label>
            <input
              v-model="formData.isStudent"
              type="checkbox"
            />
            <span>I'm a student (get exclusive discounts)</span>
          </label>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          <span v-if="!loading">{{ isLogin ? 'Login' : 'Create Account' }}</span>
          <span v-else>{{ isLogin ? 'Logging in...' : 'Creating account...' }}</span>
        </button>
      </form>

      <div class="auth-footer">
        <p v-if="isLogin">
          Don't have an account? 
          <a href="#" @click.prevent="isLogin = false">Sign up</a>
        </p>
        <p v-else>
          Already have an account? 
          <a href="#" @click.prevent="isLogin = true">Login</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'AuthView',
  
  data() {
    return {
      isLogin: true,
      formData: {
        email: '',
        password: '',
        name: '',
        isStudent: false
      },
      error: null,
      loading: false
    }
  },

  methods: {
    ...mapActions('auth', ['login', 'register']),

    async handleSubmit() {
      this.error = null
      this.loading = true

      try {
        if (this.isLogin) {
          await this.login({
            email: this.formData.email,
            password: this.formData.password
          })
        } else {
          await this.register({
            email: this.formData.email,
            password: this.formData.password,
            name: this.formData.name,
            isStudent: this.formData.isStudent
          })
        }

        // Redirect to home after successful auth
        this.$router.push('/')
      } catch (error) {
        this.error = error.message || 'Authentication failed'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  padding: 2rem;
}

.auth-card {
  background: rgba(30, 41, 59, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 3rem;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-header h1 {
  font-size: 2.5rem;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 800;
  margin-bottom: 0.5rem;
}

.tagline {
  color: #94a3b8;
  font-size: 1rem;
}

.auth-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  background: rgba(15, 23, 42, 0.5);
  padding: 0.5rem;
  border-radius: 12px;
}

.tab {
  flex: 1;
  padding: 0.75rem;
  border: none;
  background: transparent;
  color: #94a3b8;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab.active {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  color: #e2e8f0;
  font-weight: 600;
  font-size: 0.95rem;
}

.form-group input[type="text"],
.form-group input[type="email"],
.form-group input[type="password"] {
  padding: 0.95rem 1.2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  font-size: 1rem;
  color: #f8fafc;
  transition: all 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #6366f1;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.form-group.checkbox {
  flex-direction: row;
  align-items: center;
}

.form-group.checkbox label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.form-group.checkbox input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.error-message {
  padding: 0.95rem;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  color: #fca5a5;
  font-size: 0.95rem;
}

.submit-btn {
  padding: 1.1rem;
  border: none;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%);
  color: white;
  font-weight: 700;
  font-size: 1.05rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 0.5rem;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(99, 102, 241, 0.6);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-footer {
  text-align: center;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.auth-footer p {
  color: #94a3b8;
  font-size: 0.95rem;
}

.auth-footer a {
  color: #a5b4fc;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s ease;
}

.auth-footer a:hover {
  color: #c7d2fe;
}

input::placeholder {
  color: #64748b;
}
</style>
