import { MathUtils } from 'three'

// Orbit around a horizontal plane. Even at the nearest zoom and lowest pitch,
// the camera must stay above the highest visible floor, walls and robots.
export function configureMapControls(controls, bounds) {
  if (!bounds || bounds.isEmpty()) return
  const center = bounds.getCenter(controls.cursor.clone())
  const size = bounds.getSize(controls.cursor.clone())
  const span = Math.max(size.x, size.z, 1)

  controls.minPolarAngle = MathUtils.degToRad(15)
  controls.maxPolarAngle = MathUtils.degToRad(65)
  controls.screenSpacePanning = false
  controls.zoomToCursor = true
  controls.rotateSpeed = 0.65
  controls.zoomSpeed = 0.7
  controls.panSpeed = 1
  controls.minDistance = Math.max(5, span * 0.08,
    (bounds.max.y - center.y + 2) / Math.cos(controls.maxPolarAngle))
  controls.maxDistance = Math.max(controls.minDistance * 3, span * 2.5)
  controls.cursor.copy(center)
  controls.minTargetRadius = 0
  controls.maxTargetRadius = Infinity

  // Preserve the viewing direction when the visible floor changes.
  // Horizontal panning stays free; angle/height limits provide the safeguards.
  controls.object.position.y += center.y - controls.target.y
  controls.target.y = center.y
  controls.update()
}

export function discardControlMomentum(controls) {
  // A non-damped update consumes pending pan/rotation through the public API.
  // Do this before resetting the camera, so it cannot drift after Reset View.
  const damping = controls.enableDamping
  controls.enableDamping = false
  controls.update()
  controls.enableDamping = damping
}
