// Mock task data
export const tasks = [
  {
    id: 'T001',
    name: 'ICU Medicine Delivery',
    priority: 'urgent',
    status: 'executing',
    robotId: 'R3',
    duration: 135, // 2m15s
    estimatedTime: 210, // 3m30s
    // 路线由拓扑网络节点组成（同一地图）
    routeNodes: ['zone_1:p2', 'zone_1:p4'],
    createdAt: new Date('2026-01-12T14:25:00'),
  },
  {
    id: 'T002',
    name: 'Lab Sample',
    priority: 'normal',
    status: 'executing',
    robotId: 'R1',
    duration: 65, // 1m05s
    estimatedTime: 250, // 4m10s
    routeNodes: ['zone_2:p2', 'zone_2:p4'],
    createdAt: new Date('2026-01-12T14:26:00'),
  },
  {
    id: 'T003',
    name: 'Daily Supplies',
    priority: 'low',
    status: 'waiting',
    robotId: 'R4',
    duration: 0,
    estimatedTime: 380, // 6m20s
    route: ['Pending'],
    createdAt: new Date('2026-01-12T14:28:00'),
  },
  {
    id: 'T004',
    name: 'Emergency Medicine',
    priority: 'urgent',
    status: 'executing',
    robotId: 'R2',
    duration: 180,
    estimatedTime: 240,
    routeNodes: ['zone_1:p2', 'zone_1:p5'],
    createdAt: new Date('2026-01-12T14:20:00'),
  },
  {
    id: 'T005',
    name: 'Medical Records',
    priority: 'normal',
    status: 'executing',
    robotId: 'R5',
    duration: 90,
    estimatedTime: 180,
    routeNodes: ['zone_2:p2', 'zone_2:p5'],
    createdAt: new Date('2026-01-12T14:22:00'),
  },
  {
    id: 'T006',
    name: 'Document Delivery',
    priority: 'low',
    status: 'waiting',
    robotId: null,
    duration: 0,
    estimatedTime: 330, // 5m30s
    routeNodes: ['zone_3:p2', 'zone_3:p4'],
    createdAt: new Date('2026-01-12T14:15:00'),
  },
  {
    id: 'T007',
    name: 'Daily Supplies',
    priority: 'normal',
    status: 'waiting',
    robotId: null,
    duration: 0,
    estimatedTime: 135, // 2m15s
    routeNodes: ['zone_2:p3', 'zone_2:p5'],
    createdAt: new Date('2026-01-12T14:18:00'),
  },
  {
    id: 'T008',
    name: 'Urgent Medicine Delivery',
    priority: 'urgent',
    status: 'waiting',
    robotId: null,
    duration: 0,
    estimatedTime: 0,
    routeNodes: ['zone_1:p7', 'zone_1:p3'],
    createdAt: new Date('2026-01-12T14:30:00'),
  },
  {
    id: 'T009',
    name: 'Infusion Delivery',
    priority: 'normal',
    status: 'executing',
    robotId: 'R6',
    duration: 45,
    estimatedTime: 150,
    routeNodes: ['zone_3:p2', 'zone_3:p5'],
    createdAt: new Date('2026-01-12T14:27:00'),
  },
  {
    id: 'T010',
    name: 'Specimen Transport',
    priority: 'normal',
    status: 'executing',
    robotId: 'R7',
    duration: 120,
    estimatedTime: 200,
    routeNodes: ['zone_1:p2', 'zone_1:p3'],
    createdAt: new Date('2026-01-12T14:23:00'),
  },
  {
    id: 'T011',
    name: 'Instrument Collection',
    priority: 'low',
    status: 'executing',
    robotId: 'R8',
    duration: 200,
    estimatedTime: 280,
    routeNodes: ['zone_2:p3', 'zone_2:p2'],
    createdAt: new Date('2026-01-12T14:19:00'),
  }
]

// Completed tasks (for statistics)
export const completedTasks = Array.from({ length: 62 }, (_, i) => ({
  id: `TC${String(i + 1).padStart(3, '0')}`,
  name: ['Medicine Delivery', 'Lab Test', 'Supplies', 'Documents'][i % 4],
  priority: ['urgent', 'normal', 'low'][i % 3],
  status: 'completed',
  completedAt: new Date(Date.now() - Math.random() * 8 * 60 * 60 * 1000),
}))

