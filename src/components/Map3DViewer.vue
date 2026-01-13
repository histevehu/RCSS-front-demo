<template>
  <div class="map3d-viewer">
    <!-- Control panel -->
    <div class="control-panel">
      <h3>3D Map Viewer</h3>
      
      <div v-if="loading" class="status">
        <span class="loading-spinner"></span>
        Loading...
      </div>
      
      <div v-else-if="error" class="status error">
        {{ error }}
      </div>
      
      <template v-else>
        <div class="section">
          <h4>Map List</h4>
          <div class="map-list">
            <label v-for="map in maps" :key="map.mapName" class="map-item">
              <input 
                type="checkbox" 
                :checked="mapVisibility[map.mapName]"
                @change="toggleMap(map.mapName)"
              />
              <span class="map-name">{{ map.mapName }}</span>
              <span class="map-floor">Floor: {{ map.floor }}</span>
            </label>
          </div>
        </div>
        
        <div class="section">
          <h4>Actions</h4>
          <button @click="resetCamera" class="btn">Reset View</button>
        </div>
        
        <div class="section legend">
          <h4>Legend</h4>
          <div class="legend-item">
            <span class="dot blue"></span> Start
          </div>
          <div class="legend-item">
            <span class="dot red"></span> End
          </div>
          <div class="legend-item">
            <span class="dot green"></span> Waypoint
          </div>
          <div class="legend-item">
            <span class="dot purple"></span> Cross-map connector
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
      throw new Error('No map data loaded')
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
    console.error('Initialization failed:', err)
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
