<template>
  <header ref="headerElement" class="header">
    <div class="header-inner">
      <div class="header-left">
        <h1 class="header-title">{{ title }}</h1>
        <span class="demo-mode">Live Scheduling · Simulated Execution</span>
      </div>

      <div class="header-right">
        <div class="status-indicator">
          <span class="status-dot"></span>
          <span class="status-text">{{ store.connected ? (store.clock.paused ? 'Paused' : 'Connected') : 'Disconnected' }}</span>
        </div>
        <div class="header-time">{{ currentTimeStr }}</div>
        <button :disabled="!store.connected || store.busy" @click="store.control({ paused: !store.clock.paused })">{{ store.clock.paused ? 'Resume' : 'Pause' }}</button>
        <select aria-label="Demo speed" :value="store.clock.speed" :disabled="!store.connected || store.busy" @change="store.control({ speed: Number($event.target.value) })"><option v-for="speed in [1,2,5,10]" :key="speed" :value="speed">{{ speed }}×</option></select>
        <button :disabled="!store.connected || store.busy" @click="store.control({}, true)">Reset Demo</button>
        <router-link :to="$route.path === '/' ? '/tasks' : '/'">{{ $route.path === '/' ? 'Task Panel' : 'Dashboard' }}</router-link>
        <slot name="actions"></slot>
      </div>
    </div>
    <div v-if="store.error" class="demo-error" role="alert">{{ store.error }}</div>
  </header>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '../../stores/appStore'

defineProps({
  title: {
    type: String,
    default: 'Task Dispatch Center'
  }
})

const headerElement = ref(null)
let observer
onMounted(() => {
  observer = new ResizeObserver(() => document.documentElement.style.setProperty('--header-height', `${headerElement.value.offsetHeight}px`))
  observer.observe(headerElement.value)
})
onUnmounted(() => observer?.disconnect())
const store = useAppStore()
const currentTimeStr = computed(() => store.currentTime.toLocaleTimeString('en-GB', {timeZone:'Asia/Shanghai'}))
</script>

<style scoped>
.demo-mode { color:#7dd3fc; font-size:11px; }
.header-right button,.header-right select,.header-right a { color:#e2e8f0; background:#1e293b; border:1px solid #334155; padding:5px 8px; border-radius:6px; cursor:pointer; font-size:12px; text-decoration:none; }
.header-right button:disabled { opacity:.4; cursor:default; }
.demo-error { position:absolute; top:100%; left:50%; transform:translateX(-50%); background:#7f1d1d; color:#fee2e2; padding:7px 20px; border-radius:0 0 8px 8px; font-size:12px; }
@media(max-width:1200px) { .demo-mode,.header-time { display:none; } .header-right { gap:6px !important; } }
@media(max-width:800px) { .header-inner { height:auto !important; min-height:90px; flex-wrap:wrap; gap:5px; padding:8px !important; } .header-right { flex-wrap:wrap; } }

.header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 40;
  background: rgba(10, 14, 20, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.header-inner {
  height: 52px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-title {
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  letter-spacing: -0.01em;
}

.header-divider {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.12);
}

.district-select {
  position: relative;
  display: flex;
  align-items: center;
}

.district-select select {
  appearance: none;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 6px 32px 6px 12px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.2s ease;
}

.district-select select:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.15);
}

.district-select select:focus {
  outline: none;
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

.district-select select option {
  background: #1e293b;
  color: #fff;
}

.select-arrow {
  position: absolute;
  right: 10px;
  pointer-events: none;
  color: rgba(255, 255, 255, 0.5);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
  animation: statusPulse 2s ease-in-out infinite;
}

@keyframes statusPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.status-text {
  font-size: 12px;
  color: rgba(16, 185, 129, 0.9);
  font-weight: 500;
}

.header-time {
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  font-variant-numeric: tabular-nums;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 6px;
}
</style>
