<template>
  <header ref="headerElement" class="workspace-header">
    <div class="brand"><h1>{{ ui.t('appTitle') }}</h1><span>{{ ui.t('liveMode') }}</span></div>
    <nav :aria-label="ui.t('tasks')" class="view-tabs"><router-link to="/">{{ ui.t('overview') }}</router-link><router-link to="/tasks">{{ ui.t('tasks') }}</router-link></nav>
    <div class="header-controls">
      <span class="connection" :class="{ offline:!store.connected }" :title="connectionText"><i></i><span>{{ connectionText }}</span></span>
      <time>{{ time }}</time>
      <button :disabled="!store.connected || store.busy" @click="store.control({paused:!store.clock.paused})">{{ ui.t(store.clock.paused ? 'resume':'pause') }}</button>
      <select :aria-label="ui.t('speed')" :value="store.clock.speed" :disabled="!store.connected || store.busy" @change="store.control({speed:Number($event.target.value)})"><option v-for="speed in [1,2,5,10]" :key="speed" :value="speed">{{ speed }}×</option></select>
      <button :disabled="!store.connected || store.busy" @click="store.control({},true)">{{ ui.t('reset') }}</button>
      <button class="focus-button" :aria-pressed="focus" @click="$emit('focus')">{{ ui.t(focus ? 'exitFocus':'focus') }}</button>
      <select v-model="ui.preferences.locale" :aria-label="ui.t('language')"><option value="zh-CN">中文</option><option value="en-US">English</option></select>
      <button :aria-label="ui.t('theme')" :title="ui.t(ui.preferences.theme === 'light' ? 'dark':'light')" @click="ui.preferences.theme = ui.preferences.theme === 'light' ? 'dark':'light'">{{ ui.t(ui.preferences.theme === 'light' ? 'dark':'light') }}</button>
    </div>
    <div v-if="store.error" role="alert" class="demo-error">{{ ui.errorText(store.error) }}</div>
  </header>
</template>
<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '../../stores/appStore'
import { useUiStore } from '../../stores/uiStore'
defineProps({focus:Boolean})
defineEmits(['focus'])
const store=useAppStore(), ui=useUiStore(), headerElement=ref(null)
const connectionText=computed(()=>ui.t(!store.connected ? 'disconnected' : store.clock.paused ? 'paused':'connected'))
const time=computed(()=>store.currentTime.toLocaleTimeString(ui.preferences.locale,{timeZone:'Asia/Shanghai',hour12:false}))
let observer
onMounted(()=>{ observer=new ResizeObserver(()=>document.documentElement.style.setProperty('--header-height',`${headerElement.value.offsetHeight}px`)); observer.observe(headerElement.value) })
onUnmounted(()=>observer?.disconnect())
</script>
<style scoped>
.workspace-header { position:absolute; inset:0 0 auto; z-index:20; min-height:48px; padding:7px 16px; background:var(--surface);  display:flex; align-items:center; gap:18px; flex-wrap:wrap; }
.brand { display:flex; flex-direction:column; gap:2px; flex-shrink:0; }.brand h1 { font-size:14px; font-weight:600; }.brand>span { font-size:11px; color:var(--muted); }
.view-tabs { display:flex; align-items:center; padding:2px; border:0; border-radius:0; gap:2px; }
.view-tabs a { padding:5px 10px; text-decoration:none; color:var(--muted); border-radius:0; border-bottom:2px solid transparent; white-space:nowrap; }
.view-tabs a.router-link-exact-active { color:var(--text); background:transparent; border-bottom:2px solid var(--accent); font-weight:600; }
.header-controls { margin-left:auto; display:flex; gap:6px; align-items:center; }.header-controls button,.header-controls select { height:32px; padding:4px 8px; white-space:nowrap; }
.connection { display:flex; align-items:center; gap:5px; font-size:11px; color:var(--success); }.connection i { width:6px; height:6px; border-radius:50%; background:currentColor; }.connection.offline { color:var(--danger); }
time { color:var(--muted); font-size:11px; font-variant-numeric:tabular-nums; margin:0 3px; }
.demo-error { position:absolute; top:100%; left:50%; transform:translateX(-50%); max-width:90vw; padding:8px 14px; border:1px solid var(--danger); background:var(--surface-solid); color:var(--danger); border-radius:0 0 8px 8px; }
@media(max-width:1199px) { .brand>span,time,.connection>span { display:none; }.workspace-header { gap:10px; } }
@media(max-width:800px) { .workspace-header { gap:8px; }.brand { flex:1; }.brand h1 { font-size:13px; }.header-controls { width:100%; margin:0; flex-wrap:wrap; gap:4px; }.header-controls button,.header-controls select { min-height:44px; padding:4px 6px; }.header-controls select:last-of-type { width:84px; }.focus-button { display:none; } }
</style>
