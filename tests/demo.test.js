import test, { afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { useAppStore } from '../src/stores/appStore.js'
import { formatDuration, interpolate } from '../src/utils/demo.js'

const originalFetch = globalThis.fetch
const state = (sessionId = 'first', patch = {}) => ({ sessionId, revision: 1,
  clock: {now:10, epoch:1793340000, paused:false, speed:1}, tasks:[], robots:[], logs:[],
  stats: {total:0,waiting:0,executing:0,completed:0,completionRate:0,avgCompletionSeconds:null}, ...patch })
const response = data => ({ok:true,json:async()=>data})
function store() { setActivePinia(createPinia()); return useAppStore() }
afterEach(() => { globalThis.fetch = originalFetch })

test('duration and motion preserve holds and endpoint clamps', () => {
  assert.equal(formatDuration(61.1),'1m02s')
  assert.equal(formatDuration(null),'—')
  const points = [{x:0,y:0,z:0,time:0},{x:0,y:0,z:0,time:5},{x:10,y:0,z:3,time:15}]
  assert.equal(interpolate(points,3).x,0)
  assert.deepEqual(interpolate(points,10),{x:5,y:0,z:1.5})
  assert.equal(interpolate(points,100).x,10)
})

test('task filters and summary reflect backend state', async () => {
  globalThis.fetch = async url => response(url.endsWith('scene') ? {nodes:[],maps:[]} : state('first',{
    tasks:[{id:'T1',status:'waiting',priority:'urgent',createdSim:0},{id:'T2',status:'completed',priority:'normal',createdSim:0}],
    stats:{total:2,waiting:1,executing:0,completed:1,completionRate:50,avgCompletionSeconds:60} }))
  const s=store(); await s.refresh()
  assert.equal(s.getTasksByFilter('waiting')[0].id,'T1')
  assert.equal(s.getTasksByFilter('completed')[0].id,'T2')
  assert.equal(s.getTasksByFilter('failed').length,0)
  assert.equal(s.stats.avgCompletionTime,'1m00s')
  assert.equal(s.stats.total,2)
})

test('old poll cannot overwrite reset or control state', async () => {
  let finishOld, delay=false
  globalThis.fetch = async (url,opts) => {
    if (url.endsWith('scene')) return response({nodes:[],maps:[]})
    if (url.endsWith('reset')) return response(state('second',{clock:{now:0,epoch:0,paused:false,speed:1}}))
    if (delay) return new Promise(resolve => {finishOld=()=>resolve(response(state('first')))})
    return response(state())
  }
  const s=store(); await s.refresh(); delay=true
  const old=s.refresh(); await s.control({},true); finishOld(); await old
  assert.equal(s.sessionId,'second'); assert.equal(s.clock.now,0)
})

test('connection failure freezes display and recovery uses backend time', async () => {
  let fail=false
  globalThis.fetch=async url=> {
    if(fail) throw new Error('offline')
    return response(url.endsWith('scene') ? {nodes:[],maps:[]} : state())
  }
  const s=store(); await s.refresh(); fail=true; await s.refresh()
  assert.equal(s.connected,false)
  const frozen=s.now(); await new Promise(r=>setTimeout(r,20)); assert.equal(s.now(),frozen)
  fail=false; await s.refresh(); assert.equal(s.connected,true); assert.equal(s.clock.now,10)
})

test('accepted task survives earlier in-flight poll and is selected', async () => {
  let finishOld, delayed=false
  const task={id:'T001',name:'Transport',status:'waiting',scheduleStage:'scheduling',createdSim:10}
  globalThis.fetch=async url=> {
    if(url.endsWith('scene')) return response({nodes:[],maps:[]})
    if(url.endsWith('tasks')) return response({sessionId:'first',task})
    if(delayed) return new Promise(resolve=>{finishOld=()=>resolve(response(state()))})
    return response(state())
  }
  const s=store(); await s.refresh(); delayed=true
  const old=s.refresh()
  await s.addTask({name:'Transport',routeNodes:['a','b'],priority:'normal',taskType:'delivery'},'request')
  finishOld(); await old
  assert.equal(s.tasks.length,1); assert.equal(s.selectedTaskId,'T001')
})

test('robot location distinguishes service holds, movement, cross-map travel and completion', async () => {
  const {describeRobotLocation}=await import('../src/utils/mapInteraction.js')
  const nodes={a:{id:'a',code:'mapA:p1',mapName:'mapA',floor:4},b:{id:'b',code:'mapB:p1',mapName:'mapB',floor:5}}
  const robot={id:'R1',position:{floor:'4F',building:'mapA'}}
  const tasks=[{id:'T1',robotId:'R1',scheduleStage:'assigned',startTime:0,finishTime:20,
    timetable:[{nodeId:'a',arrival:0,depart:5},{nodeId:'b',arrival:15,depart:20}]}]
  assert.equal(describeRobotLocation(robot,tasks,nodes,3,'a').nodeText,'p1')
  const moving=describeRobotLocation(robot,tasks,nodes,10,'a')
  assert.equal(moving.inTransit,true)
  assert.equal(moving.nodeText,'p1 → mapB · p1')
  assert.equal(moving.floor,4)
  const finished=describeRobotLocation(robot,tasks,nodes,21,'a')
  assert.equal(finished.floor,5)
  assert.equal(finished.mapName,'mapB')
  assert.equal(finished.taskId,null)
  assert.equal(finished.inTransit,false)
  assert.equal(describeRobotLocation(robot,[],nodes,0,'a').nodeText,'p1')
})

test('hover picking resolves mesh parents and ignores hidden floors or robots', async () => {
  const {Group,Mesh}=await import('three')
  const {findMapTarget}=await import('../src/utils/mapInteraction.js')
  const floor=new Group(),marker=new Group(),body=new Mesh()
  floor.add(marker);marker.add(body)
  marker.userData={isWaypoint:true,waypoint:{nodeId:'mapA:p1'},mapName:'mapA'}
  assert.equal(findMapTarget(body).id,'mapA:p1')
  floor.visible=false
  assert.equal(findMapTarget(body),null)
  floor.visible=true
  marker.userData={robotId:'R1'}
  assert.deepEqual(findMapTarget(body),{kind:'robot',id:'R1'})
  marker.visible=false
  assert.equal(findMapTarget(body),null)
})

test('tooltip stays inside the canvas and portal colour matches the legend', async () => {
  const {tooltipPosition,waypointColor,NAVIGATION_COLOR,CONNECTION_COLOR}=await import('../src/utils/mapInteraction.js')
  const pos=tooltipPosition(790,590,800,600)
  assert.ok(pos.left>=8 && pos.left+248<=792)
  assert.ok(pos.top>=8 && pos.top+210<=592)
  assert.equal(waypointColor({connections:[]}),NAVIGATION_COLOR)
  assert.equal(waypointColor({connections:[{mapName:'other',waypointCode:'p1'}]}),CONNECTION_COLOR)
})
