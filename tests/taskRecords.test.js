import test from 'node:test'
import assert from 'node:assert/strict'
import {parseTaskRecords,RECORD_FORMAT,RECORD_LIMIT} from '../src/utils/taskRecords.js'

const fixture=()=>({format:RECORD_FORMAT,version:2,replay:{inputs:[],batches:[]},exportedAt:'2026-11-05T12:00:00Z',
  scene:{campusId:'demo-campus',version:'scene-one',nodes:[{id:'a'},{id:'b'}]},
  state:{campusId:'demo-campus',sceneVersion:'scene-one',sessionId:'archived',clock:{now:10,epoch:1700000000},robots:[],logs:[{time:10,type:'failed',taskId:'T001',message:'T001: CONFLICT_UNRESOLVED'}],tasks:[{
    id:'T001',name:'Mixed batch incident',taskType:'sample',priority:'normal',batchId:'B001',robotId:null,
    status:'failed',scheduleStage:'failed',routeNodes:['a','b'],path:[],timetable:[],trajectory:[],reasonCode:'CONFLICT_UNRESOLVED',reason:'No safe plan',duration:0,estimatedTime:0,
  }]}})

test('archive round trip preserves batch, original failure and frozen simulation time',()=>{
  const record=fixture(),restored=parseTaskRecords(JSON.stringify(record))
  assert.deepEqual(restored,record)
  record.state.clock.now=50;record.state.tasks[0].reason='changed'
  assert.equal(restored.state.clock.now,10)
  assert.equal(restored.state.tasks[0].reason,'No safe plan')
  assert.equal(restored.state.logs[0].message,'T001: CONFLICT_UNRESOLVED')
})
test('archive accepts empty sessions and collecting or assigned task plans',()=>{
  const record=fixture();record.state.tasks=[]
  assert.equal(parseTaskRecords(JSON.stringify(record)).state.tasks.length,0)
  for(const stage of ['collecting','scheduling','assigned']) {
    const r=fixture();Object.assign(r.state.tasks[0],{status:'waiting',scheduleStage:stage})
    if(stage==='assigned') Object.assign(r.state.tasks[0],{robotId:'R5',startTime:15,finishTime:20,path:['a','b'],timetable:[{nodeId:'a',arrival:15,depart:16},{nodeId:'b',arrival:20,depart:20}],trajectory:[{x:0,y:0,z:0,time:15},{x:1,y:1,z:0,time:20}]})
    assert.equal(parseTaskRecords(JSON.stringify(r)).state.tasks[0].scheduleStage,stage)
  }
})
test('wrong file/version and damaged or inconsistent plans are rejected before rendering',()=>{
  assert.throws(()=>parseTaskRecords('{'),/recordsInvalid/)
  assert.throws(()=>parseTaskRecords(JSON.stringify({...fixture(),version:1})),/recordsUnsupported/)
  for(const corrupt of [
    r=>r.state.campusId='different-campus',r=>r.state.sceneVersion='different-version',
    r=>r.state.tasks.push({...r.state.tasks[0]}),r=>r.state.tasks[0].routeNodes=['a','missing'],
    r=>r.state.tasks[0].timetable=[{nodeId:'a',arrival:5,depart:1}],
    r=>r.state.tasks[0].trajectory=[{x:1,y:2,z:3,time:'now'}],
    r=>r.scene.nodes.push({id:'lane',displayKind:'lane',laneFrom:'lane',laneTo:'b'}),
    r=>r.state.logs[0].message={text:'wrong'},r=>r.state.clock.now='untrusted',
  ]) {const r=fixture();corrupt(r);assert.throws(()=>parseTaskRecords(JSON.stringify(r)),/recordsInvalid/)}
})
test('oversized records are rejected without parsing',()=>{
  assert.throws(()=>parseTaskRecords(' '.repeat(RECORD_LIMIT+1)),/recordsTooLarge/)
})
