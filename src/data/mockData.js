// 模拟任务数据
export const tasks = [
  {
    id: 'T001',
    name: 'ICU送药',
    priority: 'urgent',
    status: 'executing',
    robotId: 'R3',
    duration: 135, // 2m15s
    estimatedTime: 210, // 3m30s
    route: ['A楼1F M药房', 'E1电梯', 'B楼3F N诊室'],
    createdAt: new Date('2026-01-12T14:25:00'),
  },
  {
    id: 'T002',
    name: '检验样本',
    priority: 'normal',
    status: 'executing',
    robotId: 'R1',
    duration: 65, // 1m05s
    estimatedTime: 250, // 4m10s
    route: ['2F', '楼梯', '1F'],
    createdAt: new Date('2026-01-12T14:26:00'),
  },
  {
    id: 'T003',
    name: '日常物资',
    priority: 'low',
    status: 'waiting',
    robotId: 'R4',
    duration: 0,
    estimatedTime: 380, // 6m20s
    route: ['待计算'],
    createdAt: new Date('2026-01-12T14:28:00'),
  },
  {
    id: 'T004',
    name: '急诊药品',
    priority: 'urgent',
    status: 'executing',
    robotId: 'R2',
    duration: 180,
    estimatedTime: 240,
    route: ['A楼2F 急诊科', 'E2电梯', 'A楼5F 病房'],
    createdAt: new Date('2026-01-12T14:20:00'),
  },
  {
    id: 'T005',
    name: '病历文件',
    priority: 'normal',
    status: 'executing',
    robotId: 'R5',
    duration: 90,
    estimatedTime: 180,
    route: ['B楼1F 档案室', '楼梯', 'B楼3F 医生办公室'],
    createdAt: new Date('2026-01-12T14:22:00'),
  },
  {
    id: 'T006',
    name: '文件传递',
    priority: 'low',
    status: 'waiting',
    robotId: null,
    duration: 0,
    estimatedTime: 330, // 5m30s
    route: ['A楼3F办公室', 'A楼1F护士站'],
    createdAt: new Date('2026-01-12T14:15:00'),
  },
  {
    id: 'T007',
    name: '日常物资',
    priority: 'normal',
    status: 'waiting',
    robotId: null,
    duration: 0,
    estimatedTime: 135, // 2m15s
    route: ['B楼6F X药房', 'B楼4F Z病房'],
    createdAt: new Date('2026-01-12T14:18:00'),
  },
  {
    id: 'T008',
    name: '紧急送药',
    priority: 'urgent',
    status: 'waiting',
    robotId: null,
    duration: 0,
    estimatedTime: 0,
    route: ['A楼2F P药房', 'C楼2F Q诊室'],
    createdAt: new Date('2026-01-12T14:30:00'),
  },
  {
    id: 'T009',
    name: '输液配送',
    priority: 'normal',
    status: 'executing',
    robotId: 'R6',
    duration: 45,
    estimatedTime: 150,
    route: ['C楼1F 配液中心', 'E3电梯', 'C楼4F 病房'],
    createdAt: new Date('2026-01-12T14:27:00'),
  },
  {
    id: 'T010',
    name: '标本运送',
    priority: 'normal',
    status: 'executing',
    robotId: 'R7',
    duration: 120,
    estimatedTime: 200,
    route: ['A楼3F 病房', 'E1电梯', 'A楼1F 检验科'],
    createdAt: new Date('2026-01-12T14:23:00'),
  },
  {
    id: 'T011',
    name: '器械回收',
    priority: 'low',
    status: 'executing',
    robotId: 'R8',
    duration: 200,
    estimatedTime: 280,
    route: ['B楼4F 手术室', 'E2电梯', 'B楼B1 消毒中心'],
    createdAt: new Date('2026-01-12T14:19:00'),
  },
]

// 已完成任务（用于统计）
export const completedTasks = Array.from({ length: 62 }, (_, i) => ({
  id: `TC${String(i + 1).padStart(3, '0')}`,
  name: ['送药', '检验', '物资', '文件'][i % 4],
  priority: ['urgent', 'normal', 'low'][i % 3],
  status: 'completed',
  completedAt: new Date(Date.now() - Math.random() * 8 * 60 * 60 * 1000),
}))

