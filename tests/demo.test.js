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
  const nodes={a:{id:'a',locationId:'4F:P1',displayCode:'P1',floorLabel:'4F',displayFloor:4},
    b:{id:'b',locationId:'5F:P1',displayCode:'P1',floorLabel:'5F',displayFloor:5}}
  const robot={id:'R1',position:{floor:'4F',building:'mapA'}}
  const tasks=[{id:'T1',robotId:'R1',scheduleStage:'assigned',startTime:0,finishTime:20,
    timetable:[{nodeId:'a',arrival:0,depart:5},{nodeId:'b',arrival:15,depart:20}]}]
  assert.equal(describeRobotLocation(robot,tasks,nodes,3,'a').nodeText,'P1')
  const moving=describeRobotLocation(robot,tasks,nodes,10,'a')
  assert.equal(moving.inTransit,true)
  assert.equal(moving.nodeText,'4F · P1 → 5F · P1')
  assert.equal(moving.floor,4)
  const finished=describeRobotLocation(robot,tasks,nodes,21,'a')
  assert.equal(finished.floor,5)
  assert.equal(finished.label,'5F · P1')
  assert.equal(finished.taskId,null)
  assert.equal(finished.inTransit,false)
  assert.equal(describeRobotLocation(robot,[],nodes,0,'a').nodeText,'P1')
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

test('tooltip stays inside the canvas and stair colour matches the legend', async () => {
  const {tooltipPosition,waypointColor,NAVIGATION_COLOR,CONNECTION_COLOR}=await import('../src/utils/mapInteraction.js')
  const pos=tooltipPosition(790,590,800,600)
  assert.ok(pos.left>=8 && pos.left+248<=792)
  assert.ok(pos.top>=8 && pos.top+210<=592)
  assert.equal(waypointColor({connections:[]}),NAVIGATION_COLOR)
  assert.equal(waypointColor({connections:[{mapName:'other',waypointCode:'p1'}]}),NAVIGATION_COLOR)
  assert.equal(waypointColor({displayKind:'stairs'}),CONNECTION_COLOR)
})

test('packaged map names and image references use sequential zone IDs', async () => {
  const {readdir,readFile,access}=await import('node:fs/promises')
  const yaml=await import('js-yaml')
  const root=new URL('../public/maps/',import.meta.url)
  const names=(await readdir(root,{withFileTypes:true})).filter(entry=>entry.isDirectory()).map(entry=>entry.name).sort()
  assert.deepEqual(names,['stairs_1','zone_1','zone_2','zone_3'])
  for(const name of names) {
    const config=yaml.load(await readFile(new URL(`${name}/${name}.yaml`,root),'utf8'))
    assert.equal(config.image,`${name}.pgm`)
    await access(new URL(`${name}/${config.image}`,root))
    const topology=yaml.load(await readFile(new URL(`${name}/${name}_topo.yaml`,root),'utf8'))
    for(const node of topology.node_list) for(const connection of node.connect || []) {
      assert.ok(names.includes(connection.map_name),`Unknown map ${connection.map_name}`)
    }
  }
})

test('route display collapses physical aliases but retains revisits without exposing raw IDs', async () => {
  const {routeLabels,locationLabel}=await import('../src/utils/locations.js')
  const a={locationId:'4F:P1',displayCode:'P1',floorLabel:'4F'}
  const b={locationId:'4F:P2',displayCode:'P2',floorLabel:'4F'}
  const nodes={a,alias:{...a},b,legacy:{label:'zone_internal:p1'}}
  assert.deepEqual(routeLabels(['a','alias','b','a'],nodes),['4F · P1','4F · P2','4F · P1'])
  assert.equal(locationLabel(nodes,'legacy'),'Unknown location')
  assert.equal(locationLabel(nodes,'zone_internal:missing'),'Unknown location')
})

test('robot crossing internal aliases stays at one displayed point', async () => {
  const {describeRobotLocation}=await import('../src/utils/mapInteraction.js')
  const node={locationId:'4F:P1',displayCode:'P1',floorLabel:'4F',displayFloor:4}
  const nodes={a:{id:'a',...node},alias:{id:'alias',...node}}
  const task={id:'T1',robotId:'R1',scheduleStage:'assigned',startTime:0,finishTime:10,
    timetable:[{nodeId:'a',arrival:0,depart:2},{nodeId:'alias',arrival:3,depart:10}]}
  const location=describeRobotLocation({id:'R1'},[task],nodes,2.5,'a')
  assert.equal(location.inTransit,false)
  assert.equal(location.label,'4F · P1')
  assert.ok(!location.label.includes('→'))
})

test('only the canonical marker is drawn for a shared place', async () => {
  const {Group}=await import('three')
  const {Map3DRenderer}=await import('../src/utils/map3dRenderer.js')
  const renderer=Object.create(Map3DRenderer.prototype), group=new Group()
  const wp={code:'p1',nodeId:'a',x:0,y:0,z:0,renderMarker:true}
  renderer.renderWaypoints(group,{mapName:'internal',waypoints:[wp,{...wp,nodeId:'alias',renderMarker:false}]})
  assert.equal(group.getObjectByName('waypoints').children.length,1)
})

