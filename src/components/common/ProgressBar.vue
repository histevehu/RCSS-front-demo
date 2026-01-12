<template>
  <div class="flex items-center gap-3">
    <div class="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
      <div
        class="h-full rounded-full transition-all duration-300"
        :class="barColorClass"
        :style="{ width: `${value}%` }"
      ></div>
    </div>

    <span class="text-[12px] font-medium min-w-[72px] text-right text-slate-600 tabular-nums">
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
    green: 'bg-emerald-500',
    yellow: 'bg-amber-500',
    red: 'bg-rose-500',
    gray: 'bg-slate-400'
  }
  return colors[props.color] || colors.blue
})

const trendClass = computed(() => {
  if (props.trend === undefined) return ''
  return props.trend >= 0 ? 'text-emerald-600' : 'text-rose-600'
})
</script>
