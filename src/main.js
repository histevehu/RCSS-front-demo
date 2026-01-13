/**
 * Vue 3 app entry
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

// Create Vue app
const app = createApp(App)

// Use Pinia state management
app.use(createPinia())

// Use router
app.use(router)

// Mount to #app
app.mount('#app')
