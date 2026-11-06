import test from 'node:test'
import assert from 'node:assert/strict'
import {mergeGridCells} from '../src/utils/gridRectangles.js'
import {taskAtTime} from '../src/utils/demo.js'

test('merged map rectangles preserve every occupied cell, holes and negative origins',()=>{
  const cells=[]
  for(let y=-3;y<15;y++)for(let x=-5;x<20;x++)if((x*y)%7!==0)cells.push({x,y})
  const result=mergeGridCells(cells),expanded=new Set()
  for(const rect of result)for(let y=rect.y;y<rect.y+rect.height;y++)for(let x=rect.x;x<rect.x+rect.width;x++) {
    const key=`${x}:${y}`;assert.equal(expanded.has(key),false);expanded.add(key)
  }
  assert.deepEqual(expanded,new Set(cells.map(c=>`${c.x}:${c.y}`)))
  assert.deepEqual(mergeGridCells([]),[])
  assert.deepEqual(mergeGridCells([{x:0,y:0},{x:1,y:0},{x:0,y:1},{x:1,y:1}]),[{x:0,y:0,width:2,height:2}])
})
test('indexed robot task lookup retains queued, boundary and completed semantics',()=>{
  const tasks=Array.from({length:1000},(_,i)=>({id:i,startTime:i*10,finishTime:i*10+5}))
  assert.equal(taskAtTime(tasks,-1),undefined)
  for(const time of [0,5,9,10,5001,100000])assert.equal(taskAtTime(tasks,time),tasks.filter(t=>t.startTime<=time).at(-1))
})
