<template>
  <Teleport to="body">
    <Transition name="modal">
      <div 
        v-if="modelValue" 
        class="fixed inset-0 z-50 flex items-center justify-center"
        @click.self="close"
      >
        <div class="absolute inset-0 bg-black/50"></div>
        <div 
          class="relative bg-white rounded-lg shadow-xl max-h-[90vh] overflow-auto"
          :class="sizeClass"
        >
          <div class="flex items-center justify-between p-4 border-b">
            <h3 class="text-lg font-semibold text-gray-800">{{ title }}</h3>
            <button 
              @click="close"
              class="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              &times;
            </button>
          </div>
          <div class="p-4">
            <slot></slot>
          </div>
          <div v-if="$slots.footer" class="p-4 border-t bg-gray-50">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'md' // sm, md, lg, xl, full
  }
})

const emit = defineEmits(['update:modelValue'])

const sizeClass = computed(() => {
  const sizes = {
    sm: 'w-[400px]',
    md: 'w-[600px]',
    lg: 'w-[800px]',
    xl: 'w-[1000px]',
    full: 'w-[95vw] h-[90vh]',
  }
  return sizes[props.size] || sizes.md
})

function close() {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.2s ease;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95);
}
</style>
