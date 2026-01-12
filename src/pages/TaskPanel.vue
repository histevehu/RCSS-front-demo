<template>
  <div class="h-screen flex flex-col bg-gray-100">
    <!-- 顶部导航 -->
    <Header title="任务面板">
      <template #actions>
        <button 
          @click="showGantt = true"
          class="px-4 py-2 text-sm text-primary hover:bg-blue-50 rounded transition-colors"
        >
          [任务时间线（甘特图）]
        </button>
        <button 
          @click="showLogs = true"
          class="px-4 py-2 text-sm text-primary hover:bg-blue-50 rounded transition-colors"
        >
          [任务日志]
        </button>
        <button 
          @click="showTaskForm = true"
          class="px-4 py-2 text-sm bg-primary text-white rounded hover:bg-blue-700 transition-colors"
        >
          + 新建任务
        </button>
      </template>
    </Header>
    
    <!-- 主内容区 -->
    <main class="flex-1 flex overflow-hidden">
      <!-- 左侧任务列表 -->
      <div class="w-80 flex-shrink-0">
        <TaskList :initial-filter="initialFilter" />
      </div>
      
      <!-- 右侧地图 -->
      <div class="flex-1">
        <HospitalMap />
      </div>
    </main>
    
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
