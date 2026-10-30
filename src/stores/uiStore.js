import { defineStore } from 'pinia'
import { reactive, watch } from 'vue'
import { durationLabel, errorLabel, publicText, readPreferences, taskReason, translate, preferenceKey } from '../utils/presentation.js'

export const useUiStore = defineStore('ui', () => {
  let storage
  try { storage = globalThis.localStorage } catch { /* Private browsing may deny storage. */ }
  const preferences = reactive(readPreferences(storage))
  watch(preferences, value => {
    try { storage?.setItem(preferenceKey, JSON.stringify(value)) } catch { /* Preferences still work in memory. */ }
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = value.theme
      document.documentElement.lang = value.locale
      document.title = translate(value.locale, 'appTitle')
    }
  }, { deep:true, immediate:true, flush:'sync' })
  const t = key => translate(preferences.locale,key)
  const duration = value => durationLabel(value,preferences.locale)
  const display = value => publicText(value,preferences.locale)
  const errorText = value => errorLabel(value,preferences.locale)
  const reason = task => taskReason(task,preferences.locale)
  const time = (seconds, epoch) => seconds == null ? '—' : new Date((epoch + seconds) * 1000).toLocaleTimeString(preferences.locale,{timeZone:'Asia/Shanghai',hour12:false})
  function toggleFold(key) { preferences.folds[key] = !preferences.folds[key] }
  return { preferences, t, duration, display, errorText, reason, time, toggleFold }
})
