import { createRouter, createWebHistory } from 'vue-router'
import Workspace from '../pages/Workspace.vue'
export default createRouter({ history:createWebHistory(), routes:[
  {path:'/',name:'dashboard',component:Workspace},
  {path:'/tasks',name:'tasks',component:Workspace},
] })
