<template>
  <div class="conference-map">
    <div ref="container" class="map-canvas"></div>
    <div v-if="loading || failure" class="map-message">
      {{ ui.t(failure ? 'mapFailure':'loadingMap') }}
      <button v-if="failure" @click="initialize">{{ ui.t('retryMap') }}</button>
    </div>
    <div v-if="!loading && !failure" class="map-tools" @pointerdown.stop>
      <select v-model="floor" :aria-label="ui.t('visibleFloor')"><option value="all">{{ ui.t('allFloors') }}</option><option v-for="f in floors" :key="f" :value="String(f)">{{ f }}F</option></select>
      <details class="tool-menu"><summary>{{ ui.t('objects') }}</summary><div class="tool-popover object-options"><label><input v-model="showRobots" type="checkbox"> {{ ui.t('robots') }}</label><label><input v-model="showRoute" type="checkbox"> {{ ui.t('route') }}</label></div></details>
      <button @click="renderer?.fitCamera()">{{ ui.t('resetView') }}</button>
      <details class="tool-menu map-legend"><summary>{{ ui.t('legend') }}</summary><div class="tool-popover legend-content">
        <div><i class="legend-node"></i><span>{{ ui.t('navigationPoint') }} (P1, P2…)</span></div>
        <div><i class="legend-portal"></i><span>{{ ui.t('stairs') }}</span></div>
        <div><i class="legend-robot"></i><span>{{ ui.t('robot') }} (R1–R8)</span></div>
        <div><i class="legend-route"></i><span>{{ ui.t('selectedRoute') }}</span></div>
        <div><i class="legend-start"></i><span>{{ ui.t('routeStart') }}</span><i class="legend-end"></i><span>{{ ui.t('routeEnd') }}</span></div>
        <small>{{ ui.t('mapHelp') }}</small>
      </div></details>
    </div>
    <div v-if="tooltip" class="map-tooltip" role="tooltip" :style="{left:`${hover.left}px`, top:`${hover.top}px`}">
      <strong>{{ tooltip.title }}</strong>
      <dl><template v-for="row in tooltip.rows" :key="row[0]"><dt>{{ row[0] }}</dt><dd>{{ row[1] }}</dd></template></dl>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as THREE from 'three'
