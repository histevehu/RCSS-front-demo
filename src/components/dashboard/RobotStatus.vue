<template>
  <div class="bg-panel-bg border-2 border-primary rounded-lg p-4">
    <div class="text-lg font-bold text-primary mb-3">
      机器人状态（{{ robotStats.total }}台）
    </div>
    
    <!-- 状态统计卡片 -->
    <div class="grid grid-cols-3 gap-2 mb-4">
      <StatCard 
        label="执行中" 
        :value="robotStats.executing" 
        type="primary"
      />
      <StatCard 
        label="空闲中" 
        :value="robotStats.idle" 
        type="default"
      />
      <StatCard 
        label="充电中" 
        :value="robotStats.charging" 
        type="warning"
      />
    </div>
    
    <!-- 机器人利用效率 -->
    <div>
      <div class="text-sm text-gray-700 mb-1">机器人利用效率：</div>
      <ProgressBar 
        :value="robotStats.utilization" 
        :trend="robotStats.utilizationTrend" 
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '../../stores/appStore'
import StatCard from '../common/StatCard.vue'
import ProgressBar from '../common/ProgressBar.vue'

const store = useAppStore()
const robotStats = computed(() => store.robotStats)
</script>
