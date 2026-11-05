import { formatDuration } from './demo.js'

export const messages = {
  'zh-CN': {
    batchUnsupported:'演示后端版本过旧，请重启后端以启用批任务设置。',batchSubmission:'批任务提交',batchWindow:'时间窗',collectedTasks:'条已收集',awaitFirstTask:'等待首条任务',nextBatchWindow:'下一批时间窗',invalidBatchWindow:'请输入 1–60 的整数秒',joinBatch:'加入当前批次',publishNow:'立即发布',createAndContinue:'创建并继续',collecting:'等待成批',
    TRANSPORT_ITEM:'物品运输', TRANSPORT_MEDICINE:'药品运输', TRANSPORT_SPECIMEN:'样本运输', TRANSPORT_MED_WASTE:'医疗废物运输',
    campusLoadError:'园区加载失败，请检查数据库、机器人配置和地图资源。当前场次已保留，可重试或选择演示园区。', simulatedPosition:'演示初始位置 · 演示地图分配',
    robotCapabilities:'支持能力', currentLocation:'当前位置', switchingCampus:'正在切换园区', switch_configuration:'读取配置', switch_assets:'获取地图', switch_validation:'校验建图', switch_commit:'提交场次',
    mapResourceTimeout:'远程地图连接或下载超时，重试后仍未成功。当前场次已保留。', mapResourceConnection:'远程地图网络连接失败，当前场次已保留。', mapResourceHttp:'地图存储服务拒绝请求或暂时不可用，当前场次已保留。', campusPreparationTimeout:'园区准备超过时限，当前场次已保留。', retryCampus:'重试切换',
    laneCategory:'单向车道', sharedCategory:'共享通道',
    elevatorCategory:'电梯', elevatorBooking:'电梯预约',
    CONFLICT_UNRESOLVED:'通道或等待位置被占用，暂时没有安全执行计划',
    taskUrgency:'紧急程度', assignedRobot:'分配机器人',
    stairCategory:'楼梯', idleRobot:'空闲机器人', executionDuration:'执行耗时', executionProgress:'执行进度', awaitScheduling:'等待调度',
    campus:'园区', loadingCampus:'加载园区…', workspacePages:'工作页面', demoControls:'演示控制', dispatchArea:'调度概况', distributionShort:'分布', metricsShort:'指标',
    floorDistribution:'任务楼层分布', destinationBasis:'按本场任务终点统计 · 每单计一次', topDestinations:'目的地点排行', noDestinationTasks:'暂无任务目的地点', destinationFloor:'目的楼层', destinationLocation:'目的地点', allLocations:'全部地点',
    schedulingMetrics:'调度指标', planningConflicts:'本场规划冲突', resolved:'已处理', unresolved:'未解决', resolutionRate:'冲突处理率', recentResolved:'近一小时已处理',
    verticalUsage:'垂直资源利用率', simulationHour:'近一小时', elevators:'电梯', noElevators:'未配置电梯', noStairs:'未配置楼梯', usageDefinition:'模拟执行占用 · 按已发生占用时间统计',
    conflictEvents:'冲突事件', noConflictEvents:'本场尚未检测到规划冲突', conflictDefinition:'仅统计最终采用的规划尝试。重复检测和机器人排队不重复计数，最多保留最近 100 条事件。', resource_stair:'楼梯', resource_elevator:'电梯', resource_corridor:'通道',

    recordConditions:'记录筛选', createdTime:'创建时间', period_all:'全部时间', period_hour:'最近一小时', period_today:'今天', period_range:'日期范围', fromDate:'开始日期', toDate:'结束日期', allRobots:'全部机器人', allTypes:'全部类型', clearConditions:'清除条件', applyFilters:'应用筛选', invalidDateRange:'结束日期不能早于开始日期', recordPages:'任务记录分页', previousPage:'上一页', nextPage:'下一页', filter_all:'全部', filter_executing:'执行中', filter_waiting:'等待', filter_completed:'已完成', filter_failed:'失败', moreFilters:'更多筛选', emptyFiltered:'当前筛选下暂无任务', showAllTasks:'查看全部任务', executingRobot:'执行中的机器人', requiredCapability:'所需能力', supportedCapabilities:'支持能力', capabilityMatch:'能力匹配', matched:'匹配', mismatched:'不匹配', unknownCapability:'能力信息不可用', transportCapability:'物品配送', pickupCapability:'物品取货', sampleCapability:'样本运输', documentCapability:'文件运输', specialCapability:'特殊作业', noCapableRobot:'当前无机器人具备所需能力，提交后将调度失败。', capableRobots:'能力符合的机器人', capabilityHint:'演示能力配置；实际分配还取决于路径、优先级和资源占用。',
    taskOverview:'任务概览', taskRecords:'任务记录', details:'详情', clearSelection:'取消选择任务', emptyRecordsHint:'新建任务后，可在这里查看调度与执行状态。', appTitle:'机器人任务调度中心', overview:'概览', tasks:'任务', liveMode:'实时调度 · 模拟执行',
    connected:'已连接', disconnected:'连接中断', paused:'已暂停', pause:'暂停', resume:'继续', speed:'演示倍速', reset:'重置当前园区演示',
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
    NO_ROBOTS:'没有可用机器人', NO_CAPABLE_ROBOT:'没有具备所需能力的机器人', LOW_BATTERY:'机器人电量不足', ROBOT_CHARGING:'机器人正在充电',
    MAP_NOT_ALLOWED:'机器人无法进入目标地点', NODE_NOT_FOUND:'所选地点不可用', PATH_UNREACHABLE:'起终点之间没有可达路径', NO_FEASIBLE_ROBOT:'当前没有可执行此任务的机器人', SCHEDULE_FAILED:'调度失败，请重试',
  },
  'en-US': {
    batchUnsupported:'The demo backend is outdated. Restart it to enable batch settings.',batchSubmission:'Batch submission',batchWindow:'Window',collectedTasks:'tasks collected',awaitFirstTask:'Waiting for first task',nextBatchWindow:'Next batch window',invalidBatchWindow:'Enter an integer from 1 to 60 seconds',joinBatch:'Join batch',publishNow:'Publish now',createAndContinue:'Create and continue',collecting:'Collecting batch',
    TRANSPORT_ITEM:'Item transport', TRANSPORT_MEDICINE:'Medicine transport', TRANSPORT_SPECIMEN:'Specimen transport', TRANSPORT_MED_WASTE:'Medical waste transport',
    campusLoadError:'Campus unavailable. Check database, robot configuration and map resources. Current session preserved; retry or select Demo Campus.', simulatedPosition:'Simulated position · demo map assignment',
    robotCapabilities:'Capabilities', currentLocation:'Current location', switchingCampus:'Switching campus', switch_configuration:'Reading configuration', switch_assets:'Fetching maps', switch_validation:'Validating topology', switch_commit:'Committing session',
    mapResourceTimeout:'Remote map connection or download timed out after retries. Current session preserved.', mapResourceConnection:'Remote map connection failed. Current session preserved.', mapResourceHttp:'Map storage rejected the request or is unavailable. Current session preserved.', campusPreparationTimeout:'Campus preparation exceeded its deadline. Current session preserved.', retryCampus:'Retry switch',
    laneCategory:'One-way lane', sharedCategory:'Shared passage',
    elevatorCategory:'Elevator', elevatorBooking:'Elevator booking',
    CONFLICT_UNRESOLVED:'No safe plan: corridor or waiting position is occupied',
    taskUrgency:'Priority', assignedRobot:'Assigned robot',
    stairCategory:'Stairs', idleRobot:'Idle robot', executionDuration:'Execution time', executionProgress:'Execution progress', awaitScheduling:'Awaiting scheduling',
    campus:'Campus', loadingCampus:'Loading campus…', workspacePages:'Workspace pages', demoControls:'Demo controls', dispatchArea:'Dispatch overview', distributionShort:'Demand', metricsShort:'Metrics',
    floorDistribution:'Tasks by floor', destinationBasis:'Session destinations · each order counted once', topDestinations:'Top destinations', noDestinationTasks:'No task destinations yet', destinationFloor:'Destination floor', destinationLocation:'Destination', allLocations:'All locations',
    schedulingMetrics:'Scheduling metrics', planningConflicts:'Session conflicts', resolved:'Resolved', unresolved:'Unresolved', resolutionRate:'Resolution rate', recentResolved:'Resolved in last hour',
    verticalUsage:'Vertical resources', simulationHour:'Last hour', elevators:'Elevators', noElevators:'None configured', noStairs:'No stairs configured', usageDefinition:'Simulated execution · elapsed occupancy only',
    conflictEvents:'Conflict events', noConflictEvents:'No planning conflicts detected this session', conflictDefinition:'Only the selected planning attempt is counted. Repeated detection and robot queues are excluded. The latest 100 events are retained.', resource_stair:'Stairs', resource_elevator:'Elevator', resource_corridor:'Corridor',

    recordConditions:'Record filters', createdTime:'Created time', period_all:'All time', period_hour:'Last hour', period_today:'Today', period_range:'Date range', fromDate:'From date', toDate:'To date', allRobots:'All robots', allTypes:'All types', clearConditions:'Clear conditions', applyFilters:'Apply filters', invalidDateRange:'End date must not precede start date', recordPages:'Task record pages', previousPage:'Previous', nextPage:'Next', filter_all:'All', filter_executing:'Active', filter_waiting:'Queued', filter_completed:'Done', filter_failed:'Failed', moreFilters:'More filters', emptyFiltered:'No tasks match this filter', showAllTasks:'Show all tasks', executingRobot:'Executing robot', requiredCapability:'Required capability', supportedCapabilities:'Supported capabilities', capabilityMatch:'Capability match', matched:'Matched', mismatched:'Mismatch', unknownCapability:'Capability unavailable', transportCapability:'Item delivery', pickupCapability:'Item pickup', sampleCapability:'Sample transport', documentCapability:'Document transport', specialCapability:'Special operation', noCapableRobot:'No robot supports this capability. Scheduling will fail if submitted.', capableRobots:'Capable robots', capabilityHint:'Demo capability configuration; allocation also depends on route, priority and resources.',
    taskOverview:'Task overview', taskRecords:'Task records', details:'Details', clearSelection:'Clear selected task', emptyRecordsHint:'Create an order to follow its allocation and execution here.', appTitle:'Robot Task Dispatch Center', overview:'Overview', tasks:'Tasks', liveMode:'Live Scheduling · Simulated Execution',
    connected:'Connected', disconnected:'Disconnected', paused:'Paused', pause:'Pause', resume:'Resume', speed:'Demo speed', reset:'Reset Current Campus',
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
  return String(value ?? '').replaceAll('Stairs 4F–5F', translate(locale,'stairs')).replaceAll('Elevator E1 · 4F–5F', locale==='zh-CN' ? '电梯 E1 · 4F–5F':'Elevator E1 · 4F–5F').replaceAll('Parking ',locale==='zh-CN' ? '停车位 ':'Parking ').replaceAll('Unknown location',translate(locale,'unavailable')).replaceAll('Pending',translate(locale,'pending'))
}
export function errorLabel(value, locale) {
  if (!value) return ''
  const key = String(value).includes('BATCH_UNSUPPORTED') ? 'batchUnsupported' : String(value).includes('Campus data unavailable') ? 'campusLoadError' : String(value).includes('Disconnected') ? 'disconnectedError'
    : String(value).includes('reconnect') ? 'reconnectError'
    : /SESSION_CHANGED|Demonstration changed/.test(value) ? 'sessionChanged' : 'requestError'
  return translate(locale,key)
}
export function taskReason(task, locale) {
  if (task.status === 'failed') return translate(locale, messages['en-US'][task.reasonCode] ? task.reasonCode : 'SCHEDULE_FAILED')
  return translate(locale, task.scheduleStage === 'collecting' ? 'collecting' : task.scheduleStage === 'scheduling' ? 'scheduling' : 'waitingRobot')
}

// Logs always stay English, regardless of the UI locale. Never expose raw planner diagnostics.
export function englishLogMessage(log) {
  if (log.type !== 'failed') return log.message
  const code = log.message?.match(/\b(NO_ROBOTS|NO_CAPABLE_ROBOT|LOW_BATTERY|ROBOT_CHARGING|MAP_NOT_ALLOWED|NODE_NOT_FOUND|PATH_UNREACHABLE|NO_FEASIBLE_ROBOT|CONFLICT_UNRESOLVED|SCHEDULE_FAILED)\b/)?.[1] || 'SCHEDULE_FAILED'
  return `${log.taskId || 'Task'}: ${translate('en-US',code)}`
}

export const preferenceKey = 'rcss-ui-v1'
export function readPreferences(storage) {
  let saved
  try { saved = JSON.parse(storage?.getItem(preferenceKey) || '{}') } catch { saved = {} }
  const folds = {}
  for (const key of ['summary','queue','list','details','robots','distribution','metrics']) if (typeof saved?.folds?.[key] === 'boolean') folds[key] = saved.folds[key]
  return { locale:saved?.locale === 'en-US' ? 'en-US' : 'zh-CN', theme:saved?.theme === 'dark' ? 'dark' : 'light',
    leftHidden:saved?.leftHidden === true, rightHidden:saved?.rightHidden === true, folds }
}

// 能力编码仅用于匹配，界面始终使用本地化名称；未知编码不直接暴露。
export function capabilityLabel(code, locale) {
  const keys = {TRANSPORT_ITEM:'TRANSPORT_ITEM', TRANSPORT_MEDICINE:'TRANSPORT_MEDICINE', TRANSPORT_SPECIMEN:'TRANSPORT_SPECIMEN', TRANSPORT_MED_WASTE:'TRANSPORT_MED_WASTE', demo_transport:'transportCapability', demo_pickup:'pickupCapability',
    demo_sample:'sampleCapability', demo_document:'documentCapability', demo_special:'specialCapability'}
  return translate(locale, keys[code] || 'unknownCapability')
}
