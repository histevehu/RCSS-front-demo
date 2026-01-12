<template>
  <div class="h-full flex flex-col bg-gray-900">
    <!-- 3D 地图容器 -->
    <div class="flex-1 relative overflow-hidden">
      <div ref="containerRef" class="w-full h-full"></div>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-gray-900/80">
        <div class="text-center text-white">
          <div class="loading-spinner mx-auto mb-3"></div>
          <div>加载3D地图中...</div>
        </div>
      </div>
      
      <!-- 错误状态 -->
      <div v-if="error" class="absolute inset-0 flex items-center justify-center bg-gray-900/80">
        <div class="text-center text-red-400">
          <div class="text-xl mb-2">加载失败</div>
          <div class="text-sm">{{ error }}</div>
        </div>
      </div>
      
      <!-- 提示信息 -->
      <div v-if="!loading && !error" class="absolute top-4 left-4 bg-black/60 text-white px-3 py-2 rounded text-sm">
        <div>点击左侧任务，高亮显示选中的任务路线</div>
        <div class="text-xs text-gray-400 mt-1">鼠标左键旋转 | 右键平移 | 滚轮缩放</div>
      </div>
      
      <!-- 图例 -->
      <div class="absolute top-4 right-4 bg-black/60 text-white px-3 py-2 rounded text-sm space-y-1">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-blue-500"></span>
          <span>起点</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-red-500"></span>
          <span>终点</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-green-500"></span>
          <span>中间点</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-purple-400"></span>
          <span>跨图连接点</span>
        </div>
        <div class="flex items-center gap-2 mt-2 pt-2 border-t border-gray-600">
          <span class="w-3 h-3 rounded-full bg-yellow-400"></span>
          <span>机器人</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-1 bg-orange-500 rounded"></span>
          <span>任务路线</span>
        </div>
      </div>
    </div>
    
    <!-- 控制选项 -->
    <div class="p-4 bg-gray-800 border-t border-gray-700">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-6 text-white text-sm">
          <span>显示选项:</span>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="showRobots" class="accent-blue-500">
            <span>机器人</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="showRoute" class="accent-blue-500">
            <span>路线</span>
          </label>
        </div>
        <div class="flex items-center gap-3">
          <button 
            @click="resetCamera"
            class="px-3 py-1 bg-gray-700 text-white text-sm rounded hover:bg-gray-600"
          >
            重置视角
          </button>
          <select 
            v-model="currentFloor"
            class="px-3 py-1 bg-gray-700 text-white text-sm rounded border-none"
          >
            <option value="all">全部楼层</option>
            <option v-for="floor in floors" :key="floor" :value="floor">{{ floor }}层</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAppStore } from '../../stores/appStore'
import { loadAllMaps, calculateMapOffsets } from '../../utils/mapLoader.js'
import { Map3DRenderer } from '../../utils/map3dRenderer.js'
import * as THREE from 'three'

const store = useAppStore()
const containerRef = ref(null)
const loading = ref(true)
const error = ref(null)
const showRobots = ref(true)
const showRoute = ref(true)
const currentFloor = ref('all')
const floors = ref([])

let renderer = null
let maps = []
let robotMeshes = []
let routeLine = null

// 初始化3D场景
onMounted(async () => {
  try {
    loading.value = true
    
    // 加载地图数据
    maps = await loadAllMaps('./maps')
    if (maps.length === 0) {
      throw new Error('没有加载到任何地图数据')
    }
    
    // 计算楼层列表
    const floorSet = new Set()
    maps.forEach(m => floorSet.add(m.floor))
    floors.value = Array.from(floorSet).sort((a, b) => a - b)
    
    // 计算地图对齐偏移
    calculateMapOffsets(maps, maps[0].mapName)
    
    // 初始化渲染器
    renderer = new Map3DRenderer(containerRef.value)
    renderer.init()
    renderer.setData(maps)
    
    // 添加机器人可视化
    updateRobotVisuals()
    
    // 更新store中的地图数据
    store.setMaps(maps)
    
    loading.value = false
  } catch (err) {
    console.error('初始化3D地图失败:', err)
    error.value = err.message
    loading.value = false
  }
})

onUnmounted(() => {
  if (renderer) {
    renderer.dispose()
  }
})

