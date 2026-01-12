<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <!-- 任务名称 -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">任务名称</label>
      <input 
        v-model="form.name"
        type="text"
        required
        placeholder="请输入任务名称"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
      >
    </div>
    
    <!-- 优先级 -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">优先级</label>
      <div class="flex gap-4">
        <label 
          v-for="p in priorities" 
          :key="p.value"
          class="flex items-center gap-2 cursor-pointer"
        >
          <input 
            type="radio" 
            v-model="form.priority" 
            :value="p.value"
            class="accent-primary"
          >
          <span 
            class="px-2 py-1 rounded text-sm"
            :class="p.class"
          >{{ p.label }}</span>
        </label>
      </div>
    </div>
    
    <!-- 起点 -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">起点</label>
      <select 
        v-model="form.startLocation"
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="">请选择起点</option>
        <option v-for="loc in locations" :key="loc" :value="loc">{{ loc }}</option>
      </select>
    </div>
    
    <!-- 终点 -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">终点</label>
      <select 
        v-model="form.endLocation"
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="">请选择终点</option>
        <option v-for="loc in locations" :key="loc" :value="loc">{{ loc }}</option>
      </select>
    </div>
    
    <!-- 预计时间 -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">预计时间（分钟）</label>
      <input 
        v-model.number="form.estimatedMinutes"
        type="number"
        min="1"
        max="60"
        placeholder="5"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
      >
    </div>
    
    <!-- 备注 -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
      <textarea 
        v-model="form.notes"
        rows="2"
        placeholder="可选"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
      ></textarea>
    </div>
    
    <!-- 按钮 -->
    <div class="flex gap-3 pt-2">
      <button 
        type="submit"
        class="flex-1 bg-primary text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
      >
        创建任务
      </button>
      <button 
        type="button"
        @click="$emit('cancel')"
        class="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300 transition-colors"
      >
        取消
      </button>
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
  { value: 'urgent', label: '紧急', class: 'bg-red-100 text-red-700' },
  { value: 'normal', label: '普通', class: 'bg-yellow-100 text-yellow-700' },
  { value: 'low', label: '低优', class: 'bg-green-100 text-green-700' },
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
