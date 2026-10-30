<template>
  <div class="performance">
    <div><span>Tasks this session</span><strong>{{ store.stats.total }}</strong></div>
    <div><span>Average completion</span><strong>{{ store.stats.avgCompletionTime }}</strong></div>
    <div><span>Failed scheduling</span><strong>{{ store.stats.failed }}</strong></div>
    <div><span>Conflict efficiency</span><strong>—</strong><small>Not collected</small></div>
    <div><span>Elevator utilization</span><strong>—</strong><small>No elevators configured</small></div>
  </div>
</template>
<script setup>
import { useAppStore } from '../../stores/appStore'
const store = useAppStore()
</script>
<style scoped>
.performance { display:flex; flex-wrap:wrap; gap:20px; padding:16px; color:#cbd5e1; }
.performance>div { flex:1; min-width:105px; display:flex; flex-direction:column; gap:6px; }
span,small { font-size:11px; color:#94a3b8; } strong { font-size:20px; font-weight:600; color:#f1f5f9; }
</style>
