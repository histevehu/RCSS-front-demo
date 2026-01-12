<template>
  <router-view />
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useAppStore } from './stores/appStore'

const store = useAppStore()

// 定时更新时间
let timer = null
onMounted(() => {
  timer = setInterval(() => {
    store.updateTime()
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>
