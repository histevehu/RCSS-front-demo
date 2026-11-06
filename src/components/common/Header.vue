<template>
  <header ref="headerElement" class="workspace-header">
    <div class="brand"><h1>{{ ui.t('appTitle') }}</h1><span>{{ ui.t('liveMode') }}</span></div>
    <select class="campus-select" :aria-label="ui.t('campus')" :value="store.scene?.campusId" :disabled="!store.scene || store.busy" @change="selectCampus"><option v-if="!store.scene" value="">{{ ui.t('loadingCampus') }}</option><option v-for="campus in store.scene?.campuses || []" :key="campus.id" :value="campus.id">{{ campus.names[ui.preferences.locale] }}</option></select>
    <span class="campus-feedback" v-if="store.sceneSwitch?.status==='loading'" role="status" aria-live="polite">{{ ui.t('switchingCampus') }} {{ store.scene?.campuses?.find(c=>c.id===store.sceneSwitch.sceneId)?.names[ui.preferences.locale] }} · {{ ui.t(`switch_${store.sceneSwitch.stage}`) }}</span><span class="campus-feedback" v-if="store.sceneSwitch?.status==='failed'" role="alert">{{ campusError }} <button :disabled="store.busy || !store.connected" @click="selectCampus({target:{value:store.sceneSwitch.sceneId}})">{{ ui.t('retryCampus') }}</button></span>
    <nav class="page-tabs" :aria-label="ui.t('workspacePages')"><RouterLink :to="{name:'dashboard',query:route.query}" :aria-current="route.name==='dashboard' ? 'page':undefined">{{ ui.t('overview') }}</RouterLink><RouterLink :to="{name:'tasks',query:route.query}" :aria-current="route.name==='tasks' ? 'page':undefined">{{ ui.t('tasks') }}</RouterLink></nav>
    <div class="header-controls">
      <span class="connection" :class="{offline:!store.connected}" :title="connectionText" :aria-label="connectionText"><i aria-hidden="true"></i><span>{{ connectionText }}</span></span>
      <time>{{ time }}</time>
      <button class="pause-control" :disabled="!store.connected || store.busy" @click="store.control({paused:!store.clock.paused})">{{ ui.t(store.clock.paused ? 'resume':'pause') }}</button>
      <select class="speed-control" :aria-label="ui.t('speed')" :value="store.clock.speed" :disabled="!store.connected || store.busy" @change="store.control({speed:Number($event.target.value)})"><option v-for="speed in [1,2,5,10]" :key="speed" :value="speed">{{ speed }}×</option></select>
      <div class="more-control">
        <button ref="moreTrigger" :id="triggerId" class="more-trigger" :aria-expanded="moreOpen" :aria-controls="menuId" @click="toggleMore">{{ ui.t('moreActions') }} <span aria-hidden="true">⌄</span></button>
        <!-- Keep the record component mounted when hidden: downloads/file pickers
             and teleported review dialogs must outlive the menu itself. -->
        <div v-show="moreOpen" ref="morePanel" :id="menuId" class="more-panel" role="region" :aria-labelledby="triggerId">
          <section class="menu-group">
            <h2>{{ ui.t('taskRecords') }}</h2>
            <RecordTransfer @action="closeMore(true)" />
          </section>
          <section class="menu-group">
            <h2>{{ ui.t('interfaceSettings') }}</h2>
            <label class="setting-row"><span>{{ ui.t('language') }}</span><select v-model="ui.preferences.locale"><option value="zh-CN">中文</option><option value="en-US">English</option></select></label>
            <label class="setting-row"><span>{{ ui.t('theme') }}</span><select v-model="ui.preferences.theme"><option value="light">{{ ui.t('light') }}</option><option value="dark">{{ ui.t('dark') }}</option></select></label>
            <label class="setting-row focus-setting"><span>{{ ui.t('focus') }}</span><input type="checkbox" role="switch" :checked="focus" @change="$emit('focus');closeMore(true)"></label>
          </section>
          <section class="menu-group">
            <h2>{{ ui.t('currentCampus') }}</h2>
            <button class="reset-action" :disabled="!store.connected || store.busy" @click="resetDemo">{{ ui.t('reset') }}</button>
          </section>
        </div>
      </div>
    </div>
    <div v-if="store.error" role="alert" class="demo-error">{{ ui.errorText(store.error) }}</div>
  </header>
