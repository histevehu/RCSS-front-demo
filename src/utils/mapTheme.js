export const mapThemes = {
  light: { node:0x008361, stair:0x7451c2, executingRobot:0xe52f43, robot:0x2299dc, front:0xffffff, route:0xfacc15, start:0xfacc15, end:0x078261 },
  dark: { node:0x00b894, stair:0xa29bfe, executingRobot:0xff5364, robot:0x52c8ff, front:0xffffff, route:0xffdf00, start:0xffdf00, end:0x34d399 },
}

/** 选中任务的分配机器人覆盖对象开关；楼层过滤仍由当前楼层控制。 */
export function robotIsVisible(showRobots, robotId, selectedRobotId, floor, robotFloor) {
  return (showRobots || robotId === selectedRobotId) && (floor === 'all' || String(robotFloor) === floor)
}
export function robotColor(theme, status) {
  return mapThemes[theme][status === 'executing' ? 'executingRobot' : 'robot']
}
