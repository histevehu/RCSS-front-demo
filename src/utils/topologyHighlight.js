const edgeKey = (a, b) => JSON.stringify([a, b].sort())

/**
 * 原位着色任务经过的拓扑线，保留原来的曲线形状和粗细。
 * 返回可见曲线的世界坐标采样段，供点击命中使用；不生成覆盖路线。
 * 清空路径会恢复所有线段的原始材质属性。
 */
export function highlightTopologyPath(mapGroups, path, color) {
  const edges = new Set((path || []).slice(1).map((id, index) => edgeKey(path[index], id)))
  const segments = []
  for (const group of mapGroups.values()) {
    group.updateWorldMatrix(true, true)
    for (const line of group.getObjectByName('topoLines')?.children || []) {
      const ids = line.userData.topologyNodeIds
      if (!ids?.every(Boolean)) continue
      const material = line.material
      // 首次记录原始属性，切换任务、隐藏路线或取消选择时准确恢复。
      const original = line.userData.topologyStyle ??= {
        color:material.color.getHex(), emissive:material.emissive.getHex(),
        emissiveIntensity:material.emissiveIntensity, opacity:material.opacity,
        transparent:material.transparent, depthTest:material.depthTest,
        depthWrite:material.depthWrite, renderOrder:line.renderOrder,
      }
      const selected = group.visible && edges.has(edgeKey(...ids))
      material.color.setHex(selected ? color : original.color)
      material.emissive.setHex(selected ? color : original.emissive)
      material.emissiveIntensity = selected ? .8 : original.emissiveIntensity
      material.opacity = selected ? 1 : original.opacity
      material.transparent = selected ? false : original.transparent
      material.depthTest = selected ? false : original.depthTest
      material.depthWrite = selected ? false : original.depthWrite
      line.renderOrder = selected ? 1000 : original.renderOrder
      material.needsUpdate = true
      if (!selected) continue
      const points = line.geometry.parameters.path.getPoints(16).map(point => line.localToWorld(point))
      for (let index = 1; index < points.length; index++) segments.push([points[index-1], points[index]])
    }
  }
  return segments
}
