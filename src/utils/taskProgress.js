/**
 * Execution progress uses the shared simulation clock's duration, excluding the
 * pre-start queue. Unknown/invalid estimates never produce a fabricated ratio.
 */
export function taskProgress(task) {
  if (task.status === 'failed') return { phase:'failed', elapsed:null, total:null, percent:null }
  if (task.scheduleStage === 'scheduling') return { phase:'scheduling', elapsed:null, total:null, percent:null }
  const total = Number.isFinite(task.estimatedTime) && task.estimatedTime > 0 ? task.estimatedTime : null
  const elapsed = task.status === 'waiting' ? 0 : task.status === 'completed' ? total
    : Number.isFinite(task.duration) ? Math.max(0, task.duration) : null
  return { phase:'execution', total, elapsed:total === null ? elapsed : elapsed === null ? null : Math.min(elapsed,total),
    percent:total === null || elapsed === null ? null : Math.min(100,elapsed / total * 100) }
}
