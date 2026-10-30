// Work in screen pixels so thin routes remain clickable at every zoom level.
export function isPointNearRoute(point, segments, tolerance = 8) {
  return segments.some(([a, b]) => {
    const dx = b.x - a.x, dy = b.y - a.y
    const length = dx * dx + dy * dy
    const t = length ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / length)) : 0
    return Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy) <= tolerance
  })
}

export class MapClickGesture {
  down(event) {
    if (this.active) { this.active.cancelled = true; return }
    if (event.button !== 0) return
    this.active = { id:event.pointerId, x:event.clientX, y:event.clientY, cancelled:false }
  }
  move(event) {
    if (this.active && (event.pointerId !== this.active.id || Math.hypot(event.clientX - this.active.x, event.clientY - this.active.y) > 6)) this.active.cancelled = true
  }
  up(event) {
    if (!this.active || event.pointerId !== this.active.id) return false
    this.move(event)
    const click = !this.active.cancelled && event.button === 0
    this.cancel()
    return click
  }
  cancel() { this.active = null }
}
