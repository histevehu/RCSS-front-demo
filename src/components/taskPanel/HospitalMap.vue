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

// 与 Map3DRenderer 保持一致的坐标系换算
const Z_SCALE = 3
const Y_AXIS = new THREE.Vector3(0, 1, 0)
function waypointToWorldVec(map, wp) {
  // Map3DRenderer: waypoint local=(x, z*Z_SCALE, -y), group pos=(offset.x, offset.z*Z_SCALE, -offset.y), group rotY=rotation
  const v = new THREE.Vector3(wp.x, (wp.z || 0) * Z_SCALE, -wp.y)
  v.applyAxisAngle(Y_AXIS, map.rotation)
  v.add(new THREE.Vector3(map.offset.x, map.offset.z * Z_SCALE, -map.offset.y))
  return v
}

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

// 根据机器人找到对应的waypoint位置（严格落在拓扑点上）
function findWaypointForRobot(robot, index) {
  const allWaypoints = []
  maps.forEach(map => {
    if (map.mapName.toLowerCase().includes('stair')) return

    map.waypoints.forEach(wp => {
      const v = waypointToWorldVec(map, wp)
      allWaypoints.push({
        ...wp,
        mapName: map.mapName,
        worldX: v.x,
        worldY: v.y,
        worldZ: v.z,
      })
    })
  })

  if (allWaypoints.length === 0) return null
  return allWaypoints[index % allWaypoints.length]
}

// 构建拓扑网络图（只包含非楼梯地图）
function buildTopoGraph() {
  const graph = new Map() // code -> { waypoint, neighbors: [code, ...], worldPos }
  const waypointByCode = new Map()
  
  // 第一步：收集所有非楼梯地图的waypoints并计算世界坐标
  maps.forEach(map => {
    // 排除楼梯地图
    if (map.mapName.toLowerCase().includes('stair')) return
    
    map.waypoints.forEach(wp => {
      const v = waypointToWorldVec(map, wp)

      const fullCode = `${map.mapName}:${wp.code}`
      const node = {
        code: fullCode,
        waypoint: wp,
        mapName: map.mapName,
        floor: map.floor,
        worldX: v.x,
        worldY: v.y,
        worldZ: v.z,
        neighbors: []
      }
      
      graph.set(fullCode, node)
      waypointByCode.set(fullCode, node)
    })
  })
  
  // 第二步：构建连接关系（只连接同图内的点）
  maps.forEach(map => {
    if (map.mapName.toLowerCase().includes('stair')) return
    
    map.waypoints.forEach(wp => {
      const fullCode = `${map.mapName}:${wp.code}`
      const node = graph.get(fullCode)
      if (!node) return
      
      // 只连接同图内的relatedPoints
      if (wp.relatedPoints && wp.relatedPoints.length > 0) {
        wp.relatedPoints.forEach(relCode => {
          const neighborFullCode = `${map.mapName}:${relCode}`
          if (graph.has(neighborFullCode)) {
            node.neighbors.push(neighborFullCode)
          }
        })
      }
    })
  })
  
  return { graph, waypointByCode }
}

// BFS找路径
function findPathBFS(graph, startCode, endCode) {
  if (!graph.has(startCode) || !graph.has(endCode)) return null
  if (startCode === endCode) return [startCode]
  
  const queue = [[startCode]]
  const visited = new Set([startCode])
  
  while (queue.length > 0) {
    const path = queue.shift()
    const current = path[path.length - 1]
    const node = graph.get(current)
    
    for (const neighbor of node.neighbors) {
      if (neighbor === endCode) {
        return [...path, neighbor]
      }
      
      if (!visited.has(neighbor)) {
        visited.add(neighbor)
        queue.push([...path, neighbor])
      }
    }
  }
  
  return null // 没找到路径
}

// 选择起点和终点（基于任务ID，确保在同一地图内）
function getTaskEndpoints(taskId, graph) {
  const nodes = Array.from(graph.values())
  if (nodes.length < 2) return null
  
  // 按地图分组
  const mapGroups = new Map()
  nodes.forEach(node => {
    if (!mapGroups.has(node.mapName)) {
      mapGroups.set(node.mapName, [])
    }
    mapGroups.get(node.mapName).push(node)
  })
  
  // 获取有足够点的地图列表
  const validMaps = Array.from(mapGroups.entries()).filter(([_, nodes]) => nodes.length >= 2)
  if (validMaps.length === 0) return null
  
  // 使用任务ID选择地图
  const hash = taskId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const mapIdx = hash % validMaps.length
  const [mapName, mapNodes] = validMaps[mapIdx]
  
  // 在该地图内选择起点和终点
  const startIdx = hash % mapNodes.length
  const endIdx = (hash * 7 + 13) % mapNodes.length
  const adjustedEndIdx = startIdx === endIdx ? (endIdx + 1) % mapNodes.length : endIdx
  
  return {
    start: mapNodes[startIdx].code,
    end: mapNodes[adjustedEndIdx].code
  }
}

