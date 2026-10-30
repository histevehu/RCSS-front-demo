import { locationLabel, UNKNOWN_LOCATION } from './locations.js'
export const NAVIGATION_COLOR = 0x00b894
export const CONNECTION_COLOR = 0xa29bfe

export function waypointColor(waypoint) {
  return waypoint.displayKind === 'stairs' ? CONNECTION_COLOR : NAVIGATION_COLOR
}

// Marker metadata lives on the parent group, while raycasts hit its meshes or label.
export function findMapTarget(object) {
  let target = null
  for (let current = object; current; current = current.parent) {
    if (!current.visible) return null
    if (!target && current.userData.robotId) target = { kind: 'robot', id: current.userData.robotId }
    if (!target && current.userData.isWaypoint) target = {
      kind: 'node', id: current.userData.waypoint.nodeId,
      mapName: current.userData.mapName, waypoint: current.userData.waypoint,
    }
  }
  return target
}

export function tooltipPosition(x, y, width, height, tooltipWidth = 248, tooltipHeight = 210) {
  return { left: Math.max(8, Math.min(x + 16, width - tooltipWidth - 8)),
    top: Math.max(8, Math.min(y + 16, height - tooltipHeight - 8)) }
}

export function describeRobotLocation(robot, tasks, nodeById, time, initialNodeId) {
  const task = tasks.filter(t => t.robotId === robot.id && t.scheduleStage === 'assigned' && t.startTime <= time)
    .sort((a, b) => a.startTime - b.startTime).at(-1)
  const table = task?.timetable || []
  let index = -1
  for (let i = 0; i < table.length && table[i].arrival <= time; i++) index = i
  const current = nodeById[table[index]?.nodeId] || nodeById[initialNodeId] || nodeById[robot.position?.nodeId]
  const next = nodeById[table[index + 1]?.nodeId]
  const inTransit = !!(current?.locationId && next?.locationId && current.locationId !== next.locationId &&
    index >= 0 && time >= table[index].depart && time < table[index + 1].arrival)
  const floor = current?.displayFloor ?? null
  const floorLabel = current?.floorLabel || UNKNOWN_LOCATION
  const from = current?.displayCode || UNKNOWN_LOCATION
  const sameFloor = current?.floorLabel === next?.floorLabel
  const nodeText = inTransit ? (sameFloor ? `${from} → ${next.displayCode}` : `${locationLabel(nodeById,current.id)} → ${locationLabel(nodeById,next.id)}`) : from
  const label = inTransit ? (sameFloor ? `${floorLabel} · ${nodeText}` : nodeText) : locationLabel(nodeById,current?.id)
  return { floor, floorLabel, nodeText, label, inTransit,
    nodeId: current?.id, taskId: task && time < task.finishTime ? task.id : null }
}
