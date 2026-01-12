<template>
  <div class="min-h-screen bg-gray-100">
    <Header title="首页示意图" />
    
    <main class="p-4">
      <div class="grid grid-cols-12 gap-4">
        <!-- 左侧区域 -->
        <div class="col-span-3 space-y-4">
          <TaskStatus @navigate="handleNavigate" />
          <RobotStatus />
        </div>
        
        <!-- 中间区域 -->
        <div class="col-span-5 space-y-4">
          <HeatMap />
          <WaitQueue />
        </div>
        
        <!-- 右侧区域 -->
        <div class="col-span-4">
          <PerformancePanel />
        </div>
      </div>
    </main>
    
    <!-- 新建任务悬浮按钮 -->
    <button 
      @click="showTaskForm = true"
      class="fixed bottom-6 right-6 bg-primary text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
    >
      <span class="text-xl">+</span>
      <span>新建任务</span>
    </button>
    
    <!-- 新建任务弹窗 -->
    <Modal v-model="showTaskForm" title="新建任务" size="md">
      <TaskForm @submit="handleCreateTask" @cancel="showTaskForm = false" />
    </Modal>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/appStore'
import Header from '../components/common/Header.vue'
import Modal from '../components/common/Modal.vue'
import TaskStatus from '../components/dashboard/TaskStatus.vue'
import RobotStatus from '../components/dashboard/RobotStatus.vue'
import HeatMap from '../components/dashboard/HeatMap.vue'
import WaitQueue from '../components/dashboard/WaitQueue.vue'
import PerformancePanel from '../components/dashboard/PerformancePanel.vue'
import TaskForm from '../components/taskPanel/TaskForm.vue'

const router = useRouter()
const store = useAppStore()

const showTaskForm = ref(false)

function handleNavigate(filter) {
  router.push({ name: 'tasks', query: { filter } })
}

function handleCreateTask(task) {
  store.addTask(task)
  showTaskForm.value = false
}
</script>
