<template><router-view /></template>
<script setup>
import {useRoute} from 'vue-router'
import { onMounted, onUnmounted } from 'vue'
import { useAppStore } from './stores/appStore'
const store = useAppStore()
const route=useRoute()
onMounted(()=>{if(route.name!=='replay')store.start()})
onUnmounted(store.stop)
</script>
