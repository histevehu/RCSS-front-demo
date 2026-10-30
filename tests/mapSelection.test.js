import test from 'node:test'
import assert from 'node:assert/strict'
import { MapClickGesture, isPointNearRoute } from '../src/utils/mapSelection.js'
const event = (x,y,extra={}) => ({clientX:x,clientY:y,pointerId:1,button:0,...extra})
test('route hit testing uses a pixel tolerance and includes endpoints',()=>{
  const segments=[[{x:10,y:20},{x:110,y:20}]]
  assert.equal(isPointNearRoute({x:60,y:27},segments),true)
  assert.equal(isPointNearRoute({x:60,y:29},segments),false)
  assert.equal(isPointNearRoute({x:5,y:20},segments),true)
  assert.equal(isPointNearRoute({x:60,y:20},[]),false)
  assert.equal(isPointNearRoute({x:10,y:20},[[{x:10,y:20},{x:10,y:20}]]),true)
})
test('clicks can clear selection but drags, right clicks and cancelled gestures cannot',()=>{
  const gesture=new MapClickGesture()
  gesture.down(event(10,20));assert.equal(gesture.up(event(12,21)),true)
  gesture.down(event(10,20));gesture.move(event(50,20));gesture.move(event(10,20));assert.equal(gesture.up(event(10,20)),false)
  gesture.down(event(10,20,{button:2}));assert.equal(gesture.up(event(10,20,{button:2})),false)
  gesture.down(event(10,20));gesture.cancel();assert.equal(gesture.up(event(10,20)),false)
})
test('pinch gestures are never mistaken for a background tap',()=>{
  const gesture=new MapClickGesture()
  gesture.down(event(10,20));gesture.down(event(40,20,{pointerId:2}))
  assert.equal(gesture.up(event(40,20,{pointerId:2})),false)
  assert.equal(gesture.up(event(10,20)),false)
  gesture.down(event(10,20));assert.equal(gesture.up(event(10,20)),true)
})
