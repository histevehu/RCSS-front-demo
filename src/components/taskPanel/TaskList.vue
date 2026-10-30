<template>
  <div class="task-list">
    <!-- Filter tabs -->
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

    <!-- Task list -->
    <div class="task-scroll">
      <TaskCard
        v-for="task in filteredTasks"
        :key="task.id"
        :task="task"
        :is-selected="selectedTaskId === task.id"
        @select="handleSelect"
      />

      <div v-if="filteredTasks.length === 0" class="empty-state">
        No tasks
      </div>
    </div>

    <!-- Footer stats -->
    <div class="task-footer">
      Total: {{ totalTasks }} tasks | In progress: {{ executingCount }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
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
  { label: 'All', value: 'all' },
  { label: 'Urgent', value: 'urgent' },
  { label: 'In Progress', value: 'executing' },
  { label: 'Waiting', value: 'waiting' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' },
  { label: 'Today', value: 'today' },
]

const currentFilter = ref(props.initialFilter)
watch(() => props.initialFilter, value => { currentFilter.value = value })
const selectedTaskId = computed(() => store.selectedTaskId)

const filteredTasks = computed(() => store.getTasksByFilter(currentFilter.value))
const totalTasks = computed(() => store.stats.total)
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
}

.filter-bar {
  flex-wrap:wrap;
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  gap: 6px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(15, 23, 42, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
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
  position: sticky;
  bottom: 0;
  z-index: 2;
  padding: 10px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  background: rgba(15, 23, 42, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
</style>
