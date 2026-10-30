<template>
  <form @submit.prevent="handleSubmit" class="form-container">
    <div class="form-group">
      <label for="task-name" class="form-label">{{ ui.t('taskName') }}</label>
      <input id="task-name" v-model="form.name" type="text" required :placeholder="ui.t('namePlaceholder')" class="form-input">
    </div>

    <div class="form-group">
      <label class="form-label">{{ ui.t('priority') }}</label>
      <div class="priority-options">
        <label v-for="p in priorities" :key="p.value" class="priority-option">
          <input type="radio" v-model="form.priority" :value="p.value" class="priority-radio">
          <span class="priority-tag" :class="p.class">{{ ui.t(p.value) }}</span>
        </label>
      </div>
    </div>

    <div class="form-group">
      <label for="start-location" class="form-label">{{ ui.t('start') }}</label>
      <select id="start-location" v-model="form.startLocation" required class="form-select">
        <option value="">{{ ui.t('selectStart') }}</option>
        <optgroup v-for="group in locationGroups" :key="group.floor" :label="`${group.floor}F`">
          <option v-for="loc in group.locations" :key="loc.id" :value="loc.canonicalNodeId">{{ loc.label }}</option>
        </optgroup>
      </select>
    </div>

    <div class="form-group">
      <label for="end-location" class="form-label">{{ ui.t('end') }}</label>
      <select id="end-location" v-model="form.endLocation" required class="form-select">
        <option value="">{{ ui.t('selectEnd') }}</option>
        <optgroup v-for="group in locationGroups" :key="group.floor" :label="`${group.floor}F`">
          <option v-for="loc in group.locations" :key="loc.id" :value="loc.canonicalNodeId">{{ loc.label }}</option>
        </optgroup>
      </select>
    </div>

    <div class="form-group">
      <label for="task-type" class="form-label">{{ ui.t('taskType') }}</label>
      <select id="task-type" v-model="form.taskType" required class="form-select">
        <option value="">{{ ui.t('taskType') }}</option>
        <option v-for="type in taskTypes" :key="type.value" :value="type.value">
          {{ ui.t(type.value) }}
        </option>
      </select>
    </div>

    <div class="form-group">
      <label for="task-notes" class="form-label">{{ ui.t('notes') }}</label>
      <textarea id="task-notes" v-model="form.notes" rows="2" :placeholder="ui.t('optional')" class="form-textarea"></textarea>
    </div>

    <p v-if="submitError" role="alert" class="error-text">{{ ui.errorText(submitError) }}</p>
    <div class="form-actions">
      <button type="submit" class="btn-primary" :disabled="submitting || !store.connected || !locationOptions.length">{{ ui.t(submitting ? 'submitting':'createTask') }}</button>
      <button type="button" :disabled="submitting" @click="$emit('cancel')" class="btn-secondary">{{ ui.t('cancel') }}</button>
    </div>
  </form>
</template>

<script setup>
import { reactive, computed, ref } from 'vue'
import { useAppStore } from '../../stores/appStore'
import { useUiStore } from '../../stores/uiStore'

const emit = defineEmits(['submit', 'cancel'])
const store = useAppStore(), ui=useUiStore()

const form = reactive({
  name: '',
  priority: 'normal',
  startLocation: '',
  endLocation: '',
  taskType: 'delivery',
  notes: '',
})

const priorities = [
  { value: 'urgent', class: 'tag-urgent' },
  { value: 'normal', class: 'tag-normal' },
  { value: 'low', class: 'tag-low' },
]

const taskTypes = [
  { value: 'delivery' },
  { value: 'pickup' },
  { value: 'sample' },
  { value: 'document' },
  { value: 'other' },
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
.form-container { display:flex; flex-direction:column; gap:12px; }.form-group { display:flex; flex-direction:column; gap:5px; }.form-label { color:var(--muted); font-weight:500; }.form-input,.form-select,.form-textarea { width:100%; padding:9px 10px; font-size:13px; }.form-input::placeholder,.form-textarea::placeholder { color:var(--muted); }.form-textarea { min-height:60px; resize:vertical; }.priority-options { display:flex; gap:16px; }.priority-option { display:flex; align-items:center; gap:5px; cursor:pointer; }.priority-tag { font-size:12px; }.tag-urgent { color:var(--danger); }.tag-normal { color:var(--warning); }.tag-low { color:var(--success); }.form-actions { display:flex; gap:8px; position:sticky; bottom:-1px; background:var(--surface-solid); padding:8px 0 0; }.form-actions>button { flex:1; min-height:38px; }.btn-primary { color:#fff; background:#2563c9; border-color:#2563c9; }
</style>