// 更新机器人可视化
function updateRobotVisuals() {
  if (!renderer || !renderer.scene) return
  
  // 清除旧的机器人
  robotMeshes.forEach(m => renderer.scene.remove(m))
  robotMeshes = []
  
  if (!showRobots.value) return
  
  store.robots.forEach((robot, index) => {
    // 根据机器人位置找到对应的waypoint
    const waypoint = findWaypointForRobot(robot, index)
    if (!waypoint) return
    
    // 创建机器人模型（黄色圆柱体）
    const geometry = new THREE.CylinderGeometry(0.4, 0.4, 0.8, 16)
    const material = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xfbbf24,
      emissiveIntensity: 0.5,
      metalness: 0.3,
      roughness: 0.5
    })
    const mesh = new THREE.Mesh(geometry, material)
    
    // 设置位置
    mesh.position.set(
      waypoint.worldX,
      waypoint.worldY + 0.5,
      waypoint.worldZ
    )
    
    // 添加机器人ID标签（使用sprite）
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 64
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, 128, 64)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 32px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(robot.id, 64, 42)
    
    const texture = new THREE.CanvasTexture(canvas)
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture })
    const sprite = new THREE.Sprite(spriteMaterial)
    sprite.scale.set(1.5, 0.75, 1)
    sprite.position.y = 1.2
    mesh.add(sprite)
    
    mesh.userData = { robotId: robot.id }
    renderer.scene.add(mesh)
    robotMeshes.push(mesh)
  })
}

// 根据机器人找到对应的waypoint位置
function findWaypointForRobot(robot, index) {
  // 在地图waypoints中分配位置
  let allWaypoints = []
  maps.forEach(map => {
    if (map.mapName.toLowerCase().includes('stair')) return
    
    map.waypoints.forEach(wp => {
      const cos = Math.cos(map.rotation)
      const sin = Math.sin(map.rotation)
      const worldX = wp.x * cos - wp.y * (-sin) + map.offset.x
      const worldZ = -(wp.x * sin + wp.y * cos) - map.offset.y
      const worldY = (wp.z || 0) * 3 + map.offset.z * 3
      
      allWaypoints.push({
        ...wp,
        mapName: map.mapName,
        worldX,
        worldY,
        worldZ
      })
    })
  })
  
  if (allWaypoints.length === 0) return null
  
  // 为每个机器人分配一个不同的waypoint
  return allWaypoints[index % allWaypoints.length]
}

// 更新任务路线可视化
function updateRouteVisual() {
  if (!renderer || !renderer.scene) return
  
  // 清除旧路线
  if (routeLine) {
    renderer.scene.remove(routeLine)
    routeLine = null
  }
  
  if (!showRoute.value || !store.selectedTaskId) return
  
  const task = store.tasks.find(t => t.id === store.selectedTaskId)
  if (!task || !task.route || task.route.length < 2) return
  
  // 从任务路线生成3D路径点
  const points = []
  task.route.forEach((routeStr, i) => {
    // 根据路线字符串找到对应的waypoint
    const waypoint = findWaypointByRoute(routeStr, i)
    if (waypoint) {
      points.push(new THREE.Vector3(waypoint.worldX, waypoint.worldY + 0.3, waypoint.worldZ))
    }
  })
  
  if (points.length < 2) return
  
  // 创建路线管道
  const curve = new THREE.CatmullRomCurve3(points)
  const geometry = new THREE.TubeGeometry(curve, 64, 0.15, 8, false)
  const material = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    emissive: 0xf97316,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.9
  })
  
  routeLine = new THREE.Mesh(geometry, material)
  renderer.scene.add(routeLine)
}

// 根据路线字符串找到waypoint
function findWaypointByRoute(routeStr, index) {
  let allWaypoints = []
  maps.forEach(map => {
    map.waypoints.forEach(wp => {
      const cos = Math.cos(map.rotation)
      const sin = Math.sin(map.rotation)
      const worldX = wp.x * cos - wp.y * (-sin) + map.offset.x
      const worldZ = -(wp.x * sin + wp.y * cos) - map.offset.y
      const worldY = (wp.z || 0) * 3 + map.offset.z * 3
      
      allWaypoints.push({
        ...wp,
        mapName: map.mapName,
        worldX,
        worldY,
        worldZ
      })
    })
  })
  
  if (allWaypoints.length === 0) return null
  
  // 简单分配：根据index选择不同的点
  const step = Math.floor(allWaypoints.length / 5)
  return allWaypoints[(index * step) % allWaypoints.length]
}

// 重置相机
function resetCamera() {
  if (renderer) {
    renderer.fitCamera()
  }
}

// 监听显示选项变化
watch(showRobots, updateRobotVisuals)
watch(showRoute, updateRouteVisual)
watch(() => store.selectedTaskId, updateRouteVisual)

// 监听楼层切换
watch(currentFloor, (floor) => {
  if (!renderer) return
  
  maps.forEach(map => {
    const visible = floor === 'all' || map.floor === floor
    renderer.toggleMapVisibility(map.mapName, visible)
  })
})
</script>

<style scoped>
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
