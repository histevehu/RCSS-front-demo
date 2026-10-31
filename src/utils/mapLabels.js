import { CanvasTexture, Sprite, SpriteMaterial, SRGBColorSpace } from 'three'

/** 用高分辨率画布绘制地点名；文字颜色与语义图例共用同一色值。 */
export function paintMapLabel(canvas, text, color, theme) {
  const context = canvas.getContext('2d')
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = theme === 'dark' ? '#172333ed' : '#ffffffed'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = `#${color.toString(16).padStart(6, '0')}`
  context.font = '600 28px sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(text, canvas.width / 2, canvas.height / 2)
}

export function createWaypointLabel(text, color, theme) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(100, text.length * 19 + 20)
  canvas.height = 48
  paintMapLabel(canvas, text, color, theme)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  const material = new SpriteMaterial({map:texture, depthTest:false,
    depthWrite:false, sizeAttenuation:false, toneMapped:false})
  const label = new Sprite(material)
  label.name = 'waypoint-label'
  label.renderOrder = 1120
  label.userData.labelText = text
  label.userData.labelAspect = canvas.width / canvas.height
  label.position.y = 1.05
  return label
}

/** 抵消屏幕尺寸与视场角差异，缩放地图时仍保持 20px 高的可读标签。 */
export function sizeWaypointLabel(label, camera, height) {
  const scale = 20 / Math.max(height, 1) * 2 * Math.tan(camera.fov * Math.PI / 360)
  label.scale.set(scale * label.userData.labelAspect, scale, 1)
}

/** 缩远时只隐藏互相覆盖的文字，节点本身始终可见；放大后自动恢复。 */
export function layoutWaypointLabels(groups, camera, width, height) {
  const occupied = []
  for (const group of groups.values()) {
    if (!group.visible) continue
    group.getObjectByName('waypoints')?.traverse(label => {
      if (label.name !== 'waypoint-label') return
      sizeWaypointLabel(label, camera, height)
      const point = label.getWorldPosition(camera.position.clone()).project(camera)
      const w = 20 * label.userData.labelAspect
      const x = (point.x + 1) * width / 2, y = (1 - point.y) * height / 2
      const box = {left:x-w/2-2, right:x+w/2+2, top:y-12, bottom:y+12}
      label.visible = point.z >= -1 && point.z <= 1 && !occupied.some(other =>
        box.left < other.right && box.right > other.left && box.top < other.bottom && box.bottom > other.top)
      if (label.visible) occupied.push(box)
    })
  }
}
