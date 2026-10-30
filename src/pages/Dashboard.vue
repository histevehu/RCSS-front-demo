<template>
  <div class="dashboard">
    <div class="dashboard-map"><MapOverview /></div>
    <Header title="Task Dispatch Center" />

    <aside class="dashboard-left" aria-label="Task overview">
      <button @click="showTaskForm = true" class="new-task-button">
        <span aria-hidden="true">＋</span> New Task
      </button>
      <section class="glass-panel stats-panel">
        <div class="panel-header"><h2>Tasks</h2><span v-if="stats.urgent" class="urgent-badge">{{ stats.urgent }} urgent</span></div>
        <div class="stats-grid">
          <button class="stat-item executing" @click="handleNavigate('executing')"><strong>{{ stats.executing }}</strong><span>In Progress</span></button>
          <button class="stat-item waiting" @click="handleNavigate('waiting')"><strong>{{ stats.waiting }}</strong><span>Waiting</span></button>
          <button class="stat-item completed" @click="handleNavigate('completed')"><strong>{{ stats.completed }}</strong><span>Completed</span></button>
        </div>
        <div class="completion-header"><span>Completion Rate</span><strong>{{ stats.completionRate }}%</strong></div>
        <div class="completion-track"><div :style="{width: `${stats.completionRate}%`}"></div></div>
      </section>
      <section class="glass-panel session-panel" aria-label="Session metrics">
        <div><span>Tasks this session</span><strong>{{ stats.total }}</strong></div>
        <div><span>Average completion</span><strong>{{ stats.avgCompletionTime }}</strong></div>
        <button @click="handleNavigate('failed')"><span>Failed scheduling</span><strong>{{ stats.failed }}</strong></button>
      </section>
      <section class="glass-panel queue-panel">
        <div class="panel-header"><h2>Waiting Queue</h2><span class="panel-badge queue-badge">{{ waitingQueue.length }}</span></div>
        <WaitQueue />
      </section>
    </aside>

    <aside class="dashboard-right" aria-label="Robot overview">
      <section class="glass-panel robot-panel">
        <div class="panel-header"><h2>Robots</h2><span class="panel-badge">{{ robotStats.total }} Online</span></div>
        <RobotStatus />
      </section>
    </aside>

    <Modal v-model="showTaskForm" title="New Task" size="md">
      <TaskForm @submit="handleCreateTask" @cancel="showTaskForm = false" />
    </Modal>
  </div>
</template>
<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/appStore'
import Header from '../components/common/Header.vue'
import Modal from '../components/common/Modal.vue'
import RobotStatus from '../components/dashboard/RobotStatus.vue'
import MapOverview from '../components/dashboard/MapOverview.vue'
import WaitQueue from '../components/dashboard/WaitQueue.vue'
import TaskForm from '../components/taskPanel/TaskForm.vue'
const router = useRouter(), store = useAppStore()
const showTaskForm = ref(false)
const stats = computed(() => store.stats)
const robotStats = computed(() => store.robotStats)
const waitingQueue = computed(() => store.waitingQueue)
function handleNavigate(filter) { router.push({name:'tasks',query:{filter}}) }
function handleCreateTask(task) { store.selectTask(task.id); showTaskForm.value = false }
</script>
<style scoped>
.dashboard { --rail-width:320px; --map-overlay-left:calc(var(--rail-width) + 36px); position:relative; width:100vw; height:100vh; overflow:hidden; background:#0a0e14; }
.dashboard-map { position:absolute; inset:0; }
.dashboard-left,.dashboard-right { position:absolute; top:calc(var(--header-height,52px) + 20px); bottom:20px; width:var(--rail-width); display:flex; flex-direction:column; gap:16px; z-index:10; min-height:0; }
.dashboard-left { left:20px; overflow-y:auto; scrollbar-width:thin; }
.dashboard-right { right:20px; }
.glass-panel { border:1px solid #ffffff14; border-radius:14px; background:#0f172ade; backdrop-filter:blur(16px); box-shadow:0 8px 24px #0002; flex-shrink:0; }
.panel-header { display:flex; justify-content:space-between; align-items:center; gap:12px; padding:16px; }
h2 { margin:0; font-size:13px; font-weight:600; color:#e2e8f0; }
.panel-badge,.urgent-badge { padding:3px 8px; border-radius:12px; background:#10b9811f; color:#34d399; font-size:11px; white-space:nowrap; }
.queue-badge { background:#f59e0b1f; color:#fbbf24; }
.urgent-badge { background:#ef44441f; color:#fca5a5; }
.new-task-button { display:flex; align-items:center; justify-content:center; gap:8px; flex-shrink:0; width:100%; height:44px; border:1px solid #60a5fa55; border-radius:12px; color:#fff; background:linear-gradient(135deg,#3b82f6,#2563eb); box-shadow:0 6px 18px #2563eb26; font-size:14px; font-weight:600; cursor:pointer; }
.new-task-button:hover { filter:brightness(1.1); }
.new-task-button>span { font-size:20px; font-weight:400; }
.stats-panel { padding-bottom:16px; }
.stats-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; padding:0 16px; }
.stat-item { display:flex; flex-direction:column; align-items:center; gap:8px; padding:12px 4px; border:1px solid transparent; border-radius:10px; background:#ffffff05; cursor:pointer; }
.stat-item:hover { border-color:#ffffff20; background:#ffffff0a; }
.stat-item strong { font-size:27px; font-weight:650; line-height:1; }
.stat-item span { color:#94a3b8; font-size:10px; text-transform:uppercase; letter-spacing:.4px; }
.executing strong { color:#60a5fa; } .waiting strong { color:#fbbf24; } .completed strong { color:#34d399; }
.completion-header { display:flex; justify-content:space-between; margin:16px 16px 8px; color:#94a3b8; font-size:11px; }
.completion-header strong { color:#34d399; font-weight:500; }
.completion-track { height:5px; border-radius:4px; margin:0 16px; overflow:hidden; background:#ffffff0f; }
.completion-track>div { height:100%; background:#10b981; transition:width .2s; }
.session-panel { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); padding:16px 10px; }
.session-panel>div,.session-panel>button { display:flex; flex-direction:column; align-items:center; gap:8px; text-align:center; padding:0 5px; }
.session-panel>button { border:0; background:transparent; cursor:pointer; }
.session-panel>div+div,.session-panel>button { border-left:1px solid #ffffff0f; }
.session-panel span { color:#94a3b8; font-size:10px; min-height:28px; }
.session-panel strong { color:#e2e8f0; font-size:18px; font-weight:600; }
.queue-panel { display:flex; flex-direction:column; flex:1; min-height:150px; overflow:hidden; }
.queue-panel>.panel-header,.robot-panel>.panel-header { border-bottom:1px solid #ffffff0a; }
.robot-panel { display:flex; flex-direction:column; flex:1; min-height:0; overflow:hidden; }
@media(min-width:801px) and (max-width:1199px) { .dashboard { --rail-width:280px; } }
@media(max-width:800px) {
  .dashboard { overflow-y:auto; padding-top:var(--header-height,110px); }
  .dashboard-map { position:relative; height:430px; }
  .dashboard-left,.dashboard-right { position:relative; inset:auto; width:auto; margin:16px 12px; overflow:visible; }
  .queue-panel { min-height:220px; }
  .robot-panel { min-height:480px; }
  :deep(.map-tools) { top:12px; left:12px; flex-wrap:wrap; }
  :deep(.assignment-panel) { top:62px; left:12px; }
}
</style>
