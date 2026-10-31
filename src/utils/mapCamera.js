import { MathUtils } from 'three'

// Orbit around a horizontal plane. Even at the nearest zoom and lowest pitch,
// the camera must stay above the highest visible floor, walls and robots.
export function configureMapControls(controls, bounds) {
  if (!bounds || bounds.isEmpty()) return
  const center = bounds.getCenter(controls.cursor.clone())
  const size = bounds.getSize(controls.cursor.clone())
  const span = Math.max(size.x, size.z, 1)

  controls.minPolarAngle = MathUtils.degToRad(5)
  controls.maxPolarAngle = MathUtils.degToRad(75)
  controls.screenSpacePanning = false
  controls.zoomToCursor = true
  controls.rotateSpeed = 0.65
  controls.zoomSpeed = 0.7
  controls.panSpeed = 1
  controls.minDistance = Math.max(2, span * 0.025)
  controls.maxDistance = Math.max(controls.minDistance * 3, span * 6)
  controls.cursor.copy(center)
  controls.minTargetRadius = 0
  controls.maxTargetRadius = Infinity

  // 按当前视角保护相机高度，允许俯视时靠近；避免最坏倾角限制所有缩放。
  controls.mapClearance = bounds.max.y + 2
  if (!controls.mapHeightGuard) {
    let correcting = false
    controls.mapHeightGuard = () => {
      if (correcting || controls.object.position.y >= controls.mapClearance - 1e-6) return
      correcting = true
      const offset = controls.object.position.clone().sub(controls.target)
      const height = controls.mapClearance - controls.target.y
      if (offset.y > 0 && height > 0) {
        controls.object.position.copy(controls.target).add(offset.multiplyScalar(height / offset.y))
        const damping = controls.enableDamping
        controls.enableDamping = false
        controls.update()
        controls.enableDamping = damping
      }
      correcting = false
    }
    controls.addEventListener('change', controls.mapHeightGuard)
  }

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
