<template>
  <div class="heatmap-content">
    <!-- 楼层统计 -->
    <div class="building-grid">
      <div
        v-for="b in buildings"
        :key="b.id"
        class="building-card"
        :class="getBuildingClass(b.id)"
      >
        <div class="building-name">{{ b.name }}</div>
        <div class="building-count">{{ b.taskCount }}</div>
      </div>
    </div>

    <!-- 热点区域 -->
    <div class="hotspot-list">
      <div
        v-for="(spot, idx) in hotspots.slice(0, 4)"
        :key="spot.location"
        class="hotspot-item"
      >
        <div class="hotspot-rank">{{ idx + 1 }}</div>
        <div class="hotspot-location">{{ spot.location }}</div>
        <div class="hotspot-count">{{ spot.taskCount }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { hotspots } from '../../data/mockData'

const buildings = [
  { id: 'A', name: 'A楼', taskCount: 8 },
  { id: 'B', name: 'B楼', taskCount: 6 },
  { id: 'C', name: 'C楼', taskCount: 4 }
]

function getBuildingClass(id) {
  return `building-${id.toLowerCase()}`
}
</script>

<style scoped>
.heatmap-content {
  padding: 16px;
}

.building-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.building-card {
  padding: 12px;
  border-radius: 12px;
  text-align: center;
  transition: all 0.2s ease;
}

.building-card:hover {
  transform: translateY(-2px);
}

.building-a {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05));
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.building-b {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05));
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.building-c {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05));
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.building-name {
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 4px;
}

.building-count {
  font-size: 24px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.building-a .building-count { color: #f87171; }
.building-b .building-count { color: #fbbf24; }
.building-c .building-count { color: #34d399; }

.hotspot-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hotspot-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  transition: background 0.15s ease;
}

.hotspot-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.hotspot-rank {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
}

.hotspot-location {
  flex: 1;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hotspot-count {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  font-variant-numeric: tabular-nums;
}
</style>
