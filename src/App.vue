<template><router-view /></template>
<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useAppStore } from './stores/appStore'
const store = useAppStore()
onMounted(store.start)
onUnmounted(store.stop)
</script>
