/**
 * Vue 3 应用入口
 */

import { createApp } from 'vue'
import Map3DViewer from './components/Map3DViewer.vue'
import './style.css'

// 创建 Vue 应用
const app = createApp(Map3DViewer)

// 挂载到 #app
app.mount('#app')
