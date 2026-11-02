import test from 'node:test'
import assert from 'node:assert/strict'
import {taskProgress} from '../src/utils/taskProgress.js'

const assigned={status:'executing',scheduleStage:'assigned',duration:12,estimatedTime:40}

test('execution duration maps to progress, with bounds for delayed polling',()=>{
  assert.deepEqual(taskProgress(assigned),{phase:'execution',elapsed:12,total:40,percent:30})
  assert.equal(taskProgress({...assigned,duration:-5}).percent,0)
  assert.deepEqual(taskProgress({...assigned,duration:99}),{phase:'execution',elapsed:40,total:40,percent:100})
})

test('queued execution starts at zero rather than including pre-start waiting',()=>{
  assert.deepEqual(taskProgress({...assigned,status:'waiting',duration:25,waitSeconds:120}),
    {phase:'execution',elapsed:0,total:40,percent:0})
})

test('completed execution uses its full estimate even with an older duration sample',()=>{
  assert.deepEqual(taskProgress({...assigned,status:'completed',duration:39}),
    {phase:'execution',elapsed:40,total:40,percent:100})
})

test('scheduling and failed attempts never expose stale progress from retries',()=>{
  assert.deepEqual(taskProgress({...assigned,status:'waiting',scheduleStage:'scheduling'}),
    {phase:'scheduling',elapsed:null,total:null,percent:null})
  assert.deepEqual(taskProgress({...assigned,status:'failed',scheduleStage:'failed'}),
    {phase:'failed',elapsed:null,total:null,percent:null})
})

test('missing, zero, nonnumeric or nonfinite estimates never invent a percentage',()=>{
  for(const estimatedTime of [undefined,null,0,-1,NaN,Infinity,'40']) {
    const progress=taskProgress({...assigned,estimatedTime})
    assert.equal(progress.total,null)
    assert.equal(progress.percent,null)
    assert.equal(taskProgress({...assigned,estimatedTime,status:'completed'}).percent,null)
  }
  for(const duration of [undefined,null,NaN,Infinity,'12']) {
    assert.equal(taskProgress({...assigned,duration}).percent,null)
  }
})
