import { createRouter, createWebHistory } from 'vue-router'
import Workspace from '../pages/Workspace.vue'
export default createRouter({ history:createWebHistory(), routes:[
  {path:'/',name:'dashboard',component:Workspace},
  // 旧入口保留查询和锚点，工作台只有一个页面，不重新创建地图。
  {path:'/tasks',redirect:to=>({name:'dashboard',query:to.query,hash:to.hash})},
] })