// 机器人数据
export const robots = [
  { id: 'R1', status: 'executing', position: { building: 'A', floor: '2F', location: '走廊' }, currentTaskId: 'T002' },
  { id: 'R2', status: 'executing', position: { building: 'A', floor: '3F', location: 'E2电梯' }, currentTaskId: 'T004' },
  { id: 'R3', status: 'executing', position: { building: 'B', floor: '2F', location: 'E1电梯' }, currentTaskId: 'T001' },
  { id: 'R4', status: 'executing', position: { building: 'A', floor: '1F', location: '药房' }, currentTaskId: 'T003' },
  { id: 'R5', status: 'executing', position: { building: 'B', floor: '2F', location: '楼梯' }, currentTaskId: 'T005' },
  { id: 'R6', status: 'executing', position: { building: 'C', floor: '2F', location: 'E3电梯' }, currentTaskId: 'T009' },
  { id: 'R7', status: 'executing', position: { building: 'A', floor: '2F', location: '走廊' }, currentTaskId: 'T010' },
  { id: 'R8', status: 'executing', position: { building: 'B', floor: '2F', location: 'E2电梯' }, currentTaskId: 'T011' },
]

// 垂直资源利用率
export const verticalResources = [
  { name: 'A楼 Stair1', type: 'stair', utilization: 20, trend: 3 },
  { name: 'A楼 Stair2', type: 'stair', utilization: 20, trend: -2 },
  { name: 'B楼 Stair1', type: 'stair', utilization: 20, trend: 3 },
  { name: 'B楼 Stair2', type: 'stair', utilization: 20, trend: 3 },
  { name: 'C楼 Stair1', type: 'stair', utilization: 20, trend: 3 },
  { name: 'C楼 Stair2', type: 'stair', utilization: 20, trend: 3 },
  { name: 'A楼 Elevator1', type: 'elevator', utilization: 20, trend: 3 },
  { name: 'A楼 Elevator2', type: 'elevator', utilization: 50, trend: -2 },
  { name: 'B楼 Elevator1', type: 'elevator', utilization: 20, trend: 3 },
  { name: 'B楼 Elevator2', type: 'elevator', utilization: 20, trend: 3 },
  { name: 'C楼 Elevator1', type: 'elevator', utilization: 30, trend: 3 },
  { name: 'C楼 Elevator2', type: 'elevator', utilization: 30, trend: 3 },
]

// 热点区域
export const hotspots = [
  { location: 'A楼3F-X药房', taskCount: 5 },
  { location: 'B楼6F-Y病房', taskCount: 4 },
  { location: 'C楼2F-急诊科', taskCount: 3 },
  { location: 'A楼1F-检验科', taskCount: 3 },
]

// 冲突统计
export const conflictStats = {
  efficiency: 98,
  trend: 2,
  total: 14,
  recentResolved: 3,
  hotspot: 'B楼6F 电梯E1',
}

// 院区列表
export const districts = [
  { id: 'east', name: '东院区' },
  { id: 'west', name: '西院区' },
  { id: 'south', name: '南院区' },
]

// 任务日志
export const taskLogs = [
  { time: '14:30:15', type: 'create', taskId: 'T008', message: '创建紧急任务: 紧急送药' },
  { time: '14:28:30', type: 'complete', taskId: 'TC062', message: '任务完成: 病历运送' },
  { time: '14:27:45', type: 'start', taskId: 'T009', message: '任务开始执行: 输液配送' },
  { time: '14:26:00', type: 'assign', taskId: 'T002', message: '任务分配给 R1: 检验样本' },
  { time: '14:25:30', type: 'conflict', taskId: null, message: '检测到路径冲突: B楼6F 电梯E1' },
  { time: '14:25:00', type: 'start', taskId: 'T001', message: '任务开始执行: ICU送药' },
  { time: '14:24:00', type: 'complete', taskId: 'TC061', message: '任务完成: 急诊送药' },
  { time: '14:22:00', type: 'start', taskId: 'T005', message: '任务开始执行: 病历文件' },
]

// 格式化时间
export function formatDuration(seconds) {
  if (!seconds) return '0s'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  return `${m}m${s > 0 ? s + 's' : ''}`
}

// 获取优先级文本
export function getPriorityText(priority) {
  const map = { urgent: '紧急', normal: '普通', low: '低优' }
  return map[priority] || priority
}

// 获取状态文本
export function getStatusText(status) {
  const map = { executing: '执行中', waiting: '等待中', completed: '已完成', idle: '空闲中', charging: '充电中' }
  return map[status] || status
}