// 更新任务路线可视化
function updateRouteVisual() {
  if (!renderer || !renderer.scene) return
  
  // 清除旧路线
  if (routeLine) {
    // 如果是Group，需要清理子对象
    if (routeLine.isGroup) {
      routeLine.traverse(child => {
        if (child.geometry) child.geometry.dispose()
        if (child.material) child.material.dispose()
      })
    }
    renderer.scene.remove(routeLine)
    routeLine = null
  }
  
  // 清除旧标记
  routeMarkers.forEach(m => renderer.scene.remove(m))
  routeMarkers = []
  
  if (!showRoute.value || !store.selectedTaskId) return
  
  const task = store.tasks.find(t => t.id === store.selectedTaskId)
  if (!task) return
  
  // 构建拓扑图
  const { graph, waypointByCode } = buildTopoGraph()
  
  // 获取任务的起点和终点：优先使用任务中指定的拓扑节点
  let startCode, endCode
  if (task.routeNodes && task.routeNodes.length >= 2) {
    startCode = task.routeNodes[0]
    endCode = task.routeNodes[task.routeNodes.length - 1]
  } else {
    const endpoints = getTaskEndpoints(task.id, graph)
    if (!endpoints) return
    startCode = endpoints.start
    endCode = endpoints.end
  }
  
  // BFS找路径
  const pathCodes = findPathBFS(graph, startCode, endCode)
  if (!pathCodes || pathCodes.length < 2) return
  
  // 将路径转换为3D点
  const points = pathCodes.map(code => {
    const node = waypointByCode.get(code)
    // 与 Map3DRenderer 的 topo 连线高度一致（+0.2）
    return new THREE.Vector3(node.worldX, node.worldY + 0.2, node.worldZ)
  })
  
  // 创建折线路径（每段直线连接）
  routeLine = new THREE.Group()
  
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i]
    const end = points[i + 1]
    
    // 使用直线路径
    const lineCurve = new THREE.LineCurve3(start, end)

    // 1) 外发光（更显眼）
    const glowGeometry = new THREE.TubeGeometry(lineCurve, 8, 0.22, 8, false)
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff6a00,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    })
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial)
    glowMesh.renderOrder = 999
    routeLine.add(glowMesh)

    // 2) 主路线（加粗、亮色、置顶）
    const geometry = new THREE.TubeGeometry(lineCurve, 8, 0.14, 10, false)
    const material = new THREE.MeshStandardMaterial({
      color: 0xff6a00,
      emissive: 0xff6a00,
      emissiveIntensity: 1.2,
      metalness: 0.2,
      roughness: 0.4,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      depthTest: false,
    })

    const segment = new THREE.Mesh(geometry, material)
    segment.renderOrder = 1000
    routeLine.add(segment)

    // 在每个拐点添加高亮球体（除了起点和终点）
    if (i > 0) {
      const jointGeom = new THREE.SphereGeometry(0.22, 12, 12)
      const jointMat = new THREE.MeshStandardMaterial({
        color: 0xffd166,
        emissive: 0xffd166,
        emissiveIntensity: 0.9,
        metalness: 0.0,
        roughness: 0.5,
        depthWrite: false,
        depthTest: false,
      })
      const joint = new THREE.Mesh(jointGeom, jointMat)
      joint.position.copy(start)
      joint.renderOrder = 1001
      routeLine.add(joint)

      const jointGlowGeom = new THREE.SphereGeometry(0.35, 12, 12)
      const jointGlowMat = new THREE.MeshBasicMaterial({
        color: 0xffd166,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
      })
      const jointGlow = new THREE.Mesh(jointGlowGeom, jointGlowMat)
      jointGlow.position.copy(start)
      jointGlow.renderOrder = 998
      routeLine.add(jointGlow)
    }
  }
  
  renderer.scene.add(routeLine)
  
  // 添加起点和终点标记
  addRouteMarkers(points)
}

// 添加路线起点和终点标记
let routeMarkers = []
function addRouteMarkers(points) {
  // 清除旧标记
  routeMarkers.forEach(m => renderer.scene.remove(m))
  routeMarkers = []
  
  if (points.length < 2) return
  
  // 起点标记（蓝色）
  const startGeom = new THREE.SphereGeometry(0.4, 16, 16)
  const startMat = new THREE.MeshStandardMaterial({
    color: 0x3b82f6,
    emissive: 0x3b82f6,
    emissiveIntensity: 1.0,
    depthWrite: false,
    depthTest: false,
  })
  const startMarker = new THREE.Mesh(startGeom, startMat)
  startMarker.position.copy(points[0])
  startMarker.renderOrder = 1002
  renderer.scene.add(startMarker)
  routeMarkers.push(startMarker)

  const startGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.65, 16, 16),
    new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    })
  )
  startGlow.position.copy(points[0])
  startGlow.renderOrder = 997
  renderer.scene.add(startGlow)
  routeMarkers.push(startGlow)
  
  // 终点标记（红色）
  const endGeom = new THREE.SphereGeometry(0.4, 16, 16)
  const endMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xef4444,
    emissiveIntensity: 1.0,
    depthWrite: false,
    depthTest: false,
  })
  const endMarker = new THREE.Mesh(endGeom, endMat)
  endMarker.position.copy(points[points.length - 1])
  endMarker.renderOrder = 1002
  renderer.scene.add(endMarker)
  routeMarkers.push(endMarker)

  const endGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.65, 16, 16),
    new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    })
  )
  endGlow.position.copy(points[points.length - 1])
  endGlow.renderOrder = 997
  renderer.scene.add(endGlow)
  routeMarkers.push(endGlow)
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