</template>
<script setup>
import { computed, ref, onMounted, onUnmounted, watch, nextTick, useId } from 'vue'
import { useAppStore } from '../../stores/appStore'
import { useUiStore } from '../../stores/uiStore'
import {useRoute,useRouter} from 'vue-router'
import RecordTransfer from '../taskPanel/RecordTransfer.vue'
defineProps({focus:Boolean})
defineEmits(['focus'])
const store=useAppStore(), ui=useUiStore(), route=useRoute(), router=useRouter(), headerElement=ref(null),moreTrigger=ref(null),morePanel=ref(null)
// URL criteria belong to the active campus; old place/task IDs must not leak.
watch(()=>store.scene?.campusId,(id,previous)=>{ if(previous && previous!==id) router.replace({query:{}}) })
const campusError=computed(()=>ui.t(({MAP_RESOURCE_TIMEOUT:'mapResourceTimeout',MAP_RESOURCE_CONNECTION:'mapResourceConnection',MAP_RESOURCE_HTTP:'mapResourceHttp',CAMPUS_PREPARATION_TIMEOUT:'campusPreparationTimeout'})[store.sceneSwitch?.errorCode] || 'campusLoadError'))
const moreOpen=ref(false),menuId=useId(),triggerId=useId()
function closeMore(restoreFocus=false) {
  moreOpen.value=false
  if(restoreFocus) moreTrigger.value?.focus()
}
async function toggleMore() {
  if(moreOpen.value) {closeMore(true);return}
  moreOpen.value=true
  await nextTick()
  const first=[...morePanel.value.querySelectorAll('button:not(:disabled),select:not(:disabled),input:not(:disabled)')].find(element=>element.getClientRects().length)
  first?.focus()
}
function dismissMore(event) {
  if(!moreOpen.value) return
  if(event.type==='keydown' && event.key==='Escape') {event.preventDefault();closeMore(true)}
  else if(event.type==='pointerdown' && !morePanel.value?.contains(event.target) && !moreTrigger.value?.contains(event.target)) closeMore()
}
function resetDemo() { closeMore(true);store.control({},true) }
watch(()=>route.fullPath,()=>closeMore())
// Switching changes the shared active campus and preserves each campus session.
async function selectCampus(event) {
  const id=event.target.value
  if(id!==store.scene?.campusId) await store.switchScene(id)
  event.target.value=store.scene?.campusId
}
const connectionText=computed(()=>ui.t(!store.connected ? 'disconnected' : store.clock.paused ? 'paused':'connected'))
const time=computed(()=>store.currentTime.toLocaleTimeString(ui.preferences.locale,{timeZone:'Asia/Shanghai',hour12:false}))
let observer
onMounted(()=>{
  observer=new ResizeObserver(()=>document.documentElement.style.setProperty('--header-height',`${headerElement.value.offsetHeight}px`))
  observer.observe(headerElement.value)
  document.addEventListener('pointerdown',dismissMore)
  document.addEventListener('keydown',dismissMore)
})
onUnmounted(()=>{
  observer?.disconnect()
  document.removeEventListener('pointerdown',dismissMore)
  document.removeEventListener('keydown',dismissMore)
})
</script>
<style scoped>
.workspace-header { position:absolute; inset:0 0 auto; z-index:20; min-height:48px; padding:7px 16px; background:var(--surface); display:flex; align-items:center; gap:16px; flex-wrap:wrap; }
.brand { display:flex; flex-direction:column; gap:2px; flex-shrink:0; min-width:0; }.brand h1 { font-size:14px; font-weight:600; color:var(--text); }.brand>span { font-size:11px; color:var(--muted); }
.campus-select { max-width:150px; height:34px; min-width:0; }.page-tabs { display:flex; align-self:stretch; gap:16px; }.page-tabs a { display:flex; align-items:center; text-decoration:none; font-size:13px; color:var(--muted); border-bottom:2px solid transparent; padding:5px 0; white-space:nowrap; }.page-tabs a[aria-current="page"] { border-color:var(--text); color:var(--text); font-weight:600; }
.header-controls { margin-left:auto; display:flex; gap:6px; align-items:center; }.header-controls>button,.header-controls>select,.more-trigger { height:32px; padding:4px 8px; white-space:nowrap; }
.connection { display:flex; align-items:center; gap:5px; font-size:11px; color:var(--success); }.connection i { width:6px; height:6px; border-radius:50%; background:currentColor; }.connection.offline { color:var(--danger); }
time { color:var(--muted); font-size:11px; font-variant-numeric:tabular-nums; margin:0 4px; }
.more-trigger { display:flex; gap:8px; align-items:center; }.more-trigger[aria-expanded="true"] { background:var(--active); }
.more-panel { position:absolute; top:calc(100% + 6px); right:16px; width:300px; max-width:calc(100vw - 32px); max-height:calc(100dvh - var(--header-height) - 24px); overflow:auto; overscroll-behavior:contain; padding:8px; background:var(--surface-solid); border:1px solid var(--border); border-radius:8px; box-shadow:var(--shadow); }
.menu-group { padding:8px; }.menu-group+.menu-group { border-top:1px solid var(--row-border); margin-top:4px; padding-top:12px; }.menu-group h2 { margin:0 0 6px; font-size:11px; line-height:1.5; color:var(--muted); font-weight:500; }
.setting-row { display:flex; align-items:center; justify-content:space-between; gap:12px; min-height:40px; font-size:12px; color:var(--text); }.setting-row select { width:126px; min-width:0; min-height:32px; padding:4px 8px; }.focus-setting input { appearance:none; position:relative; width:32px; height:20px; padding:0; margin:0; border:1px solid var(--control-border); border-radius:999px; background:var(--subtle); cursor:pointer; }
.focus-setting input::before { content:''; position:absolute; width:14px; height:14px; top:2px; left:2px; border-radius:50%; background:var(--muted); }
.focus-setting input:checked { background:var(--accent); border-color:var(--accent); }.focus-setting input:checked::before { transform:translateX(12px); background:var(--surface-solid); }
.reset-action { width:100%; min-height:36px; padding:6px 8px; text-align:left; color:var(--danger); border:0; background:transparent; }.reset-action:hover { background:var(--hover); }
.campus-feedback { order:5; flex-basis:100%; font-size:12px; color:var(--muted); }
.demo-error { position:absolute; top:100%; left:50%; transform:translateX(-50%); max-width:90vw; padding:8px 14px; border:1px solid var(--danger); background:var(--surface-solid); color:var(--danger); border-radius:0 0 8px 8px; }
@media(min-width:801px) and (max-width:1100px) { .workspace-header { gap:10px; }.brand { max-width:210px; }.brand h1 { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }.brand>span,.header-controls time,.connection>span { display:none; }.campus-select { max-width:125px; } }
@media(max-width:800px) {
  /* Two rows: title/status/menu above campus/navigation/playback. */
  .workspace-header { display:grid; grid-template-columns:minmax(80px,1fr) auto auto auto; gap:6px; padding:8px 16px; }
  .brand { grid-row:1; grid-column:1/3; }.brand h1 { font-size:14px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }.brand>span { display:none; }
  .header-controls { display:contents; }.connection { grid-row:1; grid-column:3; justify-self:center; }.connection>span,.header-controls time { display:none; }
  .more-control { grid-row:1; grid-column:4; justify-self:end; }.more-trigger { min-width:44px; min-height:44px; padding:4px 6px; font-size:12px; gap:4px; }
  .campus-select { grid-row:2; grid-column:1; width:100%; max-width:150px; min-height:44px; padding:4px 6px; font-size:12px; }
  .page-tabs { grid-row:2; grid-column:2; gap:10px; }.page-tabs a { font-size:12px; min-height:44px; }
  .pause-control { grid-row:2; grid-column:3; min-height:44px; min-width:44px; font-size:12px; padding:4px 6px!important; }
  .speed-control { grid-row:2; grid-column:4; min-height:44px; width:56px; font-size:12px; padding:4px!important; }
  .more-panel { max-height:calc(100dvh - var(--header-height) - 20px); }.setting-row { min-height:48px; }.setting-row select { min-height:44px; }.reset-action { min-height:44px; }
  .campus-feedback { grid-column:1/-1; }
}
</style>
