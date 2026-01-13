<template>
  <div class="perf-content">
    <div class="perf-top">
      <div class="perf-card">
        <div class="perf-label">Conflict resolution efficiency</div>
        <div class="perf-value">
          {{ conflictStats.efficiency }}%
          <span :class="conflictStats.trend >= 0 ? 'trend-up' : 'trend-down'">
            {{ conflictStats.trend >= 0 ? '↑' : '↓' }}{{ Math.abs(conflictStats.trend) }}%
          </span>
        </div>
      </div>

      <div class="perf-card">
        <div class="perf-label">Today's conflicts</div>
        <div class="perf-value">{{ conflictStats.total }}</div>
        <div class="perf-sub">Resolved in last hour {{ conflictStats.recentResolved }}</div>
      </div>
    </div>

    <div class="perf-title">Vertical resource utilization</div>

    <div class="perf-grid">
      <div>
        <div class="perf-subtitle">Stairs</div>
        <div class="bar-list">
          <div v-for="res in stairs" :key="res.name" class="bar-row">
            <span class="bar-name">{{ res.name }}</span>
            <div class="bar-track"><div class="bar-fill bar-blue" :style="{ width: `${res.utilization}%` }"></div></div>
            <span class="bar-val">{{ res.utilization }}%</span>
          </div>
        </div>
      </div>
      <div>
        <div class="perf-subtitle">Elevators</div>
        <div class="bar-list">
          <div v-for="res in elevators" :key="res.name" class="bar-row">
            <span class="bar-name">{{ res.name }}</span>
            <div class="bar-track"><div class="bar-fill bar-green" :style="{ width: `${res.utilization}%` }"></div></div>
            <span class="bar-val">{{ res.utilization }}%</span>
          </div>
        </div>
      </div>
    </div>

    <div class="perf-footer">
      <span>Avg. stairs <b>{{ avgStairUtilization }}%</b></span>
      <span>Avg. elevators <b>{{ avgElevatorUtilization }}%</b></span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { conflictStats, verticalResources } from '../../data/mockData'

const stairs = computed(() => verticalResources.filter(r => r.type === 'stair'))
const elevators = computed(() => verticalResources.filter(r => r.type === 'elevator'))

const avgStairUtilization = computed(() => {
  const s = stairs.value
  return Math.round(s.reduce((sum, r) => sum + r.utilization, 0) / s.length)
})

const avgElevatorUtilization = computed(() => {
  const e = elevators.value
  return Math.round(e.reduce((sum, r) => sum + r.utilization, 0) / e.length)
})
</script>

<style scoped>
.perf-content {
  padding: 14px 16px;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}

.perf-top {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.perf-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 10px 12px;
}

.perf-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}

.perf-value {
  margin-top: 4px;
  font-size: 22px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  font-variant-numeric: tabular-nums;
}

.trend-up { color: #34d399; font-size: 12px; margin-left: 8px; }
.trend-down { color: #f87171; font-size: 12px; margin-left: 8px; }

.perf-sub { font-size: 11px; color: rgba(255, 255, 255, 0.45); margin-top: 2px; }

.perf-title {
  margin-top: 12px;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
}

.perf-grid {
  margin-top: 6px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.perf-subtitle { font-size: 11px; color: rgba(255, 255, 255, 0.6); margin-bottom: 6px; }

.bar-list { display: flex; flex-direction: column; gap: 8px; }
.bar-row { display: flex; align-items: center; gap: 8px; font-size: 11px; }
.bar-name { width: 110px; color: rgba(255, 255, 255, 0.75); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bar-track { flex: 1; height: 6px; background: rgba(255, 255, 255, 0.1); border-radius: 3px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 3px; transition: width 0.4s ease; }
.bar-blue { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
.bar-green { background: linear-gradient(90deg, #10b981, #34d399); }
.bar-val { width: 38px; text-align: right; color: rgba(255, 255, 255, 0.75); font-variant-numeric: tabular-nums; }

.perf-footer { margin-top: 10px; display: flex; justify-content: space-between; font-size: 11px; color: rgba(255, 255, 255, 0.65); }
.perf-footer b { color: rgba(255, 255, 255, 0.9); }
</style>
