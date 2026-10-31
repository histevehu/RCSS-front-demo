import test from 'node:test'
import assert from 'node:assert/strict'
import {readTaskCriteria,filterTaskRecords} from '../src/utils/taskFilters.js'
const now=Date.parse('2026-10-31T10:00:00+08:00')
const tasks=[
 {id:'a',robotId:'R1',taskType:'sample',createdAt:'2026-10-31T09:00:00+08:00'},
 {id:'b',robotId:'R2',taskType:'sample',createdAt:'2026-10-31T09:30:00+08:00'},
 {id:'c',robotId:'R1',taskType:'document',createdAt:'2026-10-30T23:59:59+08:00'},
 {id:'d',robotId:null,taskType:'sample',createdAt:'2026-10-31T00:00:00+08:00'},
 {id:'e',robotId:'R1',taskType:'sample',createdAt:'2026-11-01T00:00:00+08:00'},
]
const ids=(query)=>filterTaskRecords(tasks,readTaskCriteria(query),now).map(t=>t.id)
test('record conditions intersect robot, type and creation time',()=>{
 assert.deepEqual(ids({period:'hour',robot:'R1',taskType:'sample'}),['a'])
 assert.deepEqual(ids({period:'today'}),['a','b','d'])
 assert.deepEqual(ids({period:'range',from:'2026-10-31',to:'2026-10-31'}),['a','b','d'])
 assert.deepEqual(ids({robot:'R1'}),['a','c','e'])
})
test('invalid URL dates and values are discarded; open ranges and reversed ranges are safe',()=>{
 assert.deepEqual(readTaskCriteria({period:'bad',robot:['R1'],taskType:'private',from:'2026-02-31',to:'bad'}),{period:'all',robot:'',taskType:'',from:'',to:''})
 assert.deepEqual(ids({period:'range',to:'2026-10-30'}),['c'])
 assert.deepEqual(ids({period:'range',from:'2026-11-01',to:'2026-10-30'}),[])
})
