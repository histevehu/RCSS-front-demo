<template>
  <div class="task-card" :class="{ selected: isSelected, urgent: task.priority === 'urgent' }" @click="$emit('select', task.id)">
    <!-- 优先级条 -->
    <div class="priority-bar" :class="priorityBarClass"></div>

    <div class="card-content">
      <!-- Header -->
      <div class="card-header">
        <span class="priority-tag" :class="priorityTagClass">{{ priorityText }}</span>
        <span class="task-id">{{ task.id }}-{{ task.name }}</span>
      </div>

      <!-- Details -->
      <div class="card-details">
        <div class="detail-row">
          <span class="detail-label">Robot:</span>
          <span class="detail-value">{{ task.robotId || 'Unassigned' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Type:</span>
          <span class="detail-value">{{ taskTypeText }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Status:</span>
          <span class="detail-value">{{ statusText }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Duration:</span>
          <span class="detail-value">{{ durationText }} / Est. {{ estimatedText }}</span>
        </div>
        <div v-if="task.scheduleStage === 'assigned'" class="detail-row">
          <span class="detail-label">Finish:</span><span class="detail-value">{{ finishText }} · {{ formatDuration(task.remaining) }} left</span>
        </div>
        <div v-if="task.status === 'waiting' || task.status === 'failed'" class="detail-row"><span class="detail-value">{{ task.reasonCode }} {{ task.reason }}</span></div>
        <progress v-if="task.scheduleStage === 'assigned'" :value="task.duration" :max="task.estimatedTime || 1" style="width:100%;height:6px;accent-color:#38bdf8"></progress>
        <button v-if="task.status === 'failed'" :disabled="!store.connected" @click.stop="store.retryTask(task)" style="color:#7dd3fc">Retry task</button>
        <div class="detail-row route-row">
          <span class="route-icon">📍</span>
          <span class="detail-label">Route:</span>
          <span class="detail-value route-value">{{ routeText }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAppStore } from '../../stores/appStore'
import { computed } from 'vue'
import { formatDuration, getPriorityText, getStatusText } from '../../utils/demo'

const store = useAppStore()
const props = defineProps({
  task: { type: Object, required: true },
  isSelected: { type: Boolean, default: false }
})

defineEmits(['select'])

const priorityBarClass = computed(() => ({
  'bar-urgent': props.task.priority === 'urgent',
  'bar-normal': props.task.priority === 'normal',
  'bar-low': props.task.priority === 'low'
}))

const priorityTagClass = computed(() => ({
  'tag-urgent': props.task.priority === 'urgent',
  'tag-normal': props.task.priority === 'normal',
  'tag-low': props.task.priority === 'low'
}))

const priorityText = computed(() => getPriorityText(props.task.priority))
const statusText = computed(() => getStatusText(props.task.status))
const durationText = computed(() => formatDuration(props.task.duration))
const estimatedText = computed(() => formatDuration(props.task.estimatedTime))
const taskTypeText = computed(() => {
  const map = {
    delivery: 'Delivery',
    pickup: 'Pickup',
    sample: 'Sample Transport',
    document: 'Document Run',
    other: 'Other'
  }
  return map[props.task.taskType] || props.task.taskType || 'N/A'
})
const finishText = computed(() => new Date((store.clock.epoch + props.task.finishTime) * 1000).toLocaleTimeString('en-GB', { timeZone:'Asia/Shanghai' }))
const routeText = computed(() => {
  if (props.task.path?.length) return props.task.path.map(n => store.nodeById[n]?.label || n).join(' → ')
  if (props.task.route?.length) return props.task.route.join(' → ')
  if (props.task.routeNodes?.length > 0) return props.task.routeNodes.join('→')
  return 'Pending'
})
</script>

<style scoped>
.task-card {
  display: flex;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.15s ease;
}

.task-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.1);
}

.task-card.selected {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
}

.task-card.urgent {
  background: rgba(239, 68, 68, 0.06);
  border-color: rgba(239, 68, 68, 0.15);
}

.priority-bar {
  width: 4px;
  flex-shrink: 0;
}

.bar-urgent { background: #ef4444; }
.bar-normal { background: #f59e0b; }
.bar-low { background: #10b981; }

.card-content {
  flex: 1;
  padding: 10px 12px;
  min-width: 0;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.priority-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}

.tag-urgent { background: rgba(239, 68, 68, 0.2); color: #f87171; }
.tag-normal { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
.tag-low { background: rgba(16, 185, 129, 0.2); color: #34d399; }

.task-id {
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-details {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 4px;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
}

.detail-label {
  color: rgba(255, 255, 255, 0.45);
}

.detail-value {
  color: rgba(255, 255, 255, 0.75);
}

.route-row {
  margin-top: 2px;
}

.route-icon {
  font-size: 10px;
}

.route-value {
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
