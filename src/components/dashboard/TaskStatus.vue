<template>
  <div class="bg-panel-bg border-2 border-primary rounded-lg p-4">
    <div class="text-lg font-bold text-primary mb-3">
      当前任务状态（{{ currentTimeStr }}）
    </div>
    
    <!-- 状态统计卡片 -->
    <div class="grid grid-cols-3 gap-2 mb-4">
      <StatCard 
        label="进行中" 
        :value="stats.executing" 
        type="primary"
        @click="$emit('navigate', 'executing')"
      />
      <StatCard 
        label="等待中" 
        :value="stats.waiting" 
        type="warning"
        @click="$emit('navigate', 'waiting')"
      />
      <StatCard 
        label="已完成" 
        :value="stats.completed" 
        type="success"
        @click="$emit('navigate', 'completed')"
      />
    </div>
    
    <!-- 详细指标 -->
    <div class="text-sm text-gray-700 space-y-1 mb-3">
      <div><span class="text-red-600 font-semibold">紧急任务：</span>{{ stats.urgent }}</div>
      <div>今日任务峰值：{{ stats.taskPeak }}（{{ stats.taskPeakTime }}）</div>
      <div>平均完成时间：{{ stats.avgCompletionTime }}</div>
    </div>
    
    <!-- 任务完成率 -->
    <div class="mb-3">
      <div class="text-sm text-gray-700 mb-1">任务完成率：</div>
      <ProgressBar :value="stats.completionRate" :trend="stats.completionTrend" />
    </div>
    
    <!-- 高峰期/低谷期 -->
    <div class="text-xs text-gray-600 space-y-1">
      <div>高峰期：{{ stats.peakRate }}%（{{ stats.peakTime }}）</div>
      <div>低谷期：{{ stats.valleyRate }}%（{{ stats.valleyTime }}）</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '../../stores/appStore'
import StatCard from '../common/StatCard.vue'
import ProgressBar from '../common/ProgressBar.vue'

defineEmits(['navigate'])

const store = useAppStore()
const stats = computed(() => store.stats)

const currentTimeStr = computed(() => {
  const now = store.currentTime
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
})
</script>
