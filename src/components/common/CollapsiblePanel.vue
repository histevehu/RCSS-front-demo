<template>
  <section class="panel" :data-panel="panelId" :class="{ folded }">
    <h2><button class="panel-heading" :aria-expanded="!folded" :aria-controls="`panel-${panelId}`" @click="ui.toggleFold(panelId)">
      <span>{{ title }}</span><span class="panel-heading-end"><span v-if="badge != null" class="badge">{{ badge }}</span><span aria-hidden="true">{{ folded ? '＋' : '−' }}</span></span>
    </button></h2>
    <div v-show="!folded" :id="`panel-${panelId}`" class="panel-body"><slot /></div>
  </section>
</template>
<script setup>
import { computed } from 'vue'
import { useUiStore } from '../../stores/uiStore'
const props = defineProps({ panelId:String, title:String, badge:[String,Number] })
const ui = useUiStore()
const folded = computed(() => ui.preferences.folds[props.panelId] === true)
</script>
