<template>
  <div class="bg-white border-r border-gray-200 h-full flex flex-col">
    <!-- 标题和筛选 -->
    <div class="p-4 border-b">
      <div class="flex items-center gap-2 mb-3">
        <span class="font-bold text-primary">任务列表</span>
        <span class="text-sm text-gray-500">筛选：</span>
      </div>
      <div class="flex flex-wrap gap-2">
        <button 
          v-for="f in filters" 
          :key="f.value"
          @click="currentFilter = f.value"
          class="px-3 py-1 text-sm rounded transition-colors"
          :class="currentFilter === f.value 
            ? 'bg-primary text-white' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
        >
          {{ f.label }}
        </button>
      </div>
    </div>
    
    <!-- 任务列表 -->
    <div class="flex-1 overflow-y-auto p-4 space-y-3">
      <TaskCard 
        v-for="task in filteredTasks" 
        :key="task.id"
        :task="task"
        :is-selected="selectedTaskId === task.id"
        @select="handleSelect"
      />
      
      <div v-if="filteredTasks.length === 0" class="text-center text-gray-400 py-8">
        暂无任务
      </div>
      
      <!-- 省略号 -->
      <div v-if="filteredTasks.length > 0" class="text-center text-gray-400">
        ……
      </div>
    </div>
    
    <!-- 底部统计 -->
    <div class="p-4 border-t bg-gray-50 text-sm text-gray-600">
      总计: {{ totalTasks }} 任务 | 进行中: {{ executingCount }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAppStore } from '../../stores/appStore'
import TaskCard from './TaskCard.vue'

const props = defineProps({
  initialFilter: {
    type: String,
    default: 'all'
  }
})

const emit = defineEmits(['selectTask'])

const store = useAppStore()

const filters = [
  { label: '全部', value: 'all' },
  { label: '紧急', value: 'urgent' },
  { label: '进行中', value: 'executing' },
  { label: '今日', value: 'today' },
]

const currentFilter = ref(props.initialFilter)
const selectedTaskId = computed(() => store.selectedTaskId)

const filteredTasks = computed(() => store.getTasksByFilter(currentFilter.value))
const totalTasks = computed(() => store.tasks.length + 62) // 包含已完成的
const executingCount = computed(() => store.stats.executing)

function handleSelect(taskId) {
  store.selectTask(taskId)
  emit('selectTask', taskId)
}
</script>
