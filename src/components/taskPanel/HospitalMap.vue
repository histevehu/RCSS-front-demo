<template>
  <div class="h-full flex flex-col bg-gray-900">
    <!-- 地图区域 -->
    <div class="flex-1 relative overflow-hidden">
      <canvas ref="canvasRef" class="w-full h-full"></canvas>
      
      <!-- 地图提示文字 -->
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div class="text-center text-white/80">
          <div class="text-4xl font-bold mb-2">完整交互式</div>
          <div class="text-4xl font-bold mb-4">院区地图</div>
          <div class="text-lg text-white/60">点击左侧任务，高亮显示选中的任务路线</div>
        </div>
      </div>
      
      <!-- 机器人标记 -->
      <div 
        v-for="robot in visibleRobots" 
        :key="robot.id"
        class="absolute w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
        :style="{ left: robot.x + 'px', top: robot.y + 'px' }"
        :title="`${robot.id} - ${robot.status}`"
      >
        <div class="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-white bg-black/50 px-1 rounded whitespace-nowrap">
          {{ robot.id }}
        </div>
      </div>
      
      <!-- 路线显示 -->
      <svg 
        v-if="showRoute && selectedRoute.length > 0" 
        class="absolute inset-0 w-full h-full pointer-events-none"
      >
        <polyline 
          :points="routePoints"
          fill="none"
          stroke="#3b82f6"
          stroke-width="3"
          stroke-dasharray="10,5"
          stroke-linecap="round"
        />
        <circle 
          v-for="(point, i) in selectedRoute" 
          :key="i"
          :cx="point.x"
          :cy="point.y"
          r="6"
          fill="#ef4444"
          stroke="white"
          stroke-width="2"
        />
      </svg>
    </div>
    
    <!-- 控制选项 -->
    <div class="p-4 bg-gray-800 border-t border-gray-700">
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
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAppStore } from '../../stores/appStore'

const store = useAppStore()
const canvasRef = ref(null)
const showRobots = ref(true)
const showRoute = ref(true)

// 模拟机器人位置
const robotPositions = computed(() => {
  return store.robots.map((robot, index) => ({
    ...robot,
    x: 100 + (index % 4) * 150 + Math.random() * 50,
    y: 100 + Math.floor(index / 4) * 120 + Math.random() * 50,
  }))
})

const visibleRobots = computed(() => {
  if (!showRobots.value) return []
  return robotPositions.value
})

// 选中任务的路线点
const selectedRoute = computed(() => {
  if (!store.selectedTaskId) return []
  const task = store.tasks.find(t => t.id === store.selectedTaskId)
  if (!task) return []
  
  // 生成模拟路线点
  return task.route.map((_, i) => ({
    x: 150 + i * 180,
    y: 200 + (i % 2) * 100,
  }))
})

const routePoints = computed(() => {
  return selectedRoute.value.map(p => `${p.x},${p.y}`).join(' ')
})

// 绘制地图背景
function drawMap() {
  const canvas = canvasRef.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width
  canvas.height = rect.height
  
  // 绘制网格背景
  ctx.strokeStyle = '#374151'
  ctx.lineWidth = 1
  
  const gridSize = 40
  for (let x = 0; x < canvas.width; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, canvas.height)
    ctx.stroke()
  }
  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(canvas.width, y)
    ctx.stroke()
  }
  
  // 绘制建筑轮廓
  ctx.strokeStyle = '#6b7280'
  ctx.lineWidth = 2
  
  // A楼
  ctx.strokeRect(50, 150, 200, 250)
  ctx.fillStyle = '#1f2937'
  ctx.fillRect(52, 152, 196, 246)
  ctx.fillStyle = '#9ca3af'
  ctx.font = '14px sans-serif'
  ctx.fillText('A楼', 130, 280)
  
  // B楼
  ctx.strokeRect(300, 80, 180, 200)
  ctx.fillStyle = '#1f2937'
  ctx.fillRect(302, 82, 176, 196)
  ctx.fillStyle = '#9ca3af'
  ctx.fillText('B楼', 370, 180)
  
  // C楼
  ctx.strokeRect(320, 320, 220, 180)
  ctx.fillStyle = '#1f2937'
  ctx.fillRect(322, 322, 216, 176)
  ctx.fillStyle = '#9ca3af'
  ctx.fillText('C楼', 410, 410)
}

onMounted(() => {
  drawMap()
  window.addEventListener('resize', drawMap)
})

watch(() => store.selectedTaskId, () => {
  // 当选中任务变化时可以触发动画等效果
})
</script>
