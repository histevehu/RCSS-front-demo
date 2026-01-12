<template>
  <div 
    class="text-center p-3 rounded cursor-pointer transition-colors"
    :class="bgClass"
    @click="$emit('click')"
  >
    <div class="text-xs text-gray-200 mb-1">{{ label }}</div>
    <div class="text-3xl font-bold text-white">{{ value }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  value: {
    type: [Number, String],
    required: true
  },
  type: {
    type: String,
    default: 'default' // default, success, warning, danger
  }
})

defineEmits(['click'])

const bgClass = computed(() => {
  const types = {
    default: 'bg-gray-700 hover:bg-gray-600',
    success: 'bg-green-700 hover:bg-green-600',
    warning: 'bg-yellow-600 hover:bg-yellow-500',
    danger: 'bg-red-700 hover:bg-red-600',
    primary: 'bg-blue-700 hover:bg-blue-600',
  }
  return types[props.type] || types.default
})
</script>
