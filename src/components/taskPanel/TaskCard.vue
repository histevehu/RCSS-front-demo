<template>
  <div 
    class="bg-white rounded-lg p-3 border-2 cursor-pointer transition-all"
    :class="[
      isSelected ? 'border-primary shadow-md' : 'border-gray-200 hover:border-gray-300'
    ]"
    @click="$emit('select', task.id)"
  >
    <div class="flex items-start gap-2">
      <!-- 优先级标识 -->
      <span 
        class="w-3 h-3 rounded-full mt-1 flex-shrink-0"
        :class="priorityColor"
      ></span>
      
      <div class="flex-1 min-w-0">
        <!-- 任务标题 -->
        <div class="flex items-center gap-2">
          <span class="font-semibold text-sm" :class="priorityTextColor">
            {{ priorityText }}
          </span>
          <span class="text-sm font-medium">{{ task.id }}-{{ task.name }}</span>
        </div>
        
        <!-- 任务详情 -->
        <div class="text-xs text-gray-600 mt-1 space-y-1">
          <div>机器人: {{ task.robotId || '待分配' }}</div>
          <div>状态: {{ statusText }}</div>
          <div>用时: {{ durationText }} / 预估{{ estimatedText }}</div>
          <div class="flex items-start gap-1">
            <span class="text-red-500">📍</span>
            <span>路线: {{ routeText }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatDuration, getPriorityText, getStatusText } from '../../data/mockData'

const props = defineProps({
  task: {
    type: Object,
    required: true
  },
  isSelected: {
    type: Boolean,
    default: false
  }
})

defineEmits(['select'])

const priorityColor = computed(() => {
  const colors = {
    urgent: 'bg-red-500',
    normal: 'bg-yellow-500',
    low: 'bg-green-500',
  }
  return colors[props.task.priority] || 'bg-gray-500'
})

const priorityTextColor = computed(() => {
  const colors = {
    urgent: 'text-red-600',
    normal: 'text-yellow-600',
    low: 'text-green-600',
  }
  return colors[props.task.priority] || 'text-gray-600'
})

const priorityText = computed(() => getPriorityText(props.task.priority))
const statusText = computed(() => getStatusText(props.task.status))
const durationText = computed(() => formatDuration(props.task.duration))
const estimatedText = computed(() => formatDuration(props.task.estimatedTime))
const routeText = computed(() => props.task.route.join('→'))
</script>
