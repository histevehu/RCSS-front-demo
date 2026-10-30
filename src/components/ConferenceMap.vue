<template>
  <div class="conference-map">
    <div ref="container" class="map-canvas"></div>
    <div v-if="loading || failure" class="map-message">
      {{ failure || 'Loading conference scene…' }}
      <button v-if="failure" @click="initialize">Retry map</button>
    </div>
    <div v-if="!loading && !failure" class="map-tools">
      <select v-model="floor" aria-label="Visible floor"><option value="all">All Floors</option><option v-for="f in floors" :key="f" :value="String(f)">{{ f }}F</option></select>
      <label><input v-model="showRobots" type="checkbox"> Robots</label>
      <label><input v-model="showRoute" type="checkbox"> Route</label>
      <button @click="renderer?.fitCamera()">Reset View</button>
    </div>
    <div v-if="store.selectedTask" class="assignment-panel" aria-live="polite">
      <strong>{{ store.selectedTask.id }} · {{ store.selectedTask.name }}</strong>
      <span>{{ getStatusText(store.selectedTask.status) }} · {{ store.selectedTask.robotId || (store.selectedTask.scheduleStage === 'scheduling' ? 'Scheduling' : 'Unassigned') }}</span>
      <template v-if="store.selectedTask.scheduleStage === 'assigned'">
        <span>Execution {{ formatDuration(store.selectedTask.estimatedTime) }} · {{ formatDuration(store.selectedTask.remaining) }} remaining</span>
        <span>Planned start {{ wallTime(store.selectedTask.startTime) }} · Finish {{ wallTime(store.selectedTask.finishTime) }}</span>
        <progress :value="store.selectedTask.duration" :max="store.selectedTask.estimatedTime || 1"></progress>
        <div class="assignment-route">{{ store.selectedTask.path.map(id => store.nodeById[id]?.label || id).join(' → ') }}</div>
      </template>
      <span v-else>{{ store.selectedTask.reason }}</span>
      <button v-if="store.selectedTask.status === 'failed'" @click="store.retryTask(store.selectedTask)">Retry task</button>
    </div>
    <details v-if="!loading && !failure" class="map-legend" open>
      <summary>Map legend</summary>
      <div><i class="legend-node"></i><span>Navigation node (p1, p2…)</span></div>
      <div><i class="legend-portal"></i><span>Connection between maps</span></div>
      <div><i class="legend-robot"></i><span>Robot (R1–R8)</span></div>
      <div><i class="legend-route"></i><span>Selected task route</span></div>
      <div><i class="legend-start"></i><span>Route start</span><i class="legend-end"></i><span>Route end</span></div>
      <small>Map IDs are names, not floor numbers.<br>Hover a node or robot for details.</small>
    </details>
    <div v-if="tooltip" class="map-tooltip" role="tooltip" :style="{left:`${hover.left}px`, top:`${hover.top}px`}">
      <strong>{{ tooltip.title }}</strong>
      <dl><template v-for="row in tooltip.rows" :key="row[0]"><dt>{{ row[0] }}</dt><dd>{{ row[1] }}</dd></template></dl>
    </div>
    <div class="map-hint">Drag to rotate · Right drag to pan · Scroll to zoom</div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import yaml from 'js-yaml'
