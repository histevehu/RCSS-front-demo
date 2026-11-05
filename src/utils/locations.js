export const UNKNOWN_LOCATION = 'Unknown location'

export function locationLabel(nodeById, nodeId) {
  const node = nodeById[nodeId]
  if(node?.displayKind==='lane') return `${locationLabel(nodeById,node.laneFrom)} → ${locationLabel(nodeById,node.laneTo)}`
  return node?.locationId && node.displayCode && node.floorLabel ? (node.displayName ? `${node.floorLabel} · ${node.displayCode} · ${node.displayName}` : `${node.floorLabel} · ${node.displayCode}`) : UNKNOWN_LOCATION
}

export function routeLabels(path, nodeById) {
  const result = []
  let previous
  for (const [index, id] of (path || []).entries()) {
    if(nodeById[id]?.displayKind==='lane') continue
    const key = nodeById[id]?.locationId || `unknown:${index}`
    if (key !== previous) result.push(locationLabel(nodeById, id))
    previous = key
  }
  return result
}
