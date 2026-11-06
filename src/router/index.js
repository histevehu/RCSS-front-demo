import { createRouter, createWebHistory } from 'vue-router'
import Workspace from '../pages/Workspace.vue'
export default createRouter({ history:createWebHistory(), routes:[
  {path:'/replays/:id',name:'replay',component:()=>import('../pages/Replay.vue')},
  {path:'/',name:'dashboard',component:Workspace},
  // Both routes reuse this component instance: one canvas and one shared poller.
  {path:'/tasks',name:'tasks',component:Workspace},
] })
