import { formatDuration } from './demo.js'

export const messages = {
  'zh-CN': {
    appTitle:'机器人任务调度中心', overview:'总览', tasks:'任务', liveMode:'实时调度 · 模拟执行',
    connected:'已连接', disconnected:'连接中断', paused:'已暂停', pause:'暂停', resume:'继续', speed:'演示倍速', reset:'重置演示',
    language:'界面语言', theme:'界面主题', light:'浅色', dark:'深色', focus:'专注地图', exitFocus:'退出专注',
    expand:'展开', collapse:'折叠', close:'关闭', taskArea:'任务区', robotArea:'机器人区', hideLeft:'收起任务区', showLeft:'展开任务区', hideRight:'收起机器人区', showRight:'展开机器人区',
    newTask:'新建任务', waiting:'等待', executing:'执行中', completed:'已完成', failed:'失败', urgent:'紧急', normal:'普通', low:'低',
    completionRate:'完成率', sessionTotal:'本场任务', avgCompletion:'平均完成时间', failedScheduling:'调度失败', waitingQueue:'等待队列',
    robots:'机器人', online:'在线', utilization:'利用率', idle:'空闲', charging:'充电中', locationKey:'楼层 · 地点 / 移动方向',
    noWaiting:'暂无等待任务', noTasks:'暂无任务', waited:'已等待', startsIn:'距离开始', scheduling:'正在调度…', waitingRobot:'等待分配的机器人开始执行',
    taskList:'任务列表', taskDetails:'选中任务', all:'全部', today:'今天', filter:'任务筛选', timeline:'任务时间线', logs:'任务日志',
    taskName:'任务名称', namePlaceholder:'请输入任务名称', priority:'优先级', start:'起点', end:'终点', selectStart:'请选择起点', selectEnd:'请选择终点',
    taskType:'任务类型', delivery:'配送', pickup:'取货', sample:'样本运输', document:'文件运输', other:'其他', notes:'备注', optional:'选填',
    createTask:'创建任务', submitting:'正在提交…', cancel:'取消', robot:'机器人', unassigned:'尚未分配', execution:'预计执行', elapsed:'已执行',
    plannedStart:'预计开始', plannedFinish:'预计完成', remaining:'剩余时间', route:'路线', retry:'重试任务', pending:'尚未安排',
    visibleFloor:'显示楼层', allFloors:'全部楼层', objects:'显示对象', resetView:'重置视角', legend:'地图图例',
    navigationPoint:'导航地点', stairPoint:'楼梯路径点', stairs:'楼梯 4F–5F', selectedRoute:'选中任务路线', routeStart:'路线起点', routeEnd:'路线终点',
    mapHelp:'悬停查看详情 · 拖动旋转 · 右键拖动平移 · 滚轮缩放', loadingMap:'正在加载演示地图…', mapFailure:'地图加载失败，请重试。', retryMap:'重新加载',
    location:'地点', point:'编号', type:'类型', neighbours:'相邻地点', position:'坐标（米）', status:'状态', moving:'移动中', atNode:'所在地点', task:'任务', none:'无',
    unavailable:'地点不可用', disconnectedError:'连接中断，展示已冻结，正在重新连接…', requestError:'操作失败，请检查连接或输入后重试。',
    reconnectError:'请等待演示服务重新连接。', sessionChanged:'演示场次已变更，请重新提交。',
    NO_ROBOTS:'没有可用机器人', NO_CAPABLE_ROBOT:'没有具备所需运输能力的机器人', LOW_BATTERY:'机器人电量不足', ROBOT_CHARGING:'机器人正在充电',
    MAP_NOT_ALLOWED:'机器人无法进入目标地点', NODE_NOT_FOUND:'所选地点不可用', PATH_UNREACHABLE:'起终点之间没有可达路径', NO_FEASIBLE_ROBOT:'当前没有可执行此任务的机器人', SCHEDULE_FAILED:'调度失败，请重试',
  },
  'en-US': {
    appTitle:'Robot Task Dispatch Center', overview:'Overview', tasks:'Tasks', liveMode:'Live Scheduling · Simulated Execution',
    connected:'Connected', disconnected:'Disconnected', paused:'Paused', pause:'Pause', resume:'Resume', speed:'Demo speed', reset:'Reset Demo',
    language:'Interface language', theme:'Interface theme', light:'Light', dark:'Dark', focus:'Focus map', exitFocus:'Exit focus',
    expand:'Expand', collapse:'Collapse', close:'Close', taskArea:'Task area', robotArea:'Robot area', hideLeft:'Hide task area', showLeft:'Show task area', hideRight:'Hide robot area', showRight:'Show robot area',
    newTask:'New Task', waiting:'Waiting', executing:'In Progress', completed:'Completed', failed:'Failed', urgent:'Urgent', normal:'Normal', low:'Low',
    completionRate:'Completion rate', sessionTotal:'Tasks this session', avgCompletion:'Average completion', failedScheduling:'Failed scheduling', waitingQueue:'Waiting Queue',
    robots:'Robots', online:'Online', utilization:'Utilization', idle:'Idle', charging:'Charging', locationKey:'Floor · Location / movement',
    noWaiting:'No waiting tasks', noTasks:'No tasks', waited:'Waited', startsIn:'Starts in', scheduling:'Scheduling…', waitingRobot:'Waiting for assigned robot',
    taskList:'Task list', taskDetails:'Selected task', all:'All', today:'Today', filter:'Task filter', timeline:'Task Timeline', logs:'Task Logs',
    taskName:'Task name', namePlaceholder:'Enter task name', priority:'Priority', start:'Start', end:'End', selectStart:'Select start location', selectEnd:'Select end location',
    taskType:'Task type', delivery:'Delivery', pickup:'Pickup', sample:'Sample Transport', document:'Document Run', other:'Other', notes:'Notes', optional:'Optional',
    createTask:'Create Task', submitting:'Submitting…', cancel:'Cancel', robot:'Robot', unassigned:'Unassigned', execution:'Planned execution', elapsed:'Elapsed',
    plannedStart:'Planned start', plannedFinish:'Planned finish', remaining:'Remaining', route:'Route', retry:'Retry task', pending:'Pending',
    visibleFloor:'Visible floor', allFloors:'All Floors', objects:'Visible objects', resetView:'Reset View', legend:'Map legend',
    navigationPoint:'Navigation point', stairPoint:'Stair waypoint', stairs:'Stairs 4F–5F', selectedRoute:'Selected task route', routeStart:'Route start', routeEnd:'Route end',
    mapHelp:'Hover for details · Drag to rotate · Right drag to pan · Scroll to zoom', loadingMap:'Loading conference scene…', mapFailure:'The map could not be loaded. Please retry.', retryMap:'Retry map',
    location:'Location', point:'Point', type:'Type', neighbours:'Neighbours', position:'Position (m)', status:'Status', moving:'Moving', atNode:'At location', task:'Task', none:'None',
    unavailable:'Unknown location', disconnectedError:'Disconnected — display frozen. Reconnecting…', requestError:'Request failed. Check your connection or inputs and retry.',
    reconnectError:'Wait for the demo service to reconnect', sessionChanged:'Demonstration changed; submit again',
    NO_ROBOTS:'No robots available', NO_CAPABLE_ROBOT:'No robot has the required capability', LOW_BATTERY:'Robot battery is low', ROBOT_CHARGING:'Robot is charging',
    MAP_NOT_ALLOWED:'Robot cannot access the destination', NODE_NOT_FOUND:'Selected location is unavailable', PATH_UNREACHABLE:'No reachable path between the selected locations', NO_FEASIBLE_ROBOT:'No feasible robot for this task', SCHEDULE_FAILED:'Scheduling failed; please retry',
  },
}

