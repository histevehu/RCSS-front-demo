import test from 'node:test'
import assert from 'node:assert/strict'
import { Box3, Vector3, PerspectiveCamera, Plane, Ray } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { configureMapControls } from '../src/utils/mapCamera.js'
import { Map3DRenderer } from '../src/utils/map3dRenderer.js'

const bounds = new Box3(new Vector3(-20, 0, -30), new Vector3(20, 13.13, 30))
function setup() {
  const camera = new PerspectiveCamera(60, 1.4, .1, 1000)
  camera.position.set(30, 40, 50)
  // A detached controls instance exercises the real OrbitControls math without WebGL.
  const controls = new OrbitControls(camera)
  configureMapControls(controls, bounds)
  return { camera, controls }
}
function assertSafe(camera, controls, box = bounds) {
  const epsilon = 1e-6
  assert.ok(controls.getPolarAngle() >= controls.minPolarAngle - epsilon)
  assert.ok(controls.getPolarAngle() <= controls.maxPolarAngle + epsilon)
  assert.ok(camera.position.distanceTo(controls.target) >= controls.minDistance - epsilon)
  assert.ok(camera.position.distanceTo(controls.target) <= controls.maxDistance + epsilon)
  assert.ok(camera.position.y >= box.max.y + 2 - epsilon, 'camera stays above every visible floor')
  assert.ok(controls.target.distanceTo(controls.cursor) <= controls.maxTargetRadius + epsilon)
}

test('orbit limits prevent inverted views, floor penetration and excessive zoom', () => {
  const { camera, controls } = setup()
  for (const offset of [new Vector3(0, -80, 1), new Vector3(0, 1000, .001), new Vector3(.001, .001, .001), new Vector3(10000, 1, 10000)]) {
    camera.position.copy(controls.target).add(offset)
    controls.update()
    assertSafe(camera, controls)
  }
  assert.equal(controls.screenSpacePanning, false)
})

test('horizontal panning is unrestricted while keeping the target on its plane', () => {
  const { camera, controls } = setup()
  const elevation = controls.target.y
  for (const offset of [new Vector3(9999, 0, 0), new Vector3(-9999, 0, 9999), new Vector3(0, 0, -9999)]) {
    const expected = controls.target.clone().add(offset)
    controls.target.add(offset)
    camera.position.add(offset)
    controls.update()
    assert.equal(controls.target.y, elevation)
    assert.ok(controls.target.distanceTo(expected) < 1e-6, 'panning must not pull back towards the scene centre')
    assertSafe(camera, controls)
  }
  assert.equal(controls.maxTargetRadius, Infinity)
})

function cursorZoom(camera, controls, x, y, scale) {
  camera.updateMatrixWorld()
  const direction = new Vector3(x, y, .5).unproject(camera).sub(camera.position).normalize()
  // These are the cursor ray and scale computed by OrbitControls' wheel handler.
  controls._dollyDirection.copy(direction)
  controls._performCursorZoom = true
  controls._scale = scale
  controls.update()
  controls.update() // Animation frame, as in Map3DRenderer.animate().
}

test('zoom anchors the pointed world position after panning instead of the scene centre', () => {
  const { camera, controls } = setup()
  const pan = new Vector3(500, 0, -500)
  controls.target.add(pan); camera.position.add(pan); controls.update()
  camera.updateMatrixWorld()
  const x = .5, y = -.4
  const direction = new Vector3(x, y, .5).unproject(camera).sub(camera.position).normalize()
  const point = new Ray(camera.position.clone(), direction).intersectPlane(
    new Plane(new Vector3(0, 1, 0), -controls.target.y), new Vector3())
  assert.ok(point)
  cursorZoom(camera, controls, x, y, .85)
  const projected = point.project(camera)
  assert.ok(Math.abs(projected.x - x) < 1e-6)
  assert.ok(Math.abs(projected.y - y) < 1e-6)
  assert.ok(controls.target.distanceTo(controls.cursor) > 500, 'zoom must not recenter a panned view')
  assertSafe(camera, controls)
})

test('off-centre cursor zoom keeps frame positions above the floors at both distance limits', () => {
  for (const aspect of [.46, 1.44]) for (const x of [-.9, .9]) for (const y of [-.9, .9]) {
    const { camera, controls } = setup()
    camera.aspect = aspect; camera.updateProjectionMatrix()
    camera.position.copy(controls.target).add(new Vector3(40, 1, 40)); controls.update()
    for (const scale of [.001, 1000]) {
      cursorZoom(camera, controls, x, y, scale)
      assertSafe(camera, controls)
    }
  }
})

test('changing visible floors recomputes clearance and bounds without resetting azimuth', () => {
  const { camera, controls } = setup()
  const azimuth = controls.getAzimuthalAngle()
  const upperFloor = new Box3(new Vector3(-10, 10.83, -10), new Vector3(10, 13.13, 10))
  const lowerFloor = new Box3(new Vector3(-20, 0, -30), new Vector3(20, 2.3, 30))
  for (const box of [upperFloor, lowerFloor, bounds]) {
    configureMapControls(controls, box)
    assertSafe(camera, controls, box)
    assert.ok(Math.abs(controls.getAzimuthalAngle() - azimuth) < 1e-6)
  }
})

test('Reset View discards remaining drag inertia and returns to a stable safe overview', () => {
  const { camera, controls } = setup()
  controls.enableDamping = true
  const renderer = Object.create(Map3DRenderer.prototype)
  renderer.camera = camera
  renderer.controls = controls
  renderer.getVisibleBounds = () => bounds
  // These are the same pending deltas accumulated by mouse/touch gestures.
  controls._sphericalDelta.set(0, .7, .3)
  controls._panOffset.set(20, 0, -20)
  renderer.fitCamera()
  const resetPosition = camera.position.clone(), resetTarget = controls.target.clone()
  for (let i = 0; i < 120; i++) controls.update()
  assert.ok(camera.position.distanceTo(resetPosition) < 1e-6)
  assert.ok(controls.target.distanceTo(resetTarget) < 1e-6)
  assert.equal(controls.enableDamping, true)
  assertSafe(camera, controls)
})

test('empty scenes do not corrupt the camera or navigation limits', () => {
  const { camera, controls } = setup()
  const before = camera.position.clone()
  configureMapControls(controls, new Box3())
  assert.deepEqual(camera.position, before)
})
