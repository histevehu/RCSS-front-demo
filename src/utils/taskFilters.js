/** 状态入口属于概览；时间、机器人和类型是可组合的记录查询条件。 */
export const statusFilters = ['all', 'executing', 'waiting', 'completed', 'failed']
const taskTypes = ['delivery', 'pickup', 'sample', 'document', 'other']
export function normalizeTaskFilter(value) {
  // 兼容旧链接中的紧急/今天筛选，不再作为新的菜单入口。
  return [...statusFilters, 'urgent', 'today'].includes(value) ? value : 'all'
}
function validDate(value) {
  if(typeof value!=='string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return ''
  const time=Date.parse(`${value}T00:00:00Z`)
  return Number.isFinite(time) && new Date(time).toISOString().slice(0,10)===value ? value:''
}
export function readTaskCriteria(query) {
  return {period:['hour','today','range'].includes(query.period) ? query.period:'all',
    robot:typeof query.robot==='string' && /^R\d+$/.test(query.robot) ? query.robot:'',
    taskType:taskTypes.includes(query.taskType) ? query.taskType:'',
    from:validDate(query.from),to:validDate(query.to)}
}

/** 按创建时间筛选；日期范围采用业务时区 Asia/Shanghai，结束日期包含整天。 */
export function filterTaskRecords(tasks, criteria, now) {
  let from=-Infinity,to=Infinity
  if(criteria.period==='hour') {from=now-3600000;to=now}
  if(criteria.period==='today') {
    const date=new Date(now+8*3600000).toISOString().slice(0,10)
    from=Date.parse(`${date}T00:00:00+08:00`);to=from+86400000
  }
  if(criteria.period==='range') {
    if(criteria.from) from=Date.parse(`${criteria.from}T00:00:00+08:00`)
    if(criteria.to) to=Date.parse(`${criteria.to}T00:00:00+08:00`)+86400000
  }
  return tasks.filter(task=>{
    if(criteria.robot && task.robotId!==criteria.robot) return false
    if(criteria.taskType && task.taskType!==criteria.taskType) return false
    if(criteria.period==='all') return true
    const created=Date.parse(task.createdAt)
    return Number.isFinite(created) && created>=from && (criteria.period==='hour' ? created<=to : created<to)
  })
}