export const translate = (locale, key) => messages[locale]?.[key] ?? messages['en-US'][key] ?? '—'
export function durationLabel(value, locale) {
  const result = formatDuration(value)
  return locale === 'zh-CN' ? result.replace('m','分').replace('s','秒') : result
}
export function publicText(value, locale) {
  return String(value ?? '').replaceAll('Stairs 4F–5F', translate(locale,'stairs')).replaceAll('Unknown location',translate(locale,'unavailable')).replaceAll('Pending',translate(locale,'pending'))
}
export function errorLabel(value, locale) {
  if (!value) return ''
  const key = String(value).includes('Disconnected') ? 'disconnectedError'
    : String(value).includes('reconnect') ? 'reconnectError'
    : /SESSION_CHANGED|Demonstration changed/.test(value) ? 'sessionChanged' : 'requestError'
  return translate(locale,key)
}
export function taskReason(task, locale) {
  if (task.status === 'failed') return translate(locale, messages['en-US'][task.reasonCode] ? task.reasonCode : 'SCHEDULE_FAILED')
  return translate(locale, task.scheduleStage === 'scheduling' ? 'scheduling' : 'waitingRobot')
}

// Logs always stay English, regardless of the UI locale. Never expose raw planner diagnostics.
export function englishLogMessage(log) {
  if (log.type !== 'failed') return log.message
  const code = log.message?.match(/\b(NO_ROBOTS|NO_CAPABLE_ROBOT|LOW_BATTERY|ROBOT_CHARGING|MAP_NOT_ALLOWED|NODE_NOT_FOUND|PATH_UNREACHABLE|NO_FEASIBLE_ROBOT|SCHEDULE_FAILED)\b/)?.[1] || 'SCHEDULE_FAILED'
  return `${log.taskId || 'Task'}: ${translate('en-US',code)}`
}

export const preferenceKey = 'rcss-ui-v1'
export function readPreferences(storage) {
  let saved
  try { saved = JSON.parse(storage?.getItem(preferenceKey) || '{}') } catch { saved = {} }
  const folds = {}
  for (const key of ['summary','queue','list','details','robots']) if (typeof saved?.folds?.[key] === 'boolean') folds[key] = saved.folds[key]
  return { locale:saved?.locale === 'en-US' ? 'en-US' : 'zh-CN', theme:saved?.theme === 'dark' ? 'dark' : 'light',
    leftHidden:saved?.leftHidden === true, rightHidden:saved?.rightHidden === true, folds }
}
