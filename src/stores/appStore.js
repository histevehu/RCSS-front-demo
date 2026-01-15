import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { tasks as mockTasks, robots as mockRobots, completedTasks, districts, taskLogs as mockLogs } from '../data/mockData'

export const useAppStore = defineStore('app', () => {
  // Current campus
  const currentDistrict = ref('east')
  
  // Task list
  const tasks = ref([...mockTasks])
  
  // Robot list
  const robots = ref([...mockRobots])
  
  // Task logs
  const taskLogs = ref([...mockLogs])
  
  // Selected task ID
  const selectedTaskId = ref(null)
  
  // Current time
  const currentTime = ref(new Date())
  
  // Statistics
  const stats = computed(() => {
    const executing = tasks.value.filter(t => t.status === 'executing').length
    const waiting = tasks.value.filter(t => t.status === 'waiting').length
    const completed = completedTasks.length
    const urgent = tasks.value.filter(t => t.priority === 'urgent').length
    
    return {
      executing,
      waiting,
      completed,
      urgent,
      total: tasks.value.length + completed,
      taskPeak: 15,
      taskPeakTime: '10:30',
      avgCompletionTime: '5m12s',
      completionRate: 98,
      completionTrend: 2,
      peakRate: 98,
      peakTime: '10:30',
      valleyRate: 78,
      valleyTime: '14:00',
    }
  })
  
  // Robot statistics
  const robotStats = computed(() => {
    const executing = robots.value.filter(r => r.status === 'executing').length
    const idle = robots.value.filter(r => r.status === 'idle').length
    const charging = robots.value.filter(r => r.status === 'charging').length
    const total = robots.value.length
    const utilization = total > 0 ? Math.round((executing / total) * 100) : 0
    
    return {
      total,
      executing,
      idle,
      charging,
      utilization,
      utilizationTrend: 3,
    }
  })
  
  // Filter tasks by status
  const getTasksByFilter = (filter) => {
    switch (filter) {
      case 'urgent':
        return tasks.value.filter(t => t.priority === 'urgent')
      case 'executing':
        return tasks.value.filter(t => t.status === 'executing')
      case 'today':
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return tasks.value.filter(t => new Date(t.createdAt) >= today)
      default:
        return tasks.value
    }
  }
  
  // Waiting queue
  const waitingQueue = computed(() => {
    return tasks.value
      .filter(t => t.status === 'waiting')
      .sort((a, b) => {
        // 按优先级排序
        const priorityOrder = { urgent: 0, normal: 1, low: 2 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })
  })
  
  // Select task
  function selectTask(taskId) {
    selectedTaskId.value = taskId
  }
  
  // Switch campus
  function setDistrict(districtId) {
    currentDistrict.value = districtId
  }
  
  // Add new task
  function addTask(task) {
    const taskType = task.taskType || 'other'
    const routeNodes = Array.isArray(task.routeNodes) ? task.routeNodes : []
    // 随机分配一个机器人（优先空闲，其次任意机器人）
    let assignedRobot = null
    if (robots.value.length > 0) {
      const idleRobots = robots.value.filter(r => r.status === 'idle')
      const candidates = idleRobots.length > 0 ? idleRobots : robots.value
      const index = Math.floor(Math.random() * candidates.length)
      assignedRobot = candidates[index]
    }

    // 随机生成一个预计耗时（秒），例如 2-10 分钟
    const estimatedTime = (() => {
      if (typeof task.estimatedTime === 'number' && task.estimatedTime > 0) {
        return task.estimatedTime
      }
      const minMinutes = 2
      const maxMinutes = 10
      const minutes = Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes
      return minutes * 60
    })()

    const newTask = {
      id: `T${String(tasks.value.length + completedTasks.length + 1).padStart(3, '0')}`,
      ...task,
      taskType,
      routeNodes,
      estimatedTime,
      // 为新任务绑定机器人，但仍保持 waiting 状态，表示已指派待执行
      robotId: assignedRobot ? assignedRobot.id : null,
      status: 'waiting',
      duration: 0,
      createdAt: new Date(),
    }

    tasks.value.unshift(newTask)

    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

    // 记录创建日志
    taskLogs.value.unshift({
      time: timeStr,
      type: 'create',
      taskId: newTask.id,
      message: `Created ${task.priority === 'urgent' ? 'urgent ' : ''}task: ${task.name}`,
    })

    // 如果成功分配了机器人，再记录一次指派日志，方便后续扩展
    if (assignedRobot) {
      taskLogs.value.unshift({
        time: timeStr,
        type: 'assign',
        taskId: newTask.id,
        message: `Task assigned to ${assignedRobot.id}: ${newTask.name}`,
      })
    }

    return newTask
  }
  
  // Update time
  function updateTime() {
    currentTime.value = new Date()
  }
  
  // Map data
  const maps = ref([])
  
  // Set map data
  function setMaps(mapData) {
    maps.value = mapData
  }
  
  return {
    currentDistrict,
    tasks,
    robots,
    taskLogs,
    selectedTaskId,
    currentTime,
    stats,
    robotStats,
    waitingQueue,
    districts,
    maps,
    getTasksByFilter,
    selectTask,
    setDistrict,
    addTask,
    updateTime,
    setMaps,
  }
})
