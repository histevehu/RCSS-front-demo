<template>
  <div class="floor-distribution">
    <p class="distribution-note">{{ ui.t('destinationBasis') }}</p>
    <button v-for="floor in data.floors" :key="floor.floor" class="floor-row" @click="$emit('filter',{destinationFloor:String(floor.floor)})">
      <span>{{ floor.label }}</span><span class="floor-bar"><i :style="{width:`${floor.percent}%`}"></i></span><strong>{{ floor.count }}</strong><span class="percentage">{{ Math.round(floor.percent) }}%</span>
    </button>
    <h3>{{ ui.t('topDestinations') }}</h3>
    <div class="destination-list" tabindex="0" :aria-label="ui.t('topDestinations')"><button v-for="place in data.destinations" :key="place.locationId" @click="$emit('filter',{destinationLocation:place.locationId})"><span>{{ ui.display(place.label) }}</span><strong>{{ place.count }}</strong></button><p v-if="!data.destinations.length" class="empty">{{ ui.t('noDestinationTasks') }}</p></div>
  </div>
</template>
<script setup>
import {computed} from 'vue'
import {useAppStore} from '../../stores/appStore'
import {useUiStore} from '../../stores/uiStore'
defineEmits(['filter'])
const store=useAppStore(),ui=useUiStore()
const data=computed(()=>store.snapshot?.floorDistribution || {floors:[],destinations:[]})
</script>
<style scoped>
.floor-distribution { display:flex; flex-direction:column; min-height:0; height:100%; gap:8px; }.distribution-note { font-size:12px; color:var(--muted); }.floor-row { display:flex; gap:10px; align-items:center; border:0; padding:8px 0; background:transparent; font-size:13px; }.floor-bar { flex:1; height:5px; background:var(--subtle); overflow:hidden; border-radius:2px; }.floor-bar i { display:block; height:100%; background:var(--accent); }.floor-row strong { min-width:20px; text-align:right; }.percentage { color:var(--muted); min-width:34px; text-align:right; font-size:12px; }h3 { font-size:13px; font-weight:500; padding-top:8px; border-top:1px solid var(--border); }.destination-list { flex:1; min-height:0; overflow:auto; }.destination-list button { display:flex; justify-content:space-between; width:100%; padding:9px 0; border:0; background:transparent; font-size:13px; }.destination-list button+button { border-top:1px solid var(--row-border); }.destination-list button:hover,.floor-row:hover { background:var(--subtle); }
</style>
