<template>
  <form @submit.prevent="handleSubmit" class="form-container">
    <div class="form-group">
      <label class="form-label">Task Name</label>
      <input v-model="form.name" type="text" required placeholder="Enter task name" class="form-input">
    </div>

    <div class="form-group">
      <label class="form-label">Priority</label>
      <div class="priority-options">
        <label v-for="p in priorities" :key="p.value" class="priority-option">
          <input type="radio" v-model="form.priority" :value="p.value" class="priority-radio">
          <span class="priority-tag" :class="p.class">{{ p.label }}</span>
        </label>
      </div>
    </div>

    <div class="form-group">
      <label for="start-location" class="form-label">Start</label>
      <select id="start-location" v-model="form.startLocation" required class="form-select">
        <option value="">Select start location</option>
        <optgroup v-for="group in locationGroups" :key="group.floor" :label="`${group.floor}F`">
          <option v-for="loc in group.locations" :key="loc.id" :value="loc.canonicalNodeId">{{ loc.label }}</option>
        </optgroup>
      </select>
    </div>

    <div class="form-group">
      <label for="end-location" class="form-label">End</label>
      <select id="end-location" v-model="form.endLocation" required class="form-select">
        <option value="">Select end location</option>
        <optgroup v-for="group in locationGroups" :key="group.floor" :label="`${group.floor}F`">
          <option v-for="loc in group.locations" :key="loc.id" :value="loc.canonicalNodeId">{{ loc.label }}</option>
        </optgroup>
      </select>
    </div>

    <div class="form-group">
      <label class="form-label">Task Type</label>
      <select v-model="form.taskType" required class="form-select">
        <option value="">Select task type</option>
        <option v-for="type in taskTypes" :key="type.value" :value="type.value">
          {{ type.label }}
        </option>
      </select>
    </div>

    <div class="form-group">
      <label class="form-label">Notes</label>
      <textarea v-model="form.notes" rows="2" placeholder="Optional" class="form-textarea"></textarea>
    </div>

    <p v-if="submitError" role="alert" style="color:#fca5a5">{{ submitError }}</p>
    <div class="form-actions">
      <button type="submit" class="btn-primary" :disabled="submitting || !store.connected || !locationOptions.length">{{ submitting ? 'Submitting…' : 'Create Task' }}</button>
      <button type="button" :disabled="submitting" @click="$emit('cancel')" class="btn-secondary">Cancel</button>
    </div>
  </form>
</template>

<script setup>
import { reactive, computed, ref } from 'vue'
import { useAppStore } from '../../stores/appStore'

const emit = defineEmits(['submit', 'cancel'])
const store = useAppStore()

const form = reactive({
  name: '',
  priority: 'normal',
  startLocation: '',
  endLocation: '',
  taskType: 'delivery',
  notes: '',
})

const priorities = [
  { value: 'urgent', label: 'Urgent', class: 'tag-urgent' },
  { value: 'normal', label: 'Normal', class: 'tag-normal' },
  { value: 'low', label: 'Low', class: 'tag-low' },
]

const taskTypes = [
  { value: 'delivery', label: 'Delivery' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'sample', label: 'Sample Transport' },
  { value: 'document', label: 'Document Run' },
  { value: 'other', label: 'Other' },
]

const locationOptions = computed(() => store.locations.filter(location => location.selectable))
const locationGroups = computed(() => [...new Set(locationOptions.value.map(location => location.floor))].sort((a,b) => a-b).map(floor => ({
  floor, locations: locationOptions.value.filter(location => location.floor === floor).sort((a,b) => Number(a.code.slice(1))-Number(b.code.slice(1)))
})))
const submitting = ref(false)
const submitError = ref('')
let pendingPayload, pendingRequest
async function handleSubmit() {
  if (submitting.value || !form.name.trim() || !form.startLocation || !form.endLocation) return
  submitting.value = true; submitError.value = ''
  const task = { name: form.name, priority: form.priority, taskType: form.taskType,
    routeNodes: [form.startLocation, form.endLocation], notes: form.notes }
  const serialized = JSON.stringify({ ...task, session:store.sessionId })
  if (serialized !== pendingPayload) { pendingPayload = serialized; pendingRequest = crypto.randomUUID() }
  try {
    const created = await store.addTask(task, pendingRequest)
    emit('submit', created)
  } catch (e) { submitError.value = e.message }
  finally { submitting.value = false }
}
</script>

<style scoped>
.form-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  outline: none;
  transition: all 0.15s ease;
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: rgba(255, 255, 255, 0.35);
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

.form-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M3 4.5L6 7.5L9 4.5'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
}

.form-select option {
  background: #1e293b;
  color: #fff;
}

.form-textarea {
  resize: vertical;
  min-height: 60px;
}

.priority-options {
  display: flex;
  gap: 12px;
}

.priority-option {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.priority-radio {
  accent-color: #3b82f6;
}

.priority-tag {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 500;
}

.tag-urgent {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.tag-normal {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.tag-low {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
}

.form-actions {
  display: flex;
  gap: 12px;
  padding-top: 8px;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  border: none;
}

.btn-primary:hover {
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.12);
}
</style>
