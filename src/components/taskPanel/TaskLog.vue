<template>
  <div class="h-full flex flex-col">
    <div class="p-4 border-b bg-gray-50">
      <h3 class="font-bold text-gray-800">任务日志</h3>
    </div>
    
    <div class="flex-1 overflow-y-auto">
      <div 
        v-for="(log, index) in logs" 
        :key="index"
        class="px-4 py-3 border-b hover:bg-gray-50 flex items-start gap-3"
      >
        <div 
          class="w-2 h-2 rounded-full mt-2 flex-shrink-0"
          :class="getLogTypeColor(log.type)"
        ></div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-400">{{ log.time }}</span>
            <span 
              v-if="log.taskId"
              class="text-xs px-1.5 py-0.5 bg-gray-100 rounded text-gray-600"
            >
              {{ log.taskId }}
            </span>
          </div>
          <div class="text-sm text-gray-700 mt-1">{{ log.message }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '../../stores/appStore'

const store = useAppStore()
const logs = computed(() => store.taskLogs)

function getLogTypeColor(type) {
  const colors = {
    create: 'bg-blue-500',
    start: 'bg-green-500',
    complete: 'bg-green-600',
    assign: 'bg-yellow-500',
    conflict: 'bg-red-500',
    error: 'bg-red-600',
  }
  return colors[type] || 'bg-gray-400'
}
</script>
