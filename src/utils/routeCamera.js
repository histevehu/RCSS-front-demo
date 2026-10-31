import { Box3, MathUtils, Vector3 } from 'three'

/**
 * 按路线世界坐标和无遮挡像素视口计算最近的完整取景；不修改输入相机。
 * 对多个俯视方向逐点计算透视约束，兼顾跨楼层深度与非对称侧栏。
 */
export function fitRouteCamera(camera, points, viewport, clearanceY) {
  if (!points.length || viewport.width < 1 || viewport.height < 1) return null
  const center = new Box3().setFromPoints(points).getCenter(new Vector3())
  const tanY = Math.tan(MathUtils.degToRad(camera.fov / 2)), tanX = tanY * camera.aspect
  const left = viewport.left / viewport.width * 2 - 1, right = viewport.right / viewport.width * 2 - 1
  const top = 1 - viewport.top / viewport.height * 2, bottom = 1 - viewport.bottom / viewport.height * 2
  if (right <= left || top <= bottom) return null
  const cx = (left + right) / 2, cy = (top + bottom) / 2
  let best = null
  for (let azimuth = 0; azimuth < 16; azimuth++) for (const degrees of [35,45,55,65]) {
    const phi = MathUtils.degToRad(degrees), theta = azimuth * Math.PI / 8
    const direction = new Vector3(Math.sin(phi)*Math.sin(theta), Math.cos(phi), Math.sin(phi)*Math.cos(theta))
    const rightAxis = new Vector3().crossVectors(new Vector3(0,1,0),direction).normalize()
    const up = new Vector3().crossVectors(direction,rightAxis)
    // 聚焦后自由旋转到最浅允许角度，也必须保持在所有可见楼层上方。
    const heightFactor = Math.cos(MathUtils.degToRad(65)) - up.y * cy * tanY
    if (heightFactor <= 0) continue
    let distance = Math.max(5, (clearanceY - center.y) / heightFactor)
    for (const point of points) {
      const delta = point.clone().sub(center), z = delta.dot(direction)
      const x = delta.dot(rightAxis) / tanX, y = delta.dot(up) / tanY
      distance = Math.max(distance, z + camera.near + .5,
        (-x-left*z)/(cx-left), (x+right*z)/(right-cx),
        (-y-bottom*z)/(cy-bottom), (y+top*z)/(top-cy))
    }
    distance *= 1.025 // 起终点标记及数值误差的少量余量。
    const target = center.clone().addScaledVector(rightAxis,-cx*distance*tanX).addScaledVector(up,-cy*distance*tanY)
    const position = target.clone().addScaledVector(direction,distance)
    if (!best || distance < best.distance) best = { position,target,distance }
  }
  return best
}
