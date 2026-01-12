<template>
  <div class="flex items-center gap-2">
    <div class="flex-1 h-4 bg-gray-800 rounded overflow-hidden">
      <div 
        class="h-full transition-all duration-300"
        :class="barColorClass"
        :style="{ width: `${value}%` }"
      ></div>
    </div>
    <span class="text-sm font-medium min-w-[60px] text-right">
      {{ value }}%
      <span v-if="trend !== undefined" :class="trendClass">
        {{ trend >= 0 ? '▲' : '▼' }}{{ Math.abs(trend) }}%
      </span>
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: {
    type: Number,
    default: 0
  },
  trend: {
    type: Number,
    default: undefined
  },
  color: {
    type: String,
    default: 'blue'
  }
})

const barColorClass = computed(() => {
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    gray: 'bg-gray-500',
  }
  return colors[props.color] || colors.blue
})

const trendClass = computed(() => {
  if (props.trend === undefined) return ''
  return props.trend >= 0 ? 'text-green-500' : 'text-red-500'
})
</script>