import yaml from 'js-yaml'
import { useAppStore } from '../stores/appStore'
import { Map3DRenderer } from '../utils/map3dRenderer'
import { parsePGM, pixelsToCanvas } from '../utils/pgmParser'
import { useUiStore } from '../stores/uiStore'
import { waypointColor, findMapTarget, tooltipPosition } from '../utils/mapInteraction.js'
import { mapThemes } from '../utils/mapTheme.js'
import { MapClickGesture, isPointNearRoute } from '../utils/mapSelection.js'
import { highlightTopologyPath } from '../utils/topologyHighlight.js'
const store = useAppStore(), ui = useUiStore()
const container = ref(null), loading = ref(true), failure = ref(''), floor = ref('all')
const showRobots = ref(true), showRoute = ref(true)
const floors = computed(() => [...new Set(store.locations.filter(location => location.selectable).map(location => location.floor))].sort((a,b) => a-b))
let renderer, dead = false, routeGroup, routeKey = '', meshSession
let routeSegments = []
const clickGesture = new MapClickGesture()
let focusRequest = 0
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
    const place = store.locationById[node.locationId]
    if (!place) return null
    return {title:ui.display(place.label), rows:[[ui.t('location'), ui.display(place.floorLabel)], [ui.t('point'),place.code],
      [ui.t('type'),ui.t(place.kind === 'stairs' ? 'stairPoint':'navigationPoint')],
      [ui.t('neighbours'),place.neighbours.map(id => ui.display(store.locationById[id]?.label || 'Unknown location')).join(', ') || '—'],
      [ui.t('position'),coordinates(place.position)]]}
  }
  const robot = store.robots.find(r => r.id === target.id)
  if (!robot) return null
  const location = store.robotLocation(robot)
  const task = store.tasks.find(t => t.id === location.taskId)
  return {title:`${ui.t('robot')} ${robot.id}`, rows:[[ui.t('status'), ui.t(robot.status)],
    [ui.t('supportedCapabilities'), (robot.capabilities || []).map(ui.capability).join(', ') || ui.t('unknownCapability')],
    [ui.t('location'), ui.display(location.floorLabel)],
    [ui.t(location.inTransit ? 'moving':'atNode'), ui.display(location.nodeText)],
    [ui.t('task'), task ? `${task.id} · ${task.name}` : ui.t('none')],
    ...(task ? [[ui.t('remaining'), ui.duration(task.remaining)]] : []),
    [ui.t('position'), coordinates(store.robotPosition(robot, store.uiNow))]]}
})
function clearHover() { pointerPosition = null; hover.value = null }
function pointerMove(event) {
  clickGesture.move(event)
  if (event.buttons) { clearHover(); return }
  const rect = container.value.getBoundingClientRect()
  pointerPosition = { x:event.clientX - rect.left, y:event.clientY - rect.top }
  pickTarget()
}
function pointerDown(event) { clickGesture.down(event); clearHover() }
function pointerCancel() { clickGesture.cancel() }
function pointerUp(event) {
  if (!clickGesture.up(event) || !store.selectedTask) return
  const rect = container.value.getBoundingClientRect()
  const point = { x:event.clientX - rect.left, y:event.clientY - rect.top }
  if (point.x < 0 || point.y < 0 || point.x > rect.width || point.y > rect.height) return
  const segments = routeSegments.flatMap(([a,b]) => {
    const from=a.clone().project(renderer.camera), to=b.clone().project(renderer.camera)
    if ((from.z < -1 && to.z < -1) || (from.z > 1 && to.z > 1)) return []
    return [[{x:(from.x+1)*rect.width/2,y:(1-from.y)*rect.height/2}, {x:(to.x+1)*rect.width/2,y:(1-to.y)*rect.height/2}]]
  })
  if (!isPointNearRoute(point, segments)) { store.selectTask(null); clearHover() }
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
      if (!pgmResponse.ok || !yamlResponse.ok) throw new Error('Map assets are unavailable. Please retry.')
      const pgm = parsePGM(await pgmResponse.arrayBuffer())
      const config = yaml.load(await yamlResponse.text())
      return { ...m, waypoints: m.waypoints.map(wp => ({ ...wp, connections: wp.connections
        .filter(c => scene.maps.find(tm => tm.mapName === c.map_name)?.waypoints.some(tw => tw.code === c.target_node))
        .map(c => ({ mapName: c.map_name, waypointCode: c.target_node, reverse: c.reverse })) })).map(wp => ({...wp, displayKind:store.nodeById[wp.nodeId]?.displayKind,
          renderMarker:store.nodeById[wp.nodeId]?.isLocationRepresentative === true})).map(wp => ({...wp, markerColor:waypointColor(wp)})),
        mapConfig: { resolution: config.resolution, origin: config.origin },
        pgmWidth: pgm.width, pgmHeight: pgm.height, pgmPixels: pgm.pixels,
        pgmCanvas: pixelsToCanvas(pgm.pixels, pgm.width, pgm.height) }
    }))
    if (dead) return
    store.setMaps(maps)
    renderer = new Map3DRenderer(container.value, {showCrossMapLinks:false})
    renderer.init(); renderer.setData(maps); renderer.setTheme(ui.preferences.theme)
    renderer.onFrame = updateFrame
    const canvas = renderer.renderer.domElement
    canvas.addEventListener('pointermove', pointerMove)
    canvas.addEventListener('pointerleave', clearHover)
    canvas.addEventListener('pointerdown', pointerDown)
    canvas.addEventListener('pointerup', pointerUp)
    canvas.addEventListener('pointercancel', pointerCancel)
    renderer.controls.addEventListener('change', clearHover)
    loading.value = false
    focusSelectedTask()
  } catch (e) { failure.value = 'The map could not be loaded. Please retry.'; loading.value = false }
}
/** 根据面板实际位置预留画布空间，手机抽屉占用底部，桌面侧栏占用两侧。 */
function routeViewport() {
  const rect=container.value.getBoundingClientRect(), workspace=container.value.closest('.workspace')
  const viewport={width:rect.width,height:rect.height,left:24,right:rect.width-24,top:24,bottom:rect.height-76}
  const visible=element=>element && element.getClientRects().length && getComputedStyle(element).visibility!=='hidden'
  const header=workspace.querySelector('.workspace-header')
  if(visible(header)) viewport.top=header.getBoundingClientRect().bottom-rect.top+24
  for(const panel of workspace.querySelectorAll('.workspace-rail,.collapsed-rail,.rail-toggle')) {
    if(!visible(panel)) continue
    const box=panel.getBoundingClientRect()
    if(rect.width<=800) viewport.bottom=Math.min(viewport.bottom,box.top-rect.top-20)
    else if(panel.classList.contains('left-rail') || panel.classList.contains('collapsed-left') || panel.classList.contains('left-toggle')) viewport.left=Math.max(viewport.left,box.right-rect.left+20)
    else viewport.right=Math.min(viewport.right,box.left-rect.left-20)
  }
  const inspector=workspace.querySelector('.task-inspector')
  if(visible(inspector)) viewport.bottom=Math.min(viewport.bottom,inspector.getBoundingClientRect().top-rect.top-24)
  const tools=workspace.querySelector('.map-tools')
  if(visible(tools)) viewport.bottom=Math.min(viewport.bottom,tools.getBoundingClientRect().top-rect.top-24)
  return viewport
}
/** 仅选择或规划结果变化时聚焦，轮询和动画不会反复抢占用户的相机。 */
async function focusSelectedTask() {
  const request=++focusRequest, task=store.selectedTask
  if(!renderer || !task?.path?.length) return
  showRoute.value=true
  const nodes=task.path.map(id=>store.nodeById[id]).filter(Boolean)
  const levels=new Set(nodes.map(node=>node.displayFloor).filter(value=>value!=null))
  floor.value=levels.size===1 && nodes.every(node=>node.displayKind!=='stairs') ? String([...levels][0]):'all'
  // 等待选中任务卡片、楼层可见性与手机抽屉完成布局后再取景。
  await nextTick()
  requestAnimationFrame(()=>{
    if(dead || request!==focusRequest || store.selectedTaskId!==task.id) return
    const points=nodes.map(node=>vector(node.position,.4))
    // 快速切换任务时不复用上一任务的采样段，按当前路径重新取得曲线范围。
    const segments=highlightTopologyPath(renderer.mapGroups,task.path,mapThemes[ui.preferences.theme].route)
    points.push(...segments.flatMap(segment=>segment))
    renderer.focusRoute(points,routeViewport())
  })
}
watch(()=>`${store.sessionId}:${store.selectionVersion}:${store.selectedTaskId}:${store.selectedTask?.path?.join('|')}`,focusSelectedTask,{flush:'post'})
function drawRobotLabel(canvas, id) {
  const ctx=canvas.getContext('2d'), light=ui.preferences.theme==='light'
  ctx.clearRect(0,0,128,64); ctx.fillStyle=light ? '#ffffff99':'#14213599'; ctx.fillRect(0,0,128,64)
  ctx.fillStyle=light ? '#172b41':'#e0eaf4'; ctx.font='bold 32px Arial'; ctx.textAlign='center'; ctx.fillText(id,64,43)
}
function makeRobot(id) {
  const mesh = new THREE.Group()
  const color=mapThemes[ui.preferences.theme].robot
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .8, 16), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .3, transparent:true, opacity:.65, depthWrite:false }))
  body.userData.themeRole='robot'
  mesh.add(body)
  const front = new THREE.Mesh(new THREE.ConeGeometry(.23, .6, 3), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent:true, opacity:.7, depthWrite:false }))
  front.rotation.x = Math.PI / 2; front.position.z = .5; mesh.add(front)
  const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 64
  drawRobotLabel(canvas, id)
  const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), depthTest: false, depthWrite:false }))
  label.name='robot-label'; label.scale.set(2, 1, 1); label.position.y = 1.4; mesh.add(label)
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
  const key = `${meshSession}:${floor.value}:${showRoute.value}:${ui.preferences.theme}:${task?.id}:${task?.path?.join('|')}`
  if (key !== routeKey) {
    routeKey = key
    if (routeGroup) disposeObject(routeGroup)
    routeGroup = null
    routeSegments = highlightTopologyPath(renderer.mapGroups, showRoute.value ? task?.path : [], mapThemes[ui.preferences.theme].route)
    if (showRoute.value && task?.path?.length) {
      routeGroup = new THREE.Group()
      const path = task.path.filter(id => store.nodeById[id])
      const points = path.map(id => vector(store.nodeById[id].position, .35))
      const visible = index => floor.value === 'all' || String(store.nodeById[path[index]].displayFloor) === floor.value
      // 路线颜色直接应用于已有拓扑线；此组仅保留起终点标记。
      for (const [i, index] of [0, points.length-1].entries()) {
        if (index < 0 || !visible(index)) continue
        const point = points[index]
        const role=i ? 'end':'start'
        const marker = new THREE.Mesh(new THREE.SphereGeometry(.4, 12, 12), new THREE.MeshBasicMaterial({ color:mapThemes[ui.preferences.theme][role], depthTest: false }))
        marker.userData.themeRole=role
        marker.position.copy(point); marker.renderOrder = 1001; routeGroup.add(marker)
        routeSegments.push([point, point])
      }
      renderer.scene.add(routeGroup)
    }
  }
}
watch(floor, value => {
  clearHover()
  for (const m of store.maps) {
    m.visible = value === 'all' || (m.mapType !== 'stair' && String(m.floor) === value)
    const group=renderer?.mapGroups.get(m.mapName)
    if(group) group.visible=m.visible
  }
  renderer?.updateViewLimits()
})
watch(showRobots, clearHover)
watch(()=>ui.preferences.theme,theme=>{
  renderer?.setTheme(theme)
  for(const [id,mesh] of meshes) {
    const texture=mesh.getObjectByName('robot-label')?.material.map
    if(texture) { drawRobotLabel(texture.image,id); texture.needsUpdate=true }
  }
})
onMounted(initialize)
onUnmounted(() => {
  dead = true
  if (renderer) {
    const canvas = renderer.renderer.domElement
    canvas.removeEventListener('pointermove', pointerMove)
    canvas.removeEventListener('pointerleave', clearHover)
    canvas.removeEventListener('pointerdown', pointerDown)
    canvas.removeEventListener('pointerup', pointerUp)
    canvas.removeEventListener('pointercancel', pointerCancel)
    renderer.controls.removeEventListener('change', clearHover)
  }
  meshes.forEach(disposeObject)
  if (routeGroup) disposeObject(routeGroup)
  renderer?.dispose()
})
</script>
<style scoped>
.conference-map,.map-canvas { position:absolute; inset:0; }
.map-message { position:absolute; inset:0; display:flex; gap:16px; align-items:center; justify-content:center; background:var(--bg); color:var(--text); }
.map-tools { position:absolute; z-index:15; bottom:16px; left:var(--left-space,320px); right:var(--right-space,320px); display:flex; justify-content:center; gap:6px; align-items:center; flex-wrap:wrap; pointer-events:none; }
.map-tools>* { pointer-events:auto; background:var(--surface); font-size:12px; }
.map-tools select,.map-tools button,.tool-menu>summary { height:34px; padding:7px 9px; white-space:nowrap; }
.tool-menu { position:relative; border-radius:6px; border:1px solid var(--border); }
.tool-menu>summary { cursor:pointer; list-style:none; }
.tool-menu[open]>summary { color:var(--accent); background:var(--accent-soft); border-radius:6px; }
.tool-popover { position:absolute; bottom:calc(100% + 8px); right:0; border:1px solid var(--border); border-radius:8px; background:var(--surface-solid); box-shadow:var(--shadow); padding:12px; color:var(--text); }
.object-options { display:flex; flex-direction:column; gap:10px; min-width:140px; }.object-options label { display:flex; align-items:center; gap:7px; }
.legend-content { width:238px; }.legend-content>div { display:flex; gap:8px; align-items:center; margin-top:7px; }.legend-content i { display:inline-block; width:9px; height:9px; flex-shrink:0; border-radius:50%; }.legend-content small { display:block; margin-top:10px; color:var(--muted); font-size:11px; line-height:1.6; }
.legend-node { background:var(--map-node); }.legend-portal { background:var(--map-stair); }.legend-content .legend-robot { border-radius:2px; background:var(--map-robot); }.legend-content .legend-route { height:3px; background:var(--map-route); border-radius:0; }.legend-start { background:var(--map-route); }.legend-end { background:var(--map-end); }
.map-tooltip { position:absolute; z-index:30; pointer-events:none; width:248px; max-width:calc(100% - 16px); padding:12px; border:1px solid var(--border); border-radius:8px; background:var(--surface-solid); box-shadow:var(--shadow); color:var(--text); font-size:11px; }.map-tooltip strong { font-size:13px; }.map-tooltip dl { display:grid; grid-template-columns:80px minmax(0,1fr); gap:6px 8px; margin-top:8px; }.map-tooltip dt { color:var(--muted); }.map-tooltip dd { margin:0; overflow-wrap:anywhere; }
@media(max-width:800px) { .map-tools { bottom:68px; left:16px; right:16px; gap:5px; }.map-tools select,.map-tools button,.tool-menu>summary { min-height:36px; padding:8px 6px; }.map-legend .tool-popover { right:0; }.legend-content { max-width:calc(100vw - 20px); } }
</style>
