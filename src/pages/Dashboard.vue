<template>
  <div class="dashboard">
    <!-- 3D地图作为全屏背景 -->
    <div class="dashboard-map">
      <MapOverview ref="mapRef" />
    </div>

    <!-- Top navigation bar -->
    <Header title="Task Dispatch Center" />

    <!-- Left panels -->
    <aside class="dashboard-left">
      <!-- Key metrics cards -->
      <div class="glass-panel stats-panel">
        <div class="stats-grid">
          <div class="stat-item stat-executing stat-clickable" @click="handleNavigate('executing')">
            <div class="stat-value">{{ stats.executing }}</div>
            <div class="stat-label">In Progress</div>
          </div>
          <div class="stat-item stat-waiting stat-clickable" @click="handleNavigate('waiting')">
            <div class="stat-value">{{ stats.waiting }}</div>
            <div class="stat-label">Waiting</div>
          </div>
          <div class="stat-item stat-completed stat-clickable" @click="handleNavigate('completed')">
            <div class="stat-value">{{ stats.completed }}</div>
            <div class="stat-label">Completed</div>
          </div>
        </div>
        <div class="completion-bar">
          <div class="completion-header">
            <span>Completion Rate</span>
            <span class="completion-value">{{ stats.completionRate }}%</span>
          </div>
          <div class="completion-track">
            <div class="completion-fill" :style="{ width: stats.completionRate + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- Robot status -->
      <div class="glass-panel robot-panel">
        <div class="panel-header">
          <span class="panel-title">Robots</span>
          <span class="panel-badge">{{ robotStats.total }} Online</span>
        </div>
        <RobotStatus />
      </div>
    </aside>

    <!-- 右侧面板组 -->
    <aside class="dashboard-right">
      <!-- Task distribution -->
      <div class="glass-panel heatmap-panel">
        <div class="panel-header">
          <span class="panel-title">Task Distribution</span>
        </div>
        <HeatMap />
      </div>

      <!-- Waiting queue -->
      <div class="glass-panel queue-panel">
        <div class="panel-header">
          <span class="panel-title">Waiting Queue</span>
          <span class="panel-badge queue-badge">{{ waitingQueue.length }}</span>
        </div>
        <WaitQueue />
      </div>
    </aside>

    <!-- Bottom performance bar -->
    <div class="dashboard-bottom">
      <PerformancePanel />
    </div>

    <!-- Urgent task indicator (floating over the map) -->
    <div v-if="stats.urgent > 0" class="urgent-alert">
      <div class="urgent-pulse"></div>
      <span class="urgent-count">{{ stats.urgent }}</span>
      <span class="urgent-text">Urgent Tasks</span>
    </div>

    <!-- New task button -->
    <button @click="showTaskForm = true" class="fab-button">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 4V16M4 10H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <span>New Task</span>
    </button>

    <!-- New task modal -->
    <Modal v-model="showTaskForm" title="New Task" size="md">
      <TaskForm @submit="handleCreateTask" @cancel="showTaskForm = false" />
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/appStore'
import Header from '../components/common/Header.vue'
import Modal from '../components/common/Modal.vue'
import RobotStatus from '../components/dashboard/RobotStatus.vue'
import MapOverview from '../components/dashboard/MapOverview.vue'
import HeatMap from '../components/dashboard/HeatMap.vue'
import WaitQueue from '../components/dashboard/WaitQueue.vue'
import PerformancePanel from '../components/dashboard/PerformancePanel.vue'
import TaskForm from '../components/taskPanel/TaskForm.vue'

const router = useRouter()
const store = useAppStore()

const showTaskForm = ref(false)
const mapRef = ref(null)

const stats = computed(() => store.stats)
const robotStats = computed(() => store.robotStats)
const waitingQueue = computed(() => store.waitingQueue)

function handleNavigate(filter) {
  router.push({ name: 'tasks', query: { filter } })
}

function handleCreateTask(task) {
  store.addTask(task)
  showTaskForm.value = false
}
</script>

<style scoped>
.dashboard {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #0a0e14;
}

/* 3D地图全屏背景 */
.dashboard-map {
  position: absolute;
  inset: 0;
  z-index: 0;
}

/* 玻璃态面板基础样式 */
.glass-panel {
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* 左侧面板组 */
.dashboard-left {
  position: absolute;
  top: 72px;
  left: 20px;
  bottom: 20px;
  width: 280px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
}

.dashboard-left::-webkit-scrollbar {
  width: 4px;
}

.dashboard-left::-webkit-scrollbar-track {
  background: transparent;
}

.dashboard-left::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
}

/* 右侧面板组 */
.dashboard-right {
  position: absolute;
  top: 72px;
  right: 20px;
  bottom: 80px;
  width: 300px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
}

.dashboard-right::-webkit-scrollbar {
  width: 4px;
}

.dashboard-right::-webkit-scrollbar-track {
  background: transparent;
}

.dashboard-right::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
}

/* 底部性能条 */
.dashboard-bottom {
  position: absolute;
  bottom: 20px;
  left: 320px;
  right: 340px;
  z-index: 10;
}

/* 核心指标面板 */
.stats-panel {
  padding: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.stat-item {
  text-align: center;
  padding: 12px 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  transition: all 0.2s ease;
}

.stat-item:hover {
  background: rgba(255, 255, 255, 0.06);
  transform: translateY(-2px);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-executing .stat-value { color: #3b82f6; }
.stat-waiting .stat-value { color: #f59e0b; }
.stat-completed .stat-value { color: #10b981; }

.stat-clickable {
  cursor: pointer;
}

.stat-clickable:active {
  transform: translateY(0) scale(0.98);
}

/* 完成率进度条 */
.completion-bar {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.completion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
}

.completion-value {
  font-weight: 600;
  color: #10b981;
  font-variant-numeric: tabular-nums;
}

.completion-track {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.completion-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #34d399);
  border-radius: 3px;
  transition: width 0.5s ease;
}

/* 面板通用头部 */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.panel-badge {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 10px;
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
  font-variant-numeric: tabular-nums;
}

.queue-badge {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

/* 机器人面板 */
.robot-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 热力图面板 */
.heatmap-panel {
  display: flex;
  flex-direction: column;
}

/* 队列面板 */
.queue-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 紧急任务提示 */
.urgent-alert {
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background: rgba(239, 68, 68, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 24px;
  animation: urgentFadeIn 0.3s ease;
}

@keyframes urgentFadeIn {
  from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.urgent-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}

.urgent-count {
  font-size: 18px;
  font-weight: 700;
  color: #ef4444;
  font-variant-numeric: tabular-nums;
}

.urgent-text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
}

/* FAB按钮 */
.fab-button {
  position: absolute;
  bottom: 24px;
  right: 24px;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  border-radius: 28px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.4);
  transition: all 0.2s ease;
}

.fab-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(37, 99, 235, 0.5);
}

.fab-button:active {
  transform: translateY(0);
}
</style>
