<template>
  <div class="map-fullscreen">
    <!-- 3D画布容器 -->
    <div ref="containerRef" class="map-canvas"></div>

    <!-- Loading state -->
    <div v-if="loading" class="map-loading">
      <div class="loading-spinner"></div>
      <span>Loading 3D map...</span>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="map-error">
      {{ error }}
    </div>

    <!-- Top-left hint -->
    <div v-if="!loading && !error" class="map-hint">
      Left mouse: rotate · Right mouse: pan · Scroll: zoom
    </div>

    <!-- Reset view button -->
    <button v-if="!loading && !error" class="map-reset-btn" @click="resetCamera">
      Reset View
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { loadAllMaps, calculateMapOffsets } from '../../utils/mapLoader.js'
import { Map3DRenderer } from '../../utils/map3dRenderer.js'

const containerRef = ref(null)
const loading = ref(true)
const error = ref(null)

let renderer = null

onMounted(async () => {
  try {
    loading.value = true
    error.value = null

    const allMaps = await loadAllMaps('./maps')
    if (allMaps.length === 0) {
      throw new Error('No map data loaded')
    }

    calculateMapOffsets(allMaps, allMaps[0].mapName)

    // 等待 DOM 更新确保容器有正确尺寸
    await nextTick()

    renderer = new Map3DRenderer(containerRef.value)
    renderer.init()
    renderer.setData(allMaps)

    // 再次延迟触发 resize 确保尺寸正确，并重新 fit 一次相机（避免首次包围盒/比例未稳定导致初始视角偏差）
    setTimeout(() => {
      if (!renderer) return
      renderer.onResize()
      renderer.fitCamera()
    }, 100)

    loading.value = false
  } catch (err) {
    console.error('初始化3D地图失败:', err)
    error.value = err?.message || String(err)
    loading.value = false
  }
})

onUnmounted(() => {
  if (renderer) {
    renderer.dispose()
  }
})

function resetCamera() {
  if (renderer) {
    renderer.fitCamera()
  }
}
</script>

<style scoped>
.map-fullscreen {
  position: absolute;
  inset: 0;
  background: #0a0e14;
}

.map-canvas {
  width: 100%;
  height: 100%;
}

.map-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: #0a0e14;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.map-error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0e14;
  color: #f87171;
  font-size: 13px;
}

.map-hint {
  position: absolute;
  top: 60px;
  left: 310px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  pointer-events: none;
}

.map-reset-btn {
  position: absolute;
  top: 60px;
  right: 330px;
  padding: 6px 14px;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  transition: all 0.15s ease;
}

.map-reset-btn:hover {
  background: rgba(30, 41, 59, 0.9);
  border-color: rgba(255, 255, 255, 0.15);
}
</style>
