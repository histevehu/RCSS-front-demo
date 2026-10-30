export const NAVIGATION_COLOR = 0x00b894
export const CONNECTION_COLOR = 0xa29bfe

export function waypointColor(waypoint) {
  return waypoint.connections?.length || waypoint.linkedMapName ? CONNECTION_COLOR : NAVIGATION_COLOR
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

const nodeCode = node => node?.code?.split(':').at(-1) || node?.id?.split('/wp:').at(-1) || '—'
export function describeRobotLocation(robot, tasks, nodeById, time, initialNodeId) {
  const task = tasks.filter(t => t.robotId === robot.id && t.scheduleStage === 'assigned' && t.startTime <= time)
    .sort((a, b) => a.startTime - b.startTime).at(-1)
  const table = task?.timetable || []
  let index = -1
  for (let i = 0; i < table.length && table[i].arrival <= time; i++) index = i
  const current = nodeById[table[index]?.nodeId] || nodeById[initialNodeId]
  const next = nodeById[table[index + 1]?.nodeId]
  const inTransit = !!(current && next && index >= 0 && time >= table[index].depart && time < table[index + 1].arrival)
  const mapName = current?.mapName || robot.position?.building || '—'
  const floor = current?.floor ?? parseFloat(robot.position?.floor)
  const from = nodeCode(current)
  const nodeText = inTransit ? `${from} → ${next.mapName !== mapName ? `${next.mapName} · ` : ''}${nodeCode(next)}` : from
  return { mapName, floor, nodeText, inTransit,
    nodeId: current?.id, taskId: task && time < task.finishTime ? task.id : null }
}
