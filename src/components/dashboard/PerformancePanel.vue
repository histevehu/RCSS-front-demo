<template>
  <div class="bg-panel-bg border-2 border-primary rounded-lg p-4">
    <div class="text-lg font-bold text-primary mb-3">核心性能仪表盘</div>
    
    <!-- 冲突解决效率 -->
    <div class="mb-4">
      <div class="text-sm font-semibold text-gray-700 mb-2">冲突解决效率：</div>
      <ProgressBar :value="conflictStats.efficiency" :trend="conflictStats.trend" />
      <div class="flex justify-between text-xs text-gray-600 mt-2">
        <span>共计: {{ conflictStats.total }}起</span>
        <span>近1小时解决: {{ conflictStats.recentResolved }}起</span>
      </div>
      <div class="text-xs text-gray-500 mt-1">
        冲突多发区: {{ conflictStats.hotspot }}
      </div>
    </div>
    
    <!-- 垂直资源利用率 -->
    <div>
      <div class="text-sm font-semibold text-gray-700 mb-2">垂直资源利用率：</div>
      
      <div class="grid grid-cols-2 gap-4">
        <!-- 楼梯 -->
        <div>
          <div class="text-xs text-gray-500 mb-2">楼梯</div>
          <div class="space-y-2">
            <div 
              v-for="res in stairs" 
              :key="res.name"
              class="flex items-center gap-2 text-xs"
            >
              <span class="w-20 truncate">{{ res.name }}</span>
              <div class="flex-1 h-2 bg-gray-300 rounded overflow-hidden">
                <div 
                  class="h-full bg-blue-500"
                  :style="{ width: `${res.utilization}%` }"
                ></div>
              </div>
              <span class="w-16 text-right">
                {{ res.utilization }}%
                <span :class="res.trend >= 0 ? 'text-green-500' : 'text-red-500'">
                  {{ res.trend >= 0 ? '▲' : '▼' }}{{ Math.abs(res.trend) }}%
                </span>
              </span>
            </div>
          </div>
        </div>
        
        <!-- 电梯 -->
        <div>
          <div class="text-xs text-gray-500 mb-2">电梯</div>
          <div class="space-y-2">
            <div 
              v-for="res in elevators" 
              :key="res.name"
              class="flex items-center gap-2 text-xs"
            >
              <span class="w-24 truncate">{{ res.name }}</span>
              <div class="flex-1 h-2 bg-gray-300 rounded overflow-hidden">
                <div 
                  class="h-full bg-green-500"
                  :style="{ width: `${res.utilization}%` }"
                ></div>
              </div>
              <span class="w-16 text-right">
                {{ res.utilization }}%
                <span :class="res.trend >= 0 ? 'text-green-500' : 'text-red-500'">
                  {{ res.trend >= 0 ? '▲' : '▼' }}{{ Math.abs(res.trend) }}%
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 汇总 -->
      <div class="flex justify-between text-xs text-gray-600 mt-3 pt-3 border-t">
        <span>楼梯利用率: {{ avgStairUtilization }}% ↓</span>
        <span>电梯利用率: {{ avgElevatorUtilization }}% ↑</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { conflictStats, verticalResources } from '../../data/mockData'
import ProgressBar from '../common/ProgressBar.vue'

const stairs = computed(() => 
  verticalResources.filter(r => r.type === 'stair')
)

const elevators = computed(() => 
  verticalResources.filter(r => r.type === 'elevator')
)

const avgStairUtilization = computed(() => {
  const s = stairs.value
  return Math.round(s.reduce((sum, r) => sum + r.utilization, 0) / s.length)
})

const avgElevatorUtilization = computed(() => {
  const e = elevators.value
  return Math.round(e.reduce((sum, r) => sum + r.utilization, 0) / e.length)
})
</script>
