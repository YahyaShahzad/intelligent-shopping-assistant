import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import api from './services/api'

const app = createApp(App)
app.config.globalProperties.$api = api

app
  .use(store)
  .use(router)
  .mount('#app')