test('background campus loading keeps polling connected and resumes after refresh',async()=>{
 let job=null, completed=false
 globalThis.fetch=async(url,opts)=>{
  if(url.endsWith('scene') && opts?.method==='POST') {
   job={id:'job',sceneId:'outdoor',status:'loading',stage:'assets'}
   return response({sceneSwitch:job})
  }
  if(url.endsWith('scene')) return response({version:completed?'v2':'v1',campusId:completed?'outdoor':'demo-campus',nodes:[],maps:[]})
  return response(state(completed?'second':'first',{campusId:completed?'outdoor':'demo-campus',sceneVersion:completed?'v2':'v1',sceneSwitch:job}))
 }
 const s=store();await s.refresh();await s.switchScene('outdoor')
 assert.equal(s.busy,true);assert.equal(s.connected,true)
 await s.refresh();assert.equal(s.sessionId,'first');assert.equal(s.connected,true)
 completed=true;job={...job,status:'completed'}
 await s.refresh();assert.equal(s.sessionId,'second');assert.equal(s.busy,false)
 assert.equal(s.scene.campusId,'outdoor')
})


test('A-B-A restores original session and tasks, reset retires only that campus', async () => {
  let campus='A', resetA=false
  const sessions=()=>campus==='A' ? (resetA?'A2':'A1'):'B1'
  const scene=()=>({campusId:campus,version:'shared',nodes:[],maps:[]})
  const snapshot=()=>state(sessions(),{campusId:campus,sceneVersion:'shared',
    sceneSwitch:{status:'completed'},tasks:resetA && campus==='A'?[]:[{id:'T001',name:campus,status:'executing',startTime:0,finishTime:100}]})
  globalThis.fetch=async(url,opts)=>{
    if(url.endsWith('scene') && opts?.method==='POST') campus=JSON.parse(opts.body).sceneId
    if(url.endsWith('reset')) resetA=true
    return response(url.endsWith('scene') && opts?.method!=='POST' ? scene():snapshot())
  }
  const s=store();await s.refresh();s.selectTask('T001')
  await s.switchScene('B');assert.equal(s.scene.campusId,'B');assert.equal(s.tasks[0].name,'B')
  assert.equal(s.selectedTaskId,null)
  await s.switchScene('A');assert.equal(s.sessionId,'A1');assert.equal(s.tasks[0].name,'A')
  await s.control({},true);assert.equal(s.sessionId,'A2');assert.equal(s.tasks.length,0)
  await s.switchScene('B');assert.equal(s.sessionId,'B1');assert.equal(s.tasks[0].name,'B')
  await s.switchScene('A');assert.equal(s.sessionId,'A2');assert.equal(s.tasks.length,0)
  // A delayed pre-reset snapshot cannot return after the reset has been observed.
  globalThis.fetch=async()=>response(state('A1',{campusId:'A',sceneVersion:'shared'}))
  await s.refresh();assert.equal(s.sessionId,'A2')
})

test('late polling and mismatched scene responses cannot replace a switched campus',async()=>{
  let campus='A', finishOld, delayed=false
  const snapshot=(id)=>state(id,{campusId:id,sceneVersion:'shared'})
  globalThis.fetch=async(url,opts)=>{
    if(url.endsWith('scene') && opts?.method==='POST') {campus=JSON.parse(opts.body).sceneId;return response(snapshot(campus))}
    if(url.endsWith('scene')) return response({campusId:campus,version:'shared',nodes:[],maps:[]})
    if(delayed) return new Promise(resolve=>{finishOld=()=>resolve(response(snapshot('A')))})
    return response(snapshot(campus))
  }
  const s=store();await s.refresh();delayed=true
  const old=s.refresh();await s.switchScene('B');finishOld();await old
  assert.equal(s.scene.campusId,'B');assert.equal(s.snapshot.campusId,'B')
  // Same sceneVersion is insufficient when campus identity does not match.
  globalThis.fetch=async url=>response(url.endsWith('scene')?{campusId:'B',version:'shared'}:snapshot('C'))
  await s.refresh();assert.equal(s.scene.campusId,'B');assert.equal(s.snapshot.campusId,'B')
})

test('rapid campus selections serialize while preparation is pending',async()=>{
  let posts=0, finishSwitch
  globalThis.fetch=async(url,opts)=>{
    if(url.endsWith('scene') && opts?.method==='POST') {
      posts++
      return new Promise(resolve=>{finishSwitch=()=>resolve(response({sceneSwitch:{status:'loading',sceneId:'B'}}))})
    }
    return response(url.endsWith('scene')?{campusId:'A',version:'v1',nodes:[],maps:[]}:state('A1',{campusId:'A',sceneVersion:'v1'}))
  }
  const s=store();await s.refresh()
  const pending=s.switchScene('B');await s.switchScene('C')
  assert.equal(posts,1)
  finishSwitch();await pending
  await s.switchScene('C');assert.equal(posts,1);assert.equal(s.busy,true)
})


test('late startup scene fetch cannot replace the scene adopted by polling',async()=>{
  let reads=0, finishStartup
  const activeScene={campusId:'B',version:'vB',nodes:[],maps:[]}
  globalThis.fetch=async url=>{
    if(url.endsWith('scene')) {
      if(++reads===1) return new Promise(resolve=>{finishStartup=()=>resolve(response({campusId:'A',version:'vA',nodes:[],maps:[]}))})
      return response(activeScene)
    }
    return response(state('B1',{campusId:'B',sceneVersion:'vB'}))
  }
  const s=store(), startup=s.loadScene();await s.refresh();finishStartup()
  assert.equal((await startup).campusId,'B')
  assert.equal(s.scene.campusId,'B');assert.equal(s.snapshot.campusId,'B')
})