// Robot data
export const robots = [
  { id: 'R1', status: 'executing', position: { building: 'A', floor: '2F', location: 'Corridor' }, currentTaskId: 'T002' },
  { id: 'R2', status: 'executing', position: { building: 'A', floor: '3F', location: 'Elevator E2' }, currentTaskId: 'T004' },
  { id: 'R3', status: 'executing', position: { building: 'B', floor: '2F', location: 'Elevator E1' }, currentTaskId: 'T001' },
  { id: 'R4', status: 'executing', position: { building: 'A', floor: '1F', location: 'Pharmacy' }, currentTaskId: 'T003' },
  { id: 'R5', status: 'executing', position: { building: 'B', floor: '2F', location: 'Stair' }, currentTaskId: 'T005' },
  { id: 'R6', status: 'executing', position: { building: 'C', floor: '2F', location: 'Elevator E3' }, currentTaskId: 'T009' },
  { id: 'R7', status: 'executing', position: { building: 'A', floor: '2F', location: 'Corridor' }, currentTaskId: 'T010' },
  { id: 'R8', status: 'executing', position: { building: 'B', floor: '2F', location: 'Elevator E2' }, currentTaskId: 'T011' },
]

// Vertical resource utilization
export const verticalResources = [
  { name: 'Building A Stair1', type: 'stair', utilization: 20, trend: 3 },
  { name: 'Building A Stair2', type: 'stair', utilization: 20, trend: -2 },
  { name: 'Building B Stair1', type: 'stair', utilization: 20, trend: 3 },
  { name: 'Building B Stair2', type: 'stair', utilization: 20, trend: 3 },
  { name: 'Building C Stair1', type: 'stair', utilization: 20, trend: 3 },
  { name: 'Building C Stair2', type: 'stair', utilization: 20, trend: 3 },
  { name: 'Building A Elevator1', type: 'elevator', utilization: 20, trend: 3 },
  { name: 'Building A Elevator2', type: 'elevator', utilization: 50, trend: -2 },
  { name: 'Building B Elevator1', type: 'elevator', utilization: 20, trend: 3 },
  { name: 'Building B Elevator2', type: 'elevator', utilization: 20, trend: 3 },
  { name: 'Building C Elevator1', type: 'elevator', utilization: 30, trend: 3 },
  { name: 'Building C Elevator2', type: 'elevator', utilization: 30, trend: 3 },
]

// Hotspots
export const hotspots = [
  { location: 'Building A 3F - X Pharmacy', taskCount: 5 },
  { location: 'Building B 6F - Y Ward', taskCount: 4 },
  { location: 'Building C 2F - Emergency', taskCount: 3 },
  { location: 'Building A 1F - Laboratory', taskCount: 3 },
]

// Conflict statistics
export const conflictStats = {
  efficiency: 98,
  trend: 2,
  total: 14,
  recentResolved: 3,
  hotspot: 'Building B 6F Elevator E1',
}

// Campus list
export const districts = [
  { id: 'east', name: 'East Campus' },
  { id: 'west', name: 'West Campus' },
  { id: 'south', name: 'South Campus' },
]

// Task logs
export const taskLogs = [
  { time: '14:30:15', type: 'create', taskId: 'T008', message: 'Created urgent task: Urgent Medicine Delivery' },
  { time: '14:28:30', type: 'complete', taskId: 'TC062', message: 'Task completed: Medical Record Delivery' },
  { time: '14:27:45', type: 'start', taskId: 'T009', message: 'Task started: Infusion Delivery' },
  { time: '14:26:00', type: 'assign', taskId: 'T002', message: 'Task assigned to R1: Lab Sample' },
  { time: '14:25:30', type: 'conflict', taskId: null, message: 'Path conflict detected: Building B 6F Elevator E1' },
  { time: '14:25:00', type: 'start', taskId: 'T001', message: 'Task started: ICU Medicine Delivery' },
  { time: '14:24:00', type: 'complete', taskId: 'TC061', message: 'Task completed: Emergency Medicine Delivery' },
  { time: '14:22:00', type: 'start', taskId: 'T005', message: 'Task started: Medical Records' },
]

// Format duration
export function formatDuration(seconds) {
  if (!seconds) return '0s'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  return `${m}m${s > 0 ? s + 's' : ''}`
}

// Get priority text
export function getPriorityText(priority) {
  const map = { urgent: 'Urgent', normal: 'Normal', low: 'Low' }
  return map[priority] || priority
}

// Get status text
export function getStatusText(status) {
  const map = { executing: 'Executing', waiting: 'Waiting', completed: 'Completed', idle: 'Idle', charging: 'Charging' }
  return map[status] || status
}
