<template>
  <div class="profile-page">
    <div class="profile-container">
      <div class="page-header">
        <h1>👤 My Profile</h1>
      </div>

      <div class="profile-content">
        <!-- User Info Card -->
        <div class="profile-card">
          <div class="card-header">
            <h2>Personal Information</h2>
            <button v-if="!editing" @click="editing = true" class="edit-btn">
              ✏️ Edit Profile
            </button>
          </div>

          <form @submit.prevent="saveProfile" class="profile-form">
            <div class="form-group">
              <label>Full Name</label>
              <input 
                v-model="profileData.name" 
                type="text" 
                :disabled="!editing"
                required
              />
            </div>

            <div class="form-group">
              <label>Email</label>
              <input 
                v-model="profileData.email" 
                type="email" 
                :disabled="!editing"
                required
              />
            </div>

            <div class="form-group">
              <label>Phone Number</label>
              <input 
                v-model="profileData.phone" 
                type="tel" 
                :disabled="!editing"
                placeholder="Enter your phone number"
              />
            </div>

            <div class="form-group checkbox-group">
              <label>
                <input 
                  v-model="profileData.isStudent" 
                  type="checkbox" 
                  :disabled="!editing"
                />
                <span>I'm a student (Get student discounts)</span>
              </label>
            </div>

            <div v-if="editing" class="form-actions">
              <button type="button" @click="cancelEdit" class="cancel-btn">
                Cancel
              </button>
              <button type="submit" class="save-btn" :disabled="saving">
                {{ saving ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Address Card -->
        <div class="profile-card">
          <div class="card-header">
            <h2>Saved Addresses</h2>
            <button @click="addAddress" class="add-btn">
              ➕ Add Address
            </button>
          </div>

          <div v-if="addresses.length === 0" class="empty-message">
            No saved addresses yet
          </div>

          <div v-else class="addresses-list">
            <div v-for="(address, index) in addresses" :key="index" class="address-item">
              <div class="address-content">
                <h4>{{ address.label }}</h4>
                <p>{{ address.street }}</p>
                <p>{{ address.city }}, {{ address.state }} {{ address.zipCode }}</p>
                <p v-if="address.phone">📱 {{ address.phone }}</p>
              </div>
              <div class="address-actions">
                <button @click="editAddress(index)" class="icon-btn">✏️</button>
                <button @click="deleteAddress(index)" class="icon-btn danger">🗑️</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Preferences Card -->
        <div class="profile-card">
          <div class="card-header">
            <h2>Shopping Preferences</h2>
          </div>

          <div class="preferences-form">
            <div class="form-group">
              <label>Preferred Categories</label>
              <div class="categories-grid">
                <label v-for="category in availableCategories" :key="category" class="category-checkbox">
                  <input 
                    type="checkbox" 
                    :value="category"
                    v-model="profileData.preferences.categories"
                  />
                  <span>{{ category }}</span>
                </label>
              </div>
            </div>

            <div class="form-group">
              <label>Price Range Preference</label>
              <div class="price-range">
                <div class="range-input">
                  <label>Min: ${{ profileData.preferences.priceRange.min }}</label>
                  <input 
                    type="range" 
                    v-model="profileData.preferences.priceRange.min" 
                    min="0" 
                    max="5000" 
                    step="50"
                  />
                </div>
                <div class="range-input">
                  <label>Max: ${{ profileData.preferences.priceRange.max }}</label>
                  <input 
                    type="range" 
                    v-model="profileData.preferences.priceRange.max" 
                    min="100" 
                    max="10000" 
                    step="100"
                  />
                </div>
              </div>
            </div>

            <div class="form-group checkbox-group">
              <label>
                <input 
                  type="checkbox" 
                  v-model="profileData.preferences.notifications"
                />
                <span>Receive email notifications about deals and offers</span>
              </label>
            </div>

            <button @click="savePreferences" class="save-btn" :disabled="saving">
              {{ saving ? 'Saving...' : 'Save Preferences' }}
            </button>
          </div>
        </div>

        <!-- Security Card -->
        <div class="profile-card">
          <div class="card-header">
            <h2>Security</h2>
          </div>

          <form @submit.prevent="changePassword" class="security-form">
            <div class="form-group">
              <label>Current Password</label>
              <input 
                v-model="passwordData.current" 
                type="password" 
                placeholder="Enter current password"
              />
            </div>

            <div class="form-group">
              <label>New Password</label>
              <input 
                v-model="passwordData.new" 
                type="password" 
                placeholder="Enter new password"
                minlength="6"
              />
            </div>

            <div class="form-group">
              <label>Confirm New Password</label>
              <input 
                v-model="passwordData.confirm" 
                type="password" 
                placeholder="Confirm new password"
              />
            </div>

            <button type="submit" class="save-btn" :disabled="saving">
              {{ saving ? 'Changing...' : 'Change Password' }}
            </button>
          </form>
        </div>

        <!-- Account Actions -->
        <div class="profile-card danger-zone">
          <div class="card-header">
            <h2>⚠️ Danger Zone</h2>
          </div>
          <p>Once you delete your account, there is no going back. Please be certain.</p>
          <button @click="deleteAccount" class="delete-account-btn">
            Delete My Account
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import api from '../services/api'

export default {
  name: 'ProfilePage',

  data() {
    return {
      editing: false,
      saving: false,
      profileData: {
        name: '',
        email: '',
        phone: '',
        isStudent: false,
        preferences: {
          categories: [],
          priceRange: { min: 0, max: 10000 },
          notifications: true
        }
      },
      addresses: [],
      passwordData: {
        current: '',
        new: '',
        confirm: ''
      },
      availableCategories: [
        'electronics',
        'accessories',
        'audio',
        'computers',
        'gaming',
        'smartphones',
        'wearables'
      ]
    }
  },

  computed: {
    ...mapGetters('auth', ['currentUser'])
  },

  mounted() {
    this.loadProfile()
  },

  methods: {
    ...mapActions('auth', ['updateProfile', 'logout']),

    loadProfile() {
      if (this.currentUser) {
        this.profileData = {
          name: this.currentUser.name || '',
          email: this.currentUser.email || '',
          phone: this.currentUser.phone || '',
          isStudent: this.currentUser.isStudent || false,
          preferences: {
            categories: this.currentUser.preferences?.categories || [],
            priceRange: this.currentUser.preferences?.priceRange || { min: 0, max: 10000 },
            notifications: this.currentUser.preferences?.notifications ?? true
          }
        }

        // Load addresses from user data or localStorage
        const savedAddresses = localStorage.getItem('userAddresses')
        if (savedAddresses) {
          this.addresses = JSON.parse(savedAddresses)
        }
      }
    },

    async saveProfile() {
      try {
        this.saving = true
        await api.put('/auth/profile', {
          name: this.profileData.name,
          email: this.profileData.email,
          phone: this.profileData.phone,
          isStudent: this.profileData.isStudent
        })

        // Update local state
        await this.$store.dispatch('auth/getCurrentUser')
        
        this.editing = false
        alert('Profile updated successfully!')
      } catch (error) {
        console.error('Error saving profile:', error)
        alert('Failed to save profile. Please try again.')
      } finally {
        this.saving = false
      }
    },

    cancelEdit() {
      this.editing = false
      this.loadProfile()
    },

    async savePreferences() {
      try {
        this.saving = true
        await api.put('/auth/profile', {
          preferences: this.profileData.preferences
        })

        alert('Preferences saved successfully!')
      } catch (error) {
        console.error('Error saving preferences:', error)
        alert('Failed to save preferences. Please try again.')
      } finally {
        this.saving = false
      }
    },

    async changePassword() {
      if (this.passwordData.new !== this.passwordData.confirm) {
        alert('New passwords do not match!')
        return
      }

      if (this.passwordData.new.length < 6) {
        alert('Password must be at least 6 characters long!')
        return
      }

      try {
        this.saving = true
        await api.put('/auth/change-password', {
          currentPassword: this.passwordData.current,
          newPassword: this.passwordData.new
        })

        this.passwordData = { current: '', new: '', confirm: '' }
        alert('Password changed successfully!')
      } catch (error) {
        console.error('Error changing password:', error)
        alert(error.response?.data?.error || 'Failed to change password. Please try again.')
      } finally {
        this.saving = false
      }
    },

    addAddress() {
      const address = {
        label: prompt('Address label (e.g., Home, Work):') || 'Home',
        street: prompt('Street address:') || '',
        city: prompt('City:') || '',
        state: prompt('State:') || '',
        zipCode: prompt('ZIP Code:') || '',
        phone: prompt('Phone number (optional):') || ''
      }

      if (address.street && address.city) {
        this.addresses.push(address)
        this.saveAddresses()
      }
    },

    editAddress(index) {
      const address = this.addresses[index]
      address.label = prompt('Address label:', address.label) || address.label
      address.street = prompt('Street address:', address.street) || address.street
      address.city = prompt('City:', address.city) || address.city
      address.state = prompt('State:', address.state) || address.state
      address.zipCode = prompt('ZIP Code:', address.zipCode) || address.zipCode
      address.phone = prompt('Phone number:', address.phone) || address.phone
      this.saveAddresses()
    },

    deleteAddress(index) {
      if (confirm('Are you sure you want to delete this address?')) {
        this.addresses.splice(index, 1)
        this.saveAddresses()
      }
    },

    saveAddresses() {
      localStorage.setItem('userAddresses', JSON.stringify(this.addresses))
    },

    async deleteAccount() {
      const confirmation = prompt('Type DELETE to confirm account deletion:')
      
      if (confirmation === 'DELETE') {
        try {
          await api.delete('/auth/account')
          alert('Your account has been deleted.')
          await this.logout()
          this.$router.push('/auth')
        } catch (error) {
          console.error('Error deleting account:', error)
          alert('Failed to delete account. Please contact support.')
        }
      }
    }
  }
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
}

.profile-container {
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2.5rem;
  color: #f8fafc;
  font-weight: 800;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.profile-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 2rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.card-header h2 {
  color: #f8fafc;
  font-size: 1.5rem;
}

.edit-btn,
.add-btn {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.edit-btn:hover,
.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(99, 102, 241, 0.4);
}

.profile-form,
.security-form,
.preferences-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  color: #e2e8f0;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #f8fafc;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-group input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #6366f1;
  background: rgba(255, 255, 255, 0.08);
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.checkbox-group input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.save-btn,
.cancel-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.save-btn {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  flex: 1;
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(34, 197, 94, 0.4);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-btn {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.cancel-btn:hover {
  background: rgba(239, 68, 68, 0.3);
}

.empty-message {
  text-align: center;
  padding: 2rem;
  color: #94a3b8;
}

.addresses-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.address-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
}

.address-content h4 {
  color: #f8fafc;
  margin-bottom: 0.5rem;
}

.address-content p {
  color: #94a3b8;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.address-actions {
  display: flex;
  gap: 0.5rem;
}

.icon-btn {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.icon-btn.danger:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.3);
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.75rem;
}

.category-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.category-checkbox:hover {
  background: rgba(255, 255, 255, 0.08);
}

.category-checkbox input {
  width: 18px;
  height: 18px;
}

.category-checkbox span {
  color: #e2e8f0;
  text-transform: capitalize;
}

.price-range {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.range-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.range-input label {
  color: #94a3b8;
  font-size: 0.9rem;
}

.range-input input[type="range"] {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  outline: none;
}

.range-input input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  background: #6366f1;
  border-radius: 50%;
  cursor: pointer;
}

.danger-zone {
  border-color: rgba(239, 68, 68, 0.3);
}

.danger-zone .card-header h2 {
  color: #ef4444;
}

.danger-zone p {
  color: #94a3b8;
  margin-bottom: 1rem;
}

.delete-account-btn {
  padding: 0.75rem 1.5rem;
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.delete-account-btn:hover {
  background: rgba(239, 68, 68, 0.3);
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .profile-page {
    padding: 1rem;
  }

  .page-header h1 {
    font-size: 2rem;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .price-range {
    grid-template-columns: 1fr;
  }

  .categories-grid {
    grid-template-columns: 1fr;
  }
}
</style>
