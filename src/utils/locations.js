export const UNKNOWN_LOCATION = 'Unknown location'

export function locationLabel(nodeById, nodeId) {
  const node = nodeById[nodeId]
  return node?.locationId && node.displayCode && node.floorLabel ? `${node.floorLabel} · ${node.displayCode}` : UNKNOWN_LOCATION
}

export function routeLabels(path, nodeById) {
  const result = []
  let previous
  for (const [index, id] of (path || []).entries()) {
    const key = nodeById[id]?.locationId || `unknown:${index}`
    if (key !== previous) result.push(locationLabel(nodeById, id))
    previous = key
  }
  return result
}
