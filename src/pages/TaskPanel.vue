<template>
  <div class="task-page">
    <!-- 3D地图作为背景 -->
    <div class="task-map-bg">
      <HospitalMap />
    </div>

    <!-- 顶部导航 -->
    <Header title="任务面板">
      <template #actions>
        <button @click="showGantt = true" class="header-btn">
          [任务时间线（甘特图）]
        </button>
        <button @click="showLogs = true" class="header-btn">
          [任务日志]
        </button>
        <button @click="showTaskForm = true" class="header-btn-primary">
          + 新建任务
        </button>
      </template>
    </Header>

    <!-- 左侧任务列表面板 -->
    <aside class="task-sidebar">
      <TaskList :initial-filter="initialFilter" />
    </aside>

    <!-- 甘特图弹窗 -->
    <Modal v-model="showGantt" title="任务时间线（甘特图）" size="xl">
      <div class="h-[500px]">
        <GanttChart />
      </div>
    </Modal>

    <!-- 任务日志弹窗 -->
    <Modal v-model="showLogs" title="任务日志" size="md">
      <div class="h-[400px]">
        <TaskLog />
      </div>
    </Modal>

    <!-- 新建任务弹窗 -->
    <Modal v-model="showTaskForm" title="新建任务" size="md">
      <TaskForm @submit="handleCreateTask" @cancel="showTaskForm = false" />
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '../stores/appStore'
import Header from '../components/common/Header.vue'
import Modal from '../components/common/Modal.vue'
import TaskList from '../components/taskPanel/TaskList.vue'
import HospitalMap from '../components/taskPanel/HospitalMap.vue'
import GanttChart from '../components/taskPanel/GanttChart.vue'
import TaskLog from '../components/taskPanel/TaskLog.vue'
import TaskForm from '../components/taskPanel/TaskForm.vue'

const route = useRoute()
const store = useAppStore()

const showGantt = ref(false)
const showLogs = ref(false)
const showTaskForm = ref(false)

const initialFilter = computed(() => route.query.filter || 'all')

function handleCreateTask(task) {
  store.addTask(task)
  showTaskForm.value = false
}
</script>

<style scoped>
.task-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #0a0e14;
}

.task-map-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.task-sidebar {
  position: absolute;
  top: 52px;
  left: 0;
  bottom: 0;
  width: 320px;
  z-index: 10;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.header-btn {
  padding: 6px 12px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.header-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.header-btn-primary {
  padding: 6px 14px;
  font-size: 13px;
  color: #fff;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.header-btn-primary:hover {
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
}
</style>
