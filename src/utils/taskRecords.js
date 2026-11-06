// Portable data only: a record is never merged into the live Pinia session.
export const RECORD_FORMAT = 'rcss-demo-records'
export const RECORD_LIMIT = 20 * 1024 * 1024
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const text = value => typeof value === 'string' && value.length <= 10000
const finite = value => typeof value === 'number' && Number.isFinite(value)

/** Validate data before rendering it. Unknown executable/URL fields are ignored. */
export function parseTaskRecords(source) {
  if (typeof source !== 'string' || new Blob([source]).size > RECORD_LIMIT) throw new Error('recordsTooLarge')
  let record
  try { record = JSON.parse(source) } catch { throw new Error('recordsInvalid') }
  if (record?.format !== RECORD_FORMAT || record.version !== 2) throw new Error('recordsUnsupported')
  if (!object(record.replay) || !Array.isArray(record.replay.inputs) || !Array.isArray(record.replay.batches) || record.replay.inputs.length>5000) throw new Error('recordsInvalid')
  const {scene,state} = record
  const invalid = () => { throw new Error('recordsInvalid') }
  if (!object(scene) || !object(state) || !object(state.clock) ||
      !text(record.exportedAt) || !Number.isFinite(Date.parse(record.exportedAt)) ||
      !text(scene.campusId) || !text(scene.version) || state.campusId !== scene.campusId || state.sceneVersion !== scene.version ||
      !text(state.sessionId) || !finite(state.clock.now) || !finite(state.clock.epoch) ||
      !Array.isArray(scene.nodes) || scene.nodes.length > 100000 ||
      !Array.isArray(state.tasks) || state.tasks.length > 5000 ||
      !Array.isArray(state.logs) || state.logs.length > 100000 ||
      !Array.isArray(state.robots)) invalid()
  const nodes = new Set()
  for (const node of scene.nodes) {
    if (!object(node) || !text(node.id) || nodes.has(node.id)) invalid()
    nodes.add(node.id)
  }
  const byId = new Map(scene.nodes.map(n=>[n.id,n]))
  for (const node of scene.nodes) {
    if (node.displayKind==='lane' && (!nodes.has(node.laneFrom) || !nodes.has(node.laneTo) ||
        byId.get(node.laneFrom)?.displayKind==='lane' ||
        byId.get(node.laneTo)?.displayKind==='lane')) invalid()
  }
  const ids = new Set()
  for (const task of state.tasks) {
    if (!object(task) || !text(task.id) || ids.has(task.id) || !text(task.name) || !text(task.taskType) ||
        !['waiting','executing','completed','failed'].includes(task.status) ||
        !['collecting','scheduling','assigned','failed'].includes(task.scheduleStage) ||
        !['normal','urgent','low'].includes(task.priority) ||
        !(task.robotCapabilities == null || (Array.isArray(task.robotCapabilities) && task.robotCapabilities.every(text))) ||
        !(task.capability == null || text(task.capability)) ||
        !(task.batchId == null || text(task.batchId)) || !(task.robotId == null || text(task.robotId)) ||
        !Array.isArray(task.routeNodes) || task.routeNodes.length !== 2 || !task.routeNodes.every(id=>nodes.has(id)) ||
        !Array.isArray(task.path) || !task.path.every(id=>nodes.has(id)) ||
        !Array.isArray(task.timetable) || !task.timetable.every(row=>object(row) && nodes.has(row.nodeId) && finite(row.arrival) && finite(row.depart) && row.depart >= row.arrival) ||
        !Array.isArray(task.trajectory) || !task.trajectory.every(p=>object(p) && ['x','y','z','time'].every(k=>finite(p[k]))) ||
        ![task.startTime,task.finishTime,task.estimatedTime,task.duration].every(v=>v == null || finite(v)) ||
        ![task.reason,task.reasonCode,task.notes].every(v=>v == null || text(v))) invalid()
    if (task.scheduleStage==='assigned' && (!task.robotId || !finite(task.startTime) ||
        !finite(task.finishTime) || task.finishTime < task.startTime ||
        !task.path.length || !task.timetable.length || !task.trajectory.length)) invalid()
    ids.add(task.id)
  }
  if (!state.logs.every(log=>object(log) && finite(log.time) && text(log.message) && text(log.type) && (log.taskId == null || text(log.taskId)))) invalid()
  return record
}

/** Generate a JSON file without modifying either the imported or live record. */
export function downloadTaskRecords(record) {
  const blob = new Blob([JSON.stringify(record,null,2)], {type:'application/json'})
  if (blob.size > RECORD_LIMIT) throw new Error('recordsTooLarge')
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `rcss-records-${record.exportedAt.replace(/[^0-9]/g,'').slice(0,14)}.json`
  document.body.append(link); link.click(); link.remove()
  setTimeout(()=>URL.revokeObjectURL(url),1000)
}
