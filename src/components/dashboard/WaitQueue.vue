<template>
  <div class="bg-panel-bg border-2 border-primary rounded-lg p-4">
    <div class="text-lg font-bold text-primary mb-3">等待队列</div>
    
    <div class="space-y-3 max-h-64 overflow-y-auto">
      <div 
        v-for="(task, index) in waitingQueue" 
        :key="task.id"
        class="bg-white rounded p-3 border border-gray-200"
      >
        <div class="flex items-start gap-2">
          <span 
            class="w-3 h-3 rounded-full mt-1 flex-shrink-0"
            :class="getPriorityColor(task.priority)"
          ></span>
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-sm">
              {{ index + 1 }}. {{ task.id }}-{{ task.name }}
            </div>
            <div class="text-xs text-gray-500 mt-1">
              路线: {{ getRouteText(task) }}
            </div>
            <div class="text-xs text-gray-400">
              等待: {{ getWaitTime(task) }}
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="waitingQueue.length === 0" class="text-center text-gray-400 py-4">
        暂无等待任务
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '../../stores/appStore'
import { formatDuration } from '../../data/mockData'

const store = useAppStore()
const waitingQueue = computed(() => store.waitingQueue)

function getPriorityColor(priority) {
  const colors = {
    urgent: 'bg-red-500',
    normal: 'bg-yellow-500',
    low: 'bg-green-500',
  }
  return colors[priority] || 'bg-gray-500'
}

function getRouteText(task) {
  if (Array.isArray(task.routeNodes) && task.routeNodes.length > 0) {
    return task.routeNodes.join('→')
  }
  if (Array.isArray(task.route) && task.route.length > 0) {
    return task.route.join('→')
  }
  return '待计算'
}

function getWaitTime(task) {
  if (task.status !== 'waiting') return '0s'
  const now = new Date()
  const created = new Date(task.createdAt)
  const diffSeconds = Math.floor((now - created) / 1000)
  if (diffSeconds <= 0) return '0m (新任务)'
  return formatDuration(diffSeconds)
}
</script>
