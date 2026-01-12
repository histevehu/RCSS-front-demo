<template>
  <div class="h-full flex flex-col">
    <!-- 时间轴头部 -->
    <div class="flex border-b bg-gray-100">
      <div class="w-40 p-2 text-sm font-medium border-r">任务</div>
      <div class="flex-1 flex">
        <div 
          v-for="hour in hours" 
          :key="hour"
          class="flex-1 p-2 text-xs text-center border-r text-gray-600"
        >
          {{ hour }}:00
        </div>
      </div>
    </div>
    
    <!-- 任务条 -->
    <div class="flex-1 overflow-y-auto">
      <div 
        v-for="task in tasks" 
        :key="task.id"
        class="flex border-b hover:bg-gray-50"
      >
        <div class="w-40 p-2 text-sm border-r flex items-center gap-2">
          <span 
            class="w-2 h-2 rounded-full"
            :class="getPriorityColor(task.priority)"
          ></span>
          <span class="truncate">{{ task.id }}-{{ task.name }}</span>
        </div>
        <div class="flex-1 relative h-10">
          <!-- 时间格子 -->
          <div class="absolute inset-0 flex">
            <div 
              v-for="hour in hours" 
              :key="hour"
              class="flex-1 border-r border-gray-100"
            ></div>
          </div>
          <!-- 任务条 -->
          <div 
            class="absolute top-2 h-6 rounded text-xs text-white flex items-center px-2"
            :class="getBarColor(task.status)"
            :style="getBarStyle(task)"
          >
            {{ task.robotId || '待分配' }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- 图例 -->
    <div class="p-3 border-t bg-gray-50 flex gap-4 text-xs">
      <div class="flex items-center gap-1">
        <div class="w-3 h-3 bg-blue-500 rounded"></div>
        <span>执行中</span>
      </div>
      <div class="flex items-center gap-1">
        <div class="w-3 h-3 bg-yellow-500 rounded"></div>
        <span>等待中</span>
      </div>
      <div class="flex items-center gap-1">
        <div class="w-3 h-3 bg-green-500 rounded"></div>
        <span>已完成</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '../../stores/appStore'

const store = useAppStore()
const tasks = computed(() => store.tasks)

// 生成时间轴小时
const hours = computed(() => {
  const result = []
  for (let i = 8; i <= 18; i++) {
    result.push(i)
  }
  return result
})

function getPriorityColor(priority) {
  const colors = {
    urgent: 'bg-red-500',
    normal: 'bg-yellow-500',
    low: 'bg-green-500',
  }
  return colors[priority] || 'bg-gray-500'
}

function getBarColor(status) {
  const colors = {
    executing: 'bg-blue-500',
    waiting: 'bg-yellow-500',
    completed: 'bg-green-500',
  }
  return colors[status] || 'bg-gray-500'
}

function getBarStyle(task) {
  const created = new Date(task.createdAt)
  const startHour = created.getHours()
  const startMinute = created.getMinutes()
  
  // 计算开始位置（百分比）
  const totalMinutes = (18 - 8) * 60 // 8:00 到 18:00
  const startOffset = ((startHour - 8) * 60 + startMinute) / totalMinutes * 100
  
  // 计算宽度
  const duration = task.estimatedTime || 300 // 默认5分钟
  const widthPercent = Math.min((duration / 60) / totalMinutes * 100 * 10, 20) // 放大显示
  
  return {
    left: `${Math.max(0, Math.min(startOffset, 95))}%`,
    width: `${Math.max(widthPercent, 5)}%`,
  }
}
</script>
