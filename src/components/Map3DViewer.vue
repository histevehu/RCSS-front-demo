<template>
  <div class="map3d-viewer">
    <!-- 控制面板 -->
    <div class="control-panel">
      <h3>3D 地图查看器</h3>
      
      <div v-if="loading" class="status">
        <span class="loading-spinner"></span>
        加载中...
      </div>
      
      <div v-else-if="error" class="status error">
        {{ error }}
      </div>
      
      <template v-else>
        <div class="section">
          <h4>地图列表</h4>
          <div class="map-list">
            <label v-for="map in maps" :key="map.mapName" class="map-item">
              <input 
                type="checkbox" 
                :checked="mapVisibility[map.mapName]"
                @change="toggleMap(map.mapName)"
              />
              <span class="map-name">{{ map.mapName }}</span>
              <span class="map-floor">楼层: {{ map.floor }}</span>
            </label>
          </div>
        </div>
        
        <div class="section">
          <h4>操作</h4>
          <button @click="resetCamera" class="btn">重置视角</button>
        </div>
        
        <div class="section legend">
          <h4>图例</h4>
          <div class="legend-item">
            <span class="dot blue"></span> 起点
          </div>
          <div class="legend-item">
            <span class="dot red"></span> 终点
          </div>
          <div class="legend-item">
            <span class="dot green"></span> 中间点
          </div>
          <div class="legend-item">
            <span class="dot purple"></span> 跨图连接点
          </div>
        </div>
      </template>
    </div>
    
    <!-- 3D 容器 -->
    <div ref="containerRef" class="canvas-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { loadAllMaps, calculateMapOffsets } from '../utils/mapLoader.js'
import { Map3DRenderer } from '../utils/map3dRenderer.js'

const containerRef = ref(null)
const loading = ref(true)
const error = ref(null)
const maps = ref([])
const mapVisibility = ref({})

let renderer = null

onMounted(async () => {
  try {
    loading.value = true
    const allMaps = await loadAllMaps('./maps')

    if (allMaps.length === 0) {
      throw new Error('没有加载到任何地图数据')
    }

    maps.value = allMaps

    allMaps.forEach(m => {
      mapVisibility.value[m.mapName] = true
    })

    calculateMapOffsets(allMaps, allMaps[0].mapName)

    // 此时 containerRef.value 已经可用
    renderer = new Map3DRenderer(containerRef.value)
    renderer.init()
    renderer.setData(allMaps)

    loading.value = false
  } catch (err) {
    console.error('初始化失败:', err)
    error.value = err.message
    loading.value = false
  }
})

onUnmounted(() => {
  if (renderer) {
    renderer.dispose()
  }
})

function toggleMap(mapName) {
  mapVisibility.value[mapName] = !mapVisibility.value[mapName]
  if (renderer) {
    renderer.toggleMapVisibility(mapName, mapVisibility.value[mapName])
  }
}

function resetCamera() {
  if (renderer) {
    renderer.fitCamera()
  }
}
</script>
