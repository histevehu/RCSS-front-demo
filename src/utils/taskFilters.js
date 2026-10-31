/** 统一工作台的筛选值，旧链接与页面控件共用校验规则。 */
export const statusFilters = ['all', 'executing', 'waiting', 'completed', 'failed']
export const extraFilters = ['urgent', 'today']
export function normalizeTaskFilter(value) {
  return [...statusFilters, ...extraFilters].includes(value) ? value : 'all'
}
