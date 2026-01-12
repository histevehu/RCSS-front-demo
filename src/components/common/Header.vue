<template>
  <header class="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <h1 class="text-xl font-bold text-primary">{{ title }}</h1>
      <div class="relative">
        <select 
          v-model="selectedDistrict"
          class="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
        >
          <option v-for="district in districts" :key="district.id" :value="district.id">
            {{ district.name }}
          </option>
        </select>
        <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▼</span>
      </div>
    </div>
    <div class="flex items-center gap-4">
      <slot name="actions"></slot>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '../../stores/appStore'

defineProps({
  title: {
    type: String,
    default: '首页示意图'
  }
})

const store = useAppStore()
const districts = store.districts

const selectedDistrict = computed({
  get: () => store.currentDistrict,
  set: (val) => store.setDistrict(val)
})
</script>