import { useAppStore } from '../stores/appStore'
import { Map3DRenderer } from '../utils/map3dRenderer'
import { parsePGM, pixelsToCanvas } from '../utils/pgmParser'
import { formatDuration, getStatusText } from '../utils/demo'
import { waypointColor, findMapTarget, tooltipPosition } from '../utils/mapInteraction.js'
const store = useAppStore()
const container = ref(null), loading = ref(true), failure = ref(''), floor = ref('all')
const showRobots = ref(true), showRoute = ref(true)
const floors = computed(() => [...new Set(store.scene?.maps.map(m => m.floor) || [])].sort())
let renderer, dead = false, routeGroup, routeKey = '', meshSession
const meshes = new Map()
const hover = ref(null)
const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2()
let pointerPosition = null, lastPick = 0
const coordinates = pos => pos ? `${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}` : '—'
const tooltip = computed(() => {
  if (!hover.value) return null
  const target = hover.value.target
  if (target.kind === 'node') {
    const node = store.nodeById[target.id]
    if (!node) return null
    const wp = target.waypoint
    return {title:`Node ${wp.code}`, rows:[['Floor', `${node.floor}F`], ['Map ID', node.mapName],
      ['Node ID', wp.code], ['Role', wp.connections.length ? 'Map connection' : 'Navigation node'],
      ['Neighbours', wp.relatedPoints.join(', ') || '—'],
      ...(wp.connections.length ? [['Connects to', wp.connections.map(c => `${c.mapName} · ${c.waypointCode}`).join(', ')]] : []),
      ['Position (m)', coordinates(node.position)]]}
  }
  const robot = store.robots.find(r => r.id === target.id)
  if (!robot) return null
  const location = store.robotLocation(robot)
  const task = store.tasks.find(t => t.id === location.taskId)
  return {title:`Robot ${robot.id}`, rows:[['Status', robot.status === 'executing' ? 'In Progress' : 'Idle'],
    ['Floor', `${location.floor}F`], ['Map ID', location.mapName],
    [location.inTransit ? 'Moving' : 'At node', location.nodeText],
    ['Task', task ? `${task.id} · ${task.name}` : 'None'],
    ...(task ? [['Remaining', formatDuration(task.remaining)]] : []),
    ['Position (m)', coordinates(store.robotPosition(robot, store.uiNow))]]}
})
function clearHover() { pointerPosition = null; hover.value = null }
function pointerMove(event) {
  if (event.buttons) { clearHover(); return }
  const rect = container.value.getBoundingClientRect()
  pointerPosition = { x:event.clientX - rect.left, y:event.clientY - rect.top }
  pickTarget()
}
function pickTarget() {
  if (!renderer || !pointerPosition) return
  const rect = container.value.getBoundingClientRect()
  pointer.set(pointerPosition.x / rect.width * 2 - 1, 1 - pointerPosition.y / rect.height * 2)
  renderer.scene.updateMatrixWorld(true)
  raycaster.setFromCamera(pointer, renderer.camera)
  const candidates = [...meshes.values(), ...[...renderer.mapGroups.values()].map(g => g.getObjectByName('waypoints')).filter(Boolean)]
  const hit = raycaster.intersectObjects(candidates, true).map(h => findMapTarget(h.object)).find(Boolean)
  renderer.renderer.domElement.style.cursor = hit ? 'help' : 'grab'
  if (!hit) { hover.value = null; return }
  const position = tooltipPosition(pointerPosition.x, pointerPosition.y, rect.width, rect.height)
  hover.value = {target:hit, ...position}
}
function wallTime(seconds) {
  return new Date((store.clock.epoch + seconds) * 1000).toLocaleTimeString('en-GB', { timeZone: 'Asia/Shanghai' })
}
function vector(pos, lift = 0) { return new THREE.Vector3(pos.x, pos.z * 3 + lift, -pos.y) }
function disposeObject(object) {
  object.traverse(child => {
    child.geometry?.dispose()
    const materials = Array.isArray(child.material) ? child.material : [child.material]
    for (const material of materials) { material?.map?.dispose(); material?.dispose() }
  })
  object.removeFromParent()
}
async function initialize() {
  if (renderer || dead) return
  loading.value = true; failure.value = ''
  try {
    const scene = await store.loadScene()
    const maps = await Promise.all(scene.maps.map(async m => {
      const [pgmResponse, yamlResponse] = await Promise.all([fetch(`/api${m.assetBase}.pgm`), fetch(`/api${m.assetBase}.yaml`)])
      if (!pgmResponse.ok || !yamlResponse.ok) throw new Error(`Map asset unavailable: ${m.mapName}`)
      const pgm = parsePGM(await pgmResponse.arrayBuffer())
      const config = yaml.load(await yamlResponse.text())
      return { ...m, waypoints: m.waypoints.map(wp => ({ ...wp, connections: wp.connections
        .filter(c => scene.maps.find(tm => tm.mapName === c.map_name)?.waypoints.some(tw => tw.code === c.target_node))
        .map(c => ({ mapName: c.map_name, waypointCode: c.target_node, reverse: c.reverse })) })).map(wp => ({...wp, markerColor:waypointColor(wp)})),
        mapConfig: { resolution: config.resolution, origin: config.origin },
        pgmWidth: pgm.width, pgmHeight: pgm.height, pgmPixels: pgm.pixels,
        pgmCanvas: pixelsToCanvas(pgm.pixels, pgm.width, pgm.height) }
    }))
    if (dead) return
    store.setMaps(maps)
    renderer = new Map3DRenderer(container.value)
    renderer.init(); renderer.setData(maps)
    renderer.onFrame = updateFrame
    const canvas = renderer.renderer.domElement
    canvas.addEventListener('pointermove', pointerMove)
    canvas.addEventListener('pointerleave', clearHover)
    canvas.addEventListener('pointerdown', clearHover)
    renderer.controls.addEventListener('change', clearHover)
    loading.value = false
  } catch (e) { failure.value = e.message; loading.value = false }
}
function makeRobot(id) {
  const mesh = new THREE.Group()
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .8, 16), new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xfbbf24, emissiveIntensity: .3 }))
  mesh.add(body)
  const front = new THREE.Mesh(new THREE.ConeGeometry(.23, .6, 3), new THREE.MeshBasicMaterial({ color: 0xffffff }))
  front.rotation.x = Math.PI / 2; front.position.z = .5; mesh.add(front)
  const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 64
  const ctx = canvas.getContext('2d'); ctx.fillStyle = '#101c30'; ctx.fillRect(0, 0, 128, 64)
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 32px Arial'; ctx.textAlign = 'center'; ctx.fillText(id, 64, 43)
  const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), depthTest: false }))
  label.scale.set(2, 1, 1); label.position.y = 1.4; mesh.add(label)
  mesh.userData.robotId = id
  renderer.scene.add(mesh)
  return mesh
}
function updateFrame() {
  if (!renderer || !store.snapshot) return
  if (meshSession !== store.sessionId) {
    clearHover(); meshes.forEach(disposeObject); meshes.clear(); meshSession = store.sessionId
  }
  const now = store.now()
  for (const robot of store.robots) {
    if (!meshes.has(robot.id)) meshes.set(robot.id, makeRobot(robot.id))
    const mesh = meshes.get(robot.id)
    const position = store.robotPosition(robot, now)
    const next = vector(position, .55)
    const delta = next.clone().sub(mesh.position)
    if (delta.lengthSq() > 1e-8) mesh.rotation.y = Math.atan2(delta.x, delta.z)
    mesh.position.copy(next)
    mesh.visible = showRobots.value && (floor.value === 'all' || String(store.robotFloor(robot, now)) === floor.value)
  }
  if (pointerPosition && performance.now() - lastPick > 100) { lastPick = performance.now(); pickTarget() }
  const task = store.selectedTask
  const key = `${meshSession}:${showRoute.value}:${task?.id}:${task?.path?.join('|')}`
  if (key !== routeKey) {
    routeKey = key
    if (routeGroup) disposeObject(routeGroup)
    routeGroup = null
    if (showRoute.value && task?.path?.length) {
      routeGroup = new THREE.Group()
      const points = task.path.map(id => vector(store.nodeById[id].position, .35))
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0x38bdf8, depthTest: false }))
      line.renderOrder = 1000; routeGroup.add(line)
      for (let i=1; i<points.length; i++) {
        const delta=points[i].clone().sub(points[i-1])
        if (delta.length() < 1e-6) continue
        const segment=new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,delta.length(),8),new THREE.MeshBasicMaterial({color:0x38bdf8,depthTest:false}))
        segment.position.copy(points[i-1]).addScaledVector(delta,.5)
        segment.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize())
        segment.renderOrder=1000; routeGroup.add(segment)
      }
      for (const [i, point] of [points[0], points.at(-1)].entries()) {
        const marker = new THREE.Mesh(new THREE.SphereGeometry(.4, 12, 12), new THREE.MeshBasicMaterial({ color: i ? 0x34d399 : 0x38bdf8, depthTest: false }))
        marker.position.copy(point); marker.renderOrder = 1001; routeGroup.add(marker)
      }
      renderer.scene.add(routeGroup)
    }
  }
}
watch(floor, value => {
  clearHover()
  for (const m of store.maps) renderer?.toggleMapVisibility(m.mapName, value === 'all' || String(m.floor) === value)
})
watch(showRobots, clearHover)
onMounted(initialize)
onUnmounted(() => {
  dead = true
  if (renderer) {
    const canvas = renderer.renderer.domElement
    canvas.removeEventListener('pointermove', pointerMove)
    canvas.removeEventListener('pointerleave', clearHover)
    canvas.removeEventListener('pointerdown', clearHover)
    renderer.controls.removeEventListener('change', clearHover)
  }
  meshes.forEach(disposeObject)
  if (routeGroup) disposeObject(routeGroup)
  renderer?.dispose()
})
</script>
<style scoped>
.conference-map,.map-canvas { position:absolute; inset:0; }
.map-message { position:absolute; inset:0; display:flex; gap:16px; align-items:center; justify-content:center; background:#0a0e14; color:#cbd5e1; }
.map-tools { position:absolute; top:64px; left:340px; display:flex; gap:12px; align-items:center; color:#cbd5e1; font-size:12px; background:#101c30dd; padding:8px 12px; border-radius:8px; }
button,select { background:#1e293b; color:#e2e8f0; border:1px solid #334155; padding:4px 8px; border-radius:5px; cursor:pointer; }
.assignment-panel { position:absolute; top:112px; left:340px; width:330px; max-height:240px; overflow:auto; display:flex; gap:7px; flex-direction:column; color:#cbd5e1; font-size:12px; padding:14px; border:1px solid #38bdf844; border-radius:10px; background:#0f172ae8; }
.assignment-panel strong { color:#e2e8f0; font-size:13px; }
.assignment-panel progress { width:100%; height:7px; accent-color:#38bdf8; }
.assignment-route { color:#7dd3fc; overflow-wrap:anywhere; line-height:1.6; }
.map-legend { position:absolute; bottom:155px; left:340px; width:226px; padding:10px 12px; border:1px solid #334155; border-radius:8px; background:#0f172ae8; color:#cbd5e1; font-size:11px; }
.map-legend summary { cursor:pointer; font-size:12px; font-weight:600; color:#e2e8f0; }
.map-legend>div { display:flex; gap:8px; align-items:center; margin-top:7px; }
.map-legend i { display:inline-block; width:9px; height:9px; flex-shrink:0; border-radius:50%; }
.legend-node { background:#00b894; } .legend-portal { background:#a29bfe; }
.map-legend .legend-robot { border-radius:2px; background:#fbbf24; }
.map-legend .legend-route { height:3px; background:#38bdf8; border-radius:0; }
.legend-start { background:#38bdf8; } .legend-end { background:#34d399; }
.map-legend small { display:block; margin-top:9px; color:#94a3b8; font-size:10px; line-height:1.5; }
.map-tooltip { position:absolute; z-index:30; pointer-events:none; width:248px; max-width:calc(100% - 16px); padding:12px; border:1px solid #64748b; border-radius:8px; background:#0b1425f5; box-shadow:0 8px 24px #0008; color:#e2e8f0; font-size:11px; }
.map-tooltip strong { font-size:13px; }
.map-tooltip dl { display:grid; grid-template-columns:80px minmax(0,1fr); gap:6px 8px; margin-top:8px; }
.map-tooltip dt { color:#94a3b8; } .map-tooltip dd { margin:0; overflow-wrap:anywhere; }
.map-hint { position:absolute; bottom:22px; left:340px; color:#94a3b8; font-size:11px; }
@media(max-width:800px) { .map-tools { left:26px; top:calc(var(--header-height,110px) + 12px); flex-wrap:wrap; } .assignment-panel { left:26px; top:calc(var(--header-height,110px) + 62px); width:240px; max-height:150px; } .map-hint { display:none; } .map-legend { bottom:12px; left:26px; width:226px; } }
</style>
