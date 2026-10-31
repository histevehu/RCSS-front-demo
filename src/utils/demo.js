export function formatDuration(value) {
  if (value == null || !Number.isFinite(value)) return '—'
  const seconds = Math.max(0, Math.ceil(value))
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m${String(seconds % 60).padStart(2, '0')}s`
}
export const getPriorityText = value => ({ urgent: 'Urgent', normal: 'Normal', low: 'Low' }[value] || value)
export const getStatusText = value => ({ waiting: 'Waiting', executing: 'In Progress', completed: 'Completed', failed: 'Failed' }[value] || value)
export function interpolate(points, now) {
  if (!points?.length) return null
  if (now <= points[0].time) return points[0]
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i]
    if (now <= b.time) {
      const ratio = Math.max(0, Math.min(1, (now - a.time) / Math.max(b.time - a.time, 1e-9)))
      return { x: a.x + (b.x - a.x) * ratio, y: a.y + (b.y - a.y) * ratio, z: a.z + (b.z - a.z) * ratio }
    }
  }
  return points.at(-1)
}
export async function api(path, body) {
  const response = await fetch(`/api/demo/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(8000),
  })
  const data = await response.json()
  if (!response.ok) {
    const message = typeof data.detail === 'string' ? data.detail : 'Request failed; check your inputs'
    throw Object.assign(new Error(message), { status: response.status })
  }
  return data
}

/** 已按开始时间排序的机器人计划中，二分定位当前/最近一次执行的任务。 */
export function taskAtTime(tasks, now) {
  let low=0, high=tasks.length
  while(low<high) {const mid=(low+high)>>>1;if(tasks[mid].startTime<=now) low=mid+1;else high=mid}
  return tasks[low-1]
}
