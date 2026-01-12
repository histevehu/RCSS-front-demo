<template>
  <button type="button" class="w-full rounded-md border px-3 py-2.5 text-left transition hover:shadow-sm" :class="wrapClass" @click="$emit('click')">
    <div class="text-[12px] leading-none" :class="labelClass">{{ label }}</div>
    <div class="mt-1 text-[22px] leading-none font-semibold tabular-nums" :class="valueClass">
      {{ value }}
    </div>
  </button>
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
    default: 'default' // default, success, warning, danger, primary
  }
})

defineEmits(['click'])

const style = computed(() => {
  const map = {
    default: {
      wrap: 'bg-white border-slate-200 hover:border-slate-300',
      label: 'text-slate-500',
      value: 'text-slate-900'
    },
    primary: {
      wrap: 'bg-blue-50 border-blue-200 hover:border-blue-300',
      label: 'text-blue-700',
      value: 'text-blue-700'
    },
    success: {
      wrap: 'bg-emerald-50 border-emerald-200 hover:border-emerald-300',
      label: 'text-emerald-700',
      value: 'text-emerald-700'
    },
    warning: {
      wrap: 'bg-amber-50 border-amber-200 hover:border-amber-300',
      label: 'text-amber-700',
      value: 'text-amber-700'
    },
    danger: {
      wrap: 'bg-rose-50 border-rose-200 hover:border-rose-300',
      label: 'text-rose-700',
      value: 'text-rose-700'
    }
  }

  return map[props.type] || map.default
})

const wrapClass = computed(() => style.value.wrap)
const labelClass = computed(() => style.value.label)
const valueClass = computed(() => style.value.value)
</script>
