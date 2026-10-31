import test from 'node:test'
import assert from 'node:assert/strict'
import { Group } from 'three'
import { Map3DRenderer } from '../src/utils/map3dRenderer.js'
import { highlightTopologyPath } from '../src/utils/topologyHighlight.js'

function scene() {
  const renderer=Object.create(Map3DRenderer.prototype),group=new Group()
  const waypoints=['a','b','c'].map((code,i)=>({code,nodeId:code,x:i*3,y:0,z:0,relatedPoints:i<2 ? [String.fromCharCode(98+i)]:[]}))
  renderer.renderTopoLines(group,{waypoints});group.position.set(10,2,5)
  return {group,groups:new Map([['map',group]]),lines:group.getObjectByName('topoLines').children}
}
test('selection recolours the same topology mesh without replacing or thickening geometry',()=>{
  const {groups,lines}=scene(),geometry=lines[0].geometry,material=lines[0].material
  const segments=highlightTopologyPath(groups,['b','a'],0xfacc15)
  assert.equal(lines[0].geometry,geometry);assert.equal(lines[0].material,material)
  assert.equal(geometry.parameters.radius,.05);assert.equal(material.color.getHex(),0xfacc15)
  // 满不透明度仍使用透明排序队列，保证路线晚于半透明建筑绘制。
  assert.equal(material.transparent,true);assert.equal(material.opacity,1)
  assert.equal(lines[1].material.color.getHex(),0x74b9ff)
  assert.equal(segments.length,16);assert.equal(segments[0][0].x,10)
})
test('changing tasks, hiding a floor and deselection restore original edge styles',()=>{
  const {groups,lines,group}=scene()
  highlightTopologyPath(groups,['a','b'],0xfacc15)
  highlightTopologyPath(groups,['b','c'],0xffdf00)
  assert.equal(lines[0].material.color.getHex(),0x74b9ff)
  assert.equal(lines[1].material.color.getHex(),0xffdf00)
  group.visible=false;assert.equal(highlightTopologyPath(groups,['b','c'],0xffdf00).length,0)
  group.visible=true;highlightTopologyPath(groups,[],0xfacc15)
  for(const line of lines) {
    assert.equal(line.material.color.getHex(),0x74b9ff)
    assert.equal(line.material.opacity,.8);assert.equal(line.material.transparent,true)
    assert.equal(line.material.depthTest,true);assert.equal(line.renderOrder,0)
  }
})
