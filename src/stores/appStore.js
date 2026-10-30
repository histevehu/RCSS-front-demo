import { defineStore } from 'pinia'
import { ref, computed, shallowRef } from 'vue'
import { api, formatDuration, interpolate } from '../utils/demo.js'
import { describeRobotLocation } from '../utils/mapInteraction.js'

export const useAppStore = defineStore('app', () => {
  const snapshot = shallowRef(null)
  const scene = shallowRef(null)
  const selectedTaskId = ref(null)
  const connected = ref(false)
  const error = ref('')
  const busy = ref(false)
  const uiNow = ref(0)
  const maps = shallowRef([])
  let receivedAt = 0, sequence = 0, applied = 0, generation = 0, polling = false
  let timer, uiTimer, scenePromise
  const retiredSessions = new Set()
  const sessionId = computed(() => snapshot.value?.sessionId)
  const clock = computed(() => snapshot.value?.clock || { now: 0, epoch: 0, paused: false, speed: 1 })
  function now() {
    const c = clock.value
    // Never extrapolate a disconnected scene indefinitely.
    return c.now + (connected.value && !c.paused ? Math.min(1.5, (performance.now() - receivedAt) / 1000) * c.speed : 0)
  }
  function apply(data, seq, gen) {
    if (gen !== generation || seq < applied || retiredSessions.has(data.sessionId)) return false
    if (sessionId.value && sessionId.value !== data.sessionId) {
      retiredSessions.add(sessionId.value)
      selectedTaskId.value = null
    }
    applied = seq
    snapshot.value = data
    receivedAt = performance.now()
    uiNow.value = data.clock.now
    connected.value = true
    error.value = ''
    return true
  }
  async function loadScene() {
    if (!scenePromise) scenePromise = api('scene').then(data => { scene.value = data; return data }).catch(e => { scenePromise = null; throw e })
    return scenePromise
  }
  async function refresh() {
    if (polling) return
    polling = true
    const seq = ++sequence, gen = generation
    try {
      const data = await api('state')
      if (apply(data, seq, gen)) await loadScene()
    } catch (e) {
      if (gen === generation && seq >= applied) {
        const frozen = now()
        connected.value = false
        if (snapshot.value) snapshot.value = { ...snapshot.value, clock: { ...clock.value, now: frozen } }
        uiNow.value = frozen
        error.value = 'Disconnected — display frozen. Reconnecting…'
      }
    } finally { polling = false }
  }
  function start() {
    refresh()
    timer = setInterval(refresh, 1000)
    uiTimer = setInterval(() => { uiNow.value = now() }, 100)
  }
  function stop() { clearInterval(timer); clearInterval(uiTimer); generation++ }
  async function control(body, reset = false) {
    if (busy.value || !connected.value) return
    busy.value = true
    const gen = ++generation, seq = ++sequence
    try {
      const data = await api(reset ? 'reset' : 'control', { sessionId: sessionId.value, ...body })
      apply(data, seq, gen)
      if (reset) selectedTaskId.value = null
    } catch (e) { error.value = e.message; await refresh() }
    finally { busy.value = false }
  }
  async function addTask(task, requestId, retryTaskId) {
    if (!connected.value || busy.value) throw new Error('Wait for the demo service to reconnect')
    const gen = generation
    const result = await api('tasks', { sessionId: sessionId.value, requestId, name: task.name,
      startNode: task.routeNodes[0], endNode: task.routeNodes[1], priority: task.priority,
      taskType: task.taskType, notes: task.notes || '', retryTaskId })
    if (gen !== generation || result.sessionId !== sessionId.value) throw new Error('Demonstration changed; submit again')
    selectedTaskId.value = result.task.id
    // Prevent a poll started before acceptance from replacing this task.
    applied = ++sequence
    snapshot.value = { ...snapshot.value, tasks: [result.task, ...snapshot.value.tasks.filter(t => t.id !== result.task.id)] }
    await refresh()
    return result.task
  }
  async function retryTask(task) {
    try { await addTask(task, crypto.randomUUID(), task.id) }
    catch (e) { error.value = e.message }
  }
  const tasks = computed(() => (snapshot.value?.tasks || []).map(task => ({ ...task,
    duration: task.startTime == null ? 0 : Math.max(0, Math.min(uiNow.value, task.finishTime) - task.startTime),
    waitSeconds: Math.max(0, (task.status === 'waiting' ? uiNow.value : task.startTime ?? task.createdSim) - task.createdSim),
    remaining: task.finishTime == null ? null : Math.max(0, task.finishTime - uiNow.value),
  })))
  const robots = computed(() => snapshot.value?.robots || [])
  const stats = computed(() => ({ total: 0, executing: 0, waiting: 0, completed: 0, urgent: 0, failed: 0,
    completionRate: 0, ...snapshot.value?.stats, avgCompletionTime: formatDuration(snapshot.value?.stats.avgCompletionSeconds) }))
  const robotStats = computed(() => {
    const executing = robots.value.filter(r => r.status === 'executing').length
    return { total: robots.value.length, executing, idle: robots.value.length - executing, charging: 0,
      utilization: robots.value.length ? Math.round(executing / robots.value.length * 100) : 0 }
  })
  const taskLogs = computed(() => (snapshot.value?.logs || []).map(log => ({ ...log, time: `+${formatDuration(log.time)}` })))
  const waitingQueue = computed(() => tasks.value.filter(t => t.status === 'waiting').sort((a, b) =>
    (a.startTime ?? Infinity) - (b.startTime ?? Infinity) || a.createdSim - b.createdSim))
  const selectedTask = computed(() => tasks.value.find(t => t.id === selectedTaskId.value))
  const currentTime = computed(() => new Date((clock.value.epoch + uiNow.value) * 1000))
  const nodeById = computed(() => Object.fromEntries((scene.value?.nodes || []).map(n => [n.id, n])))
  function getTasksByFilter(filter) {
    if (filter === 'urgent') return tasks.value.filter(t => t.priority === 'urgent' && ['waiting', 'executing'].includes(t.status))
    if (['waiting', 'executing', 'completed', 'failed'].includes(filter)) return tasks.value.filter(t => t.status === filter)
    if (filter === 'today') return tasks.value.filter(t => new Date(t.createdAt).toDateString() === currentTime.value.toDateString())
    return tasks.value
  }
  function robotPosition(robot, time) {
    const planned = (snapshot.value?.tasks || []).filter(t => t.robotId === robot.id && t.scheduleStage === 'assigned')
      .sort((a, b) => a.startTime - b.startTime)
    const started = planned.filter(t => t.startTime <= time)
    if (started.length) return interpolate(started.at(-1).trajectory, time)
    return robot.worldPosition
  }
  function robotLocation(robot, time = uiNow.value) {
    const initial = scene.value?.robots.find(r => r.name === robot.id)?.nodeId
    return describeRobotLocation(robot, snapshot.value?.tasks || [], nodeById.value, time, initial)
  }
  function robotFloor(robot, time) { return robotLocation(robot, time).floor }
  function selectTask(id) { selectedTaskId.value = id }
  function setMaps(data) { maps.value = data }
  return { scene, snapshot, sessionId, clock, uiNow, tasks, robots, stats, robotStats, taskLogs, waitingQueue,
    selectedTaskId, selectedTask, currentTime, nodeById, maps, connected, busy, error,
    loadScene, start, stop, refresh, control, addTask, retryTask, selectTask, setMaps, getTasksByFilter, robotPosition, robotFloor, robotLocation, now }
})
