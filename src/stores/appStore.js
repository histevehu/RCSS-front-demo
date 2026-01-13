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
    const newTask = {
      id: `T${String(tasks.value.length + completedTasks.length + 1).padStart(3, '0')}`,
      ...task,
      status: 'waiting',
      duration: 0,
      createdAt: new Date(),
    }
    tasks.value.unshift(newTask)
    
    // Add log
    taskLogs.value.unshift({
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: 'create',
      taskId: newTask.id,
      message: `Created ${task.priority === 'urgent' ? 'urgent ' : ''}task: ${task.name}`,
    })
    
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
