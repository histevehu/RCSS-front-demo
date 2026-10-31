import test from 'node:test'
import assert from 'node:assert/strict'
import {Group,Sprite,PerspectiveCamera} from 'three'
import {paintMapLabel,layoutWaypointLabels} from '../src/utils/mapLabels.js'

test('label paint uses the exact semantic colour in either theme',()=>{
  const context={clearRect(){},fillRect(){},fillText(text){this.text=text}}
  const canvas={width:160,height:48,getContext:()=>context}
  paintMapLabel(canvas,'4F · P1',0x008361,'light')
  assert.equal(context.fillStyle,'#008361');assert.equal(context.text,'4F · P1')
  paintMapLabel(canvas,'S1',0xa29bfe,'dark')
  assert.equal(context.fillStyle,'#a29bfe')
})
test('overlapping labels recover after moving apart without hiding their nodes',()=>{
  const camera=new PerspectiveCamera(60,1,0.1,100);camera.position.z=10;camera.updateMatrixWorld()
  const group=new Group(),nodes=new Group();nodes.name='waypoints';group.add(nodes)
  const labels=[0,1].map(()=>{const marker=new Group(),label=new Sprite();label.name='waypoint-label';label.userData.labelAspect=3;marker.add(label);nodes.add(marker);return label})
  const groups=new Map([['floor',group]])
  layoutWaypointLabels(groups,camera,900,900)
  assert.equal(labels[0].visible,true);assert.equal(labels[1].visible,false)
  assert.equal(labels[1].parent.visible,true)
  labels[1].parent.position.x=3
  layoutWaypointLabels(groups,camera,900,900)
  assert.equal(labels[1].visible,true)
})
