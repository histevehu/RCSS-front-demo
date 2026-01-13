<template>
  <div class="task-list">
    <!-- 筛选标签 -->
    <div class="filter-bar">
      <button
        v-for="f in filters"
        :key="f.value"
        @click="currentFilter = f.value"
        class="filter-btn"
        :class="{ active: currentFilter === f.value }"
      >
        {{ f.label }}
      </button>
    </div>

    <!-- 任务列表 -->
    <div class="task-scroll">
      <TaskCard
        v-for="task in filteredTasks"
        :key="task.id"
        :task="task"
        :is-selected="selectedTaskId === task.id"
        @select="handleSelect"
      />

      <div v-if="filteredTasks.length === 0" class="empty-state">
        暂无任务
      </div>
    </div>

    <!-- 底部统计 -->
    <div class="task-footer">
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
const totalTasks = computed(() => store.tasks.length + 62)
const executingCount = computed(() => store.stats.executing)

function handleSelect(taskId) {
  store.selectTask(taskId)
  emit('selectTask', taskId)
}
</script>

<style scoped>
.task-list {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.filter-bar {
  display: flex;
  gap: 6px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.filter-btn {
  padding: 6px 12px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-btn:hover {
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.08);
}

.filter-btn.active {
  color: #60a5fa;
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.3);
}

.task-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-scroll::-webkit-scrollbar {
  width: 4px;
}

.task-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.task-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  color: rgba(255, 255, 255, 0.3);
  font-size: 13px;
}

.task-footer {
  padding: 10px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}
</style>
