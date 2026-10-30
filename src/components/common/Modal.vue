<template>
  <Teleport to="body"><div v-if="modelValue" class="modal-overlay" @click.self="close" @keydown.esc.stop="close">
    <section ref="dialog" role="dialog" aria-modal="true" :aria-labelledby="titleId" tabindex="-1" class="modal-container" :class="`modal-${size}`" @keydown.tab="trapFocus">
      <div class="modal-header"><h3 :id="titleId">{{ title }}</h3><button :aria-label="ui.t('close')" @click="close">×</button></div>
      <div class="modal-body"><slot /></div><div v-if="$slots.footer" class="modal-footer"><slot name="footer" /></div>
    </section>
  </div></Teleport>
</template>
<script setup>
import {ref,watch,nextTick,onUnmounted,useId} from 'vue'
import {useUiStore} from '../../stores/uiStore'
const props=defineProps({modelValue:Boolean,title:String,size:{type:String,default:'md'}}),emit=defineEmits(['update:modelValue'])
const ui=useUiStore(),dialog=ref(null),titleId=useId()
let previousFocus
function close() { emit('update:modelValue',false) }
function trapFocus(event) {
  const elements=[...dialog.value.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]')]
  const first=elements[0],last=elements.at(-1)
  if(!first) { event.preventDefault(); return }
  if(event.shiftKey && (document.activeElement===first || document.activeElement===dialog.value)) { event.preventDefault(); last.focus() }
  else if(!event.shiftKey && document.activeElement===last) { event.preventDefault(); first.focus() }
}
watch(()=>props.modelValue,async open=>{
  if(open) { previousFocus=document.activeElement; await nextTick(); (dialog.value?.querySelector('input,select,textarea') || dialog.value)?.focus() }
  else previousFocus?.focus?.()
})
onUnmounted(()=>previousFocus?.focus?.())
</script>
<style scoped>
.modal-overlay { position:fixed; inset:0; z-index:50; display:flex; align-items:center; justify-content:center; padding:12px; background:var(--backdrop); backdrop-filter:blur(3px); }
.modal-container { width:500px; max-width:100%; max-height:90dvh; display:flex; flex-direction:column; background:var(--surface-solid); border:1px solid var(--border); border-radius:12px; box-shadow:0 20px 70px #0003; outline:none; }
.modal-xl { width:1000px; }.modal-lg { width:800px; }.modal-sm { width:400px; }.modal-header { display:flex; justify-content:space-between; align-items:center; padding:10px 14px; border-bottom:1px solid var(--border); flex:none; }.modal-header h3 { font-size:14px; font-weight:600; }.modal-header button { font-size:20px; width:32px; height:32px; padding:0; border:0; background:transparent; }.modal-body { padding:14px; overflow:auto; overscroll-behavior:contain; min-height:0; }.modal-footer { padding:12px; border-top:1px solid var(--border); }
@media(max-width:800px) { .modal-header button { width:44px; height:44px; }.modal-container { max-height:calc(100dvh - 24px); } }
</style>
