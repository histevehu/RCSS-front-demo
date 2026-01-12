import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { tasks as mockTasks, robots as mockRobots, completedTasks, districts, taskLogs as mockLogs } from '../data/mockData'

export const useAppStore = defineStore('app', () => {
  // 当前院区
  const currentDistrict = ref('east')
  
  // 任务列表
  const tasks = ref([...mockTasks])
  
  // 机器人列表
  const robots = ref([...mockRobots])
  
  // 任务日志
  const taskLogs = ref([...mockLogs])
  
  // 选中的任务ID
  const selectedTaskId = ref(null)
  
  // 当前时间
  const currentTime = ref(new Date())
  
  // 统计数据
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
      avgCompletionTime: '5分12秒',
      completionRate: 98,
      completionTrend: 2,
      peakRate: 98,
      peakTime: '10:30',
      valleyRate: 78,
      valleyTime: '14:00',
    }
  })
  
  // 机器人统计
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
  
  // 按状态筛选任务
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
  
  // 等待队列
  const waitingQueue = computed(() => {
    return tasks.value
      .filter(t => t.status === 'waiting')
      .sort((a, b) => {
        // 按优先级排序
        const priorityOrder = { urgent: 0, normal: 1, low: 2 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })
  })
  
  // 选择任务
  function selectTask(taskId) {
    selectedTaskId.value = taskId
  }
  
  // 切换院区
  function setDistrict(districtId) {
    currentDistrict.value = districtId
  }
  
  // 添加新任务
  function addTask(task) {
    const newTask = {
      id: `T${String(tasks.value.length + completedTasks.length + 1).padStart(3, '0')}`,
      ...task,
      status: 'waiting',
      duration: 0,
      createdAt: new Date(),
    }
    tasks.value.unshift(newTask)
    
    // 添加日志
    taskLogs.value.unshift({
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: 'create',
      taskId: newTask.id,
      message: `创建${task.priority === 'urgent' ? '紧急' : ''}任务: ${task.name}`,
    })
    
    return newTask
  }
  
  // 更新时间
  function updateTime() {
    currentTime.value = new Date()
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
    getTasksByFilter,
    selectTask,
    setDistrict,
    addTask,
    updateTime,
  }
})
