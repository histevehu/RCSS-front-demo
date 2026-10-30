<template>
  <div class="robot-content">
    <div class="location-key">Floor · Location / movement</div>
    <!-- 机器人列表 -->
    <div class="robot-list">
      <div
        v-for="robot in robots"
        :key="robot.id"
        class="robot-item"
        :class="{ 'robot-executing': robot.status === 'executing' }"
      >
        <div class="robot-info">
          <span class="robot-dot" :class="statusDotClass(robot.status)"></span>
          <span class="robot-id">{{ robot.id }}</span>
          <span class="robot-location" :title="locationExplanation(robot)">{{ formatRobotPos(robot) }}</span>
        </div>
        <span class="robot-status" :class="statusClass(robot.status)">{{ statusText(robot.status) }}</span>
      </div>
    </div>

    <!-- Utilization -->
    <div class="utilization-section">
      <div class="utilization-header">
        <span>Utilization</span>
        <span class="utilization-value">{{ robotStats.utilization }}%</span>
      </div>
      <div class="utilization-bar">
        <div class="utilization-fill" :style="{ width: robotStats.utilization + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '../../stores/appStore'

const store = useAppStore()
const robotStats = computed(() => store.robotStats)
const robots = computed(() => store.robots)

function statusText(status) {
  const map = {
    executing: 'Executing',
    idle: 'Idle',
    charging: 'Charging'
  }
  return map[status] || status
}

function statusDotClass(status) {
  const map = {
    executing: 'dot-executing',
    idle: 'dot-idle',
    charging: 'dot-charging'
  }
  return map[status] || 'dot-idle'
}

function statusClass(status) {
  const map = {
    executing: 'status-executing',
    idle: 'status-idle',
    charging: 'status-charging'
  }
  return map[status] || 'status-idle'
}

function formatRobotPos(robot) {
  return store.robotLocation(robot).label
}
function locationExplanation(robot) {
  const location = store.robotLocation(robot)
  return `${location.inTransit ? 'Moving' : 'At location'}: ${location.label}`
}

</script>

<style scoped>
.location-key { color:#94a3b8; font-size:10px; padding-bottom:8px; }
.robot-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: 12px 16px 16px;
}

.robot-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.robot-list::-webkit-scrollbar {
  width: 4px;
}

.robot-list::-webkit-scrollbar-track {
  background: transparent;
}

.robot-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.robot-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  transition: all 0.15s ease;
}

.robot-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.robot-executing {
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.15);
}

.robot-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.robot-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-executing {
  background: #3b82f6;
  box-shadow: 0 0 6px rgba(59, 130, 246, 0.5);
}

.dot-idle {
  background: rgba(255, 255, 255, 0.3);
}

.dot-charging {
  background: #f59e0b;
  animation: chargePulse 1.5s ease-in-out infinite;
}

@keyframes chargePulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.robot-id {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.robot-location {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.robot-status {
  font-size: 11px;
  font-weight: 500;
  flex-shrink: 0;
}

.status-executing {
  color: #60a5fa;
}

.status-idle {
  color: rgba(255, 255, 255, 0.4);
}

.status-charging {
  color: #fbbf24;
}

.utilization-section {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.utilization-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 8px;
}

.utilization-value {
  font-weight: 600;
  color: #60a5fa;
  font-variant-numeric: tabular-nums;
}

.utilization-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.utilization-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
  border-radius: 2px;
  transition: width 0.5s ease;
}
</style>
