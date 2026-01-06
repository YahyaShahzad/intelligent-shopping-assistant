<template>
  <div class="notification-toast" :class="type">
    <div class="toast-content">
      <span class="toast-icon">{{ icon }}</span>
      <p>{{ message }}</p>
    </div>
    <button class="toast-close" @click="$emit('close')">✕</button>
  </div>
</template>

<script>
export default {
  name: 'NotificationToast',
  
  props: {
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      default: 'info',
      validator: value => ['success', 'error', 'warning', 'info'].includes(value)
    }
  },

  computed: {
    icon() {
      const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
      }
      return icons[this.type]
    }
  }
}
</script>

<style scoped>
.notification-toast {
  position: fixed;
  top: 90px;
  right: 20px;
  min-width: 300px;
  background: white;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  justify-content: space-between;
  align-items: center;
  animation: slideInRight 0.3s ease-out;
  z-index: 10000;
}

@keyframes slideInRight {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.toast-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.875rem;
}

.notification-toast.success {
  border-left: 4px solid #27ae60;
}

.notification-toast.success .toast-icon {
  background: #27ae60;
  color: white;
}

.notification-toast.error {
  border-left: 4px solid #ff4757;
}

.notification-toast.error .toast-icon {
  background: #ff4757;
  color: white;
}

.notification-toast.warning {
  border-left: 4px solid #ffa502;
}

.notification-toast.warning .toast-icon {
  background: #ffa502;
  color: white;
}

.notification-toast.info {
  border-left: 4px solid #667eea;
}

.notification-toast.info .toast-icon {
  background: #667eea;
  color: white;
}

.toast-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #999;
  margin-left: 1rem;
}
</style>
