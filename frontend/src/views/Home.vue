<template>
  <div class="home">
    <div class="hero">
      <h1>Welcome to Your Intelligent Shopping Assistant</h1>
      <p>Get personalized recommendations and smart discounts</p>
      <router-link to="/products" class="cta-button">Start Shopping</router-link>
    </div>

    <div class="features">
      <div class="feature">
        <div class="feature-icon">🎯</div>
        <h3>Smart Recommendations</h3>
        <p>AI-powered suggestions based on your preferences</p>
      </div>
      <div class="feature">
        <div class="feature-icon">💰</div>
        <h3>Automatic Discounts</h3>
        <p>Rule-based system applies best deals automatically</p>
      </div>
      <div class="feature">
        <div class="feature-icon">📊</div>
        <h3>Cart Optimization</h3>
        <p>Get suggestions to maximize savings</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home',
  
  async mounted() {
    // Fetch personalized recommendations based on purchase history
    try {
      await this.$store.dispatch('assistant/getRecommendations')
    } catch (error) {
      console.error('Failed to fetch recommendations:', error)
    }
  }
}
</script>

<style scoped>
.home {
  flex: 1;
  padding: 2rem;
}

.hero {
  text-align: center;
  padding: 5rem 2rem;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%);
  color: white;
  border-radius: 24px;
  margin-bottom: 3rem;
  box-shadow: 0 10px 40px rgba(99, 102, 241, 0.3);
  position: relative;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/></pattern></defs><rect width="100%" height="100%" fill="url(%23grid)"/></svg>');
  opacity: 0.5;
}

.hero h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  position: relative;
  z-index: 1;
  font-weight: 800;
  letter-spacing: -1px;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.2);
}

.hero p {
  font-size: 1.4rem;
  margin-bottom: 2.5rem;
  opacity: 0.95;
  position: relative;
  z-index: 1;
}

.cta-button {
  display: inline-block;
  background: white;
  color: #6366f1;
  padding: 1.2rem 2.5rem;
  border-radius: 50px;
  text-decoration: none;
  font-weight: 700;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
  font-size: 1.1rem;
}

.cta-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  background: #f8fafc;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.feature {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  padding: 2.5rem;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.feature:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(99, 102, 241, 0.3);
  background: rgba(255, 255, 255, 0.08);
}

.feature-icon {
  font-size: 3.5rem;
  margin-bottom: 1.5rem;
  filter: drop-shadow(0 4px 10px rgba(99, 102, 241, 0.5));
}

.feature h3 {
  font-size: 1.4rem;
  margin-bottom: 0.8rem;
  color: #f8fafc;
  font-weight: 700;
}

.feature p {
  color: #cbd5e1;
  line-height: 1.6;
}
</style>
