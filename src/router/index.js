import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../pages/Dashboard.vue'
import TaskPanel from '../pages/TaskPanel.vue'

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: Dashboard,
  },
  {
    path: '/tasks',
    name: 'tasks',
    component: TaskPanel,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
