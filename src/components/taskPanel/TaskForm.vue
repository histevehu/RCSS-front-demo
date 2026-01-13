<template>
  <form @submit.prevent="handleSubmit" class="form-container">
    <div class="form-group">
      <label class="form-label">任务名称</label>
      <input v-model="form.name" type="text" required placeholder="请输入任务名称" class="form-input">
    </div>

    <div class="form-group">
      <label class="form-label">优先级</label>
      <div class="priority-options">
        <label v-for="p in priorities" :key="p.value" class="priority-option">
          <input type="radio" v-model="form.priority" :value="p.value" class="priority-radio">
          <span class="priority-tag" :class="p.class">{{ p.label }}</span>
        </label>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">起点</label>
      <select v-model="form.startLocation" required class="form-select">
        <option value="">请选择起点</option>
        <option v-for="loc in locations" :key="loc" :value="loc">{{ loc }}</option>
      </select>
    </div>

    <div class="form-group">
      <label class="form-label">终点</label>
      <select v-model="form.endLocation" required class="form-select">
        <option value="">请选择终点</option>
        <option v-for="loc in locations" :key="loc" :value="loc">{{ loc }}</option>
      </select>
    </div>

    <div class="form-group">
      <label class="form-label">预计时间（分钟）</label>
      <input v-model.number="form.estimatedMinutes" type="number" min="1" max="60" placeholder="5" class="form-input">
    </div>

    <div class="form-group">
      <label class="form-label">备注</label>
      <textarea v-model="form.notes" rows="2" placeholder="可选" class="form-textarea"></textarea>
    </div>

    <div class="form-actions">
      <button type="submit" class="btn-primary">创建任务</button>
      <button type="button" @click="$emit('cancel')" class="btn-secondary">取消</button>
    </div>
  </form>
</template>

<script setup>
import { reactive } from 'vue'

const emit = defineEmits(['submit', 'cancel'])

const form = reactive({
  name: '',
  priority: 'normal',
  startLocation: '',
  endLocation: '',
  estimatedMinutes: 5,
  notes: '',
})

const priorities = [
  { value: 'urgent', label: '紧急', class: 'tag-urgent' },
  { value: 'normal', label: '普通', class: 'tag-normal' },
  { value: 'low', label: '低优', class: 'tag-low' },
]

const locations = [
  'A楼1F 药房',
  'A楼2F 急诊科',
  'A楼3F 病房',
  'A楼4F 手术室',
  'B楼1F 检验科',
  'B楼2F 门诊',
  'B楼3F 病房',
  'B楼4F 办公室',
  'C楼1F 配液中心',
  'C楼2F 诊室',
  'C楼3F 病房',
  'C楼4F 康复科',
]

function handleSubmit() {
  if (!form.name || !form.startLocation || !form.endLocation) return
  
  emit('submit', {
    name: form.name,
    priority: form.priority,
    route: [form.startLocation, form.endLocation],
    estimatedTime: form.estimatedMinutes * 60,
    notes: form.notes,
  })
  
  // 重置表单
  form.name = ''
  form.priority = 'normal'
  form.startLocation = ''
  form.endLocation = ''
  form.estimatedMinutes = 5
  form.notes = ''
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
