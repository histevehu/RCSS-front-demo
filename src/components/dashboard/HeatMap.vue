<template>
  <div class="bg-panel-bg border-2 border-primary rounded-lg p-4">
    <div class="text-lg font-bold text-primary mb-3">各楼层任务分布热力图</div>
    
    <!-- 简化的楼层示意图 -->
    <div class="flex justify-center items-end gap-4 mb-4 h-32">
      <div 
        v-for="building in buildings" 
        :key="building.id"
        class="relative flex flex-col items-center"
      >
        <div 
          class="w-16 border-2 border-gray-400 rounded-t flex items-center justify-center text-sm font-bold"
          :class="getBuildingColor(building.taskCount)"
          :style="{ height: `${building.height}px` }"
        >
          {{ building.name }}
        </div>
        <div class="text-xs text-gray-600 mt-1">{{ building.taskCount }}任务</div>
      </div>
    </div>
    
    <!-- 热点区域列表 -->
    <div class="text-sm text-gray-700">
      <div class="font-semibold mb-2">热点区域：</div>
      <ul class="list-disc list-inside space-y-1">
        <li v-for="spot in hotspots" :key="spot.location">
          {{ spot.location }}（{{ spot.taskCount }}任务）
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { hotspots } from '../../data/mockData'

const buildings = [
  { id: 'A', name: 'A楼', taskCount: 8, height: 60 },
  { id: 'B', name: 'B楼', taskCount: 6, height: 80 },
  { id: 'C', name: 'C楼', taskCount: 4, height: 50 },
]

function getBuildingColor(count) {
  if (count >= 8) return 'bg-red-200'
  if (count >= 6) return 'bg-yellow-200'
  return 'bg-green-200'
}
</script>
