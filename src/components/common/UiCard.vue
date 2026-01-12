<template>
  <section class="uicard" :class="wrapperClass">
    <div class="uicard-header" :class="headerStyle">
      <div class="uicard-header-left">
        <slot name="icon" />
        <div class="uicard-title-wrap">
          <h2 class="uicard-title">{{ title }}</h2>
          <p v-if="subtitle" class="uicard-subtitle">{{ subtitle }}</p>
        </div>
      </div>
      <div class="uicard-header-right">
        <span v-if="status" :class="statusBadgeClass">{{ status }}</span>
        <slot name="headerActions" />
      </div>
    </div>
    <div :class="bodyClass">
      <slot />
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  tone: { type: String, default: 'slate' },
  status: { type: String, default: '' },
  statusTone: { type: String, default: 'neutral' },
  bodyClass: { type: String, default: 'p-4' }
})

const isDark = computed(() => props.tone !== 'slate')

const wrapperClass = computed(() => {
  // 玻璃态容器
  return 'rounded-[12px] overflow-hidden border bg-[rgba(15,23,42,0.75)] border-[rgba(255,255,255,0.08)] backdrop-blur-[20px]'
})

const headerStyle = computed(() => {
  return 'px-4 py-2.5 flex items-center justify-between border-b border-[rgba(255,255,255,0.08)]'
})

const statusBadgeClass = computed(() => {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium'
  const tones = {
    neutral: 'bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.9)]',
    success: 'bg-[rgba(16,185,129,0.2)] text-[#34d399]',
    warning: 'bg-[rgba(245,158,11,0.2)] text-[#fbbf24]',
    danger: 'bg-[rgba(239,68,68,0.2)] text-[#f87171]',
    info: 'bg-[rgba(59,130,246,0.2)] text-[#60a5fa]'
  }
  return `${base} ${tones[props.statusTone] || tones.neutral}`
})
</script>

<style scoped>
.uicard { display: flex; flex-direction: column; min-height: 0; box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
.uicard-header { }
.uicard-header-left { display: flex; align-items: center; gap: 8px; min-width: 0; }
.uicard-title-wrap { min-width: 0; }
.uicard-title { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.95); }
.uicard-subtitle { margin-top: 2px; font-size: 12px; color: rgba(255,255,255,0.65); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.uicard-header-right { display: flex; align-items: center; gap: 8px; }
</style>
