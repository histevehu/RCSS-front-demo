import test from 'node:test'
import assert from 'node:assert/strict'
import { PerspectiveCamera, Vector3 } from 'three'
import { fitRouteCamera, isRouteInView } from '../src/utils/routeCamera.js'

for(const view of [
  {width:1440,height:1000,left:380,right:1060,top:80,bottom:900},
  {width:1024,height:800,left:330,right:694,top:80,bottom:700},
  {width:390,height:844,left:24,right:366,top:120,bottom:370},
]) test(`full multi-floor route fits the unobscured ${view.width}px viewport`,()=>{
  const camera=new PerspectiveCamera(60,view.width/view.height,.1,1000)
  const points=[new Vector3(-12,.4,8),new Vector3(-4,.5,-5),new Vector3(3,6,-10),new Vector3(6,11.3,-20)]
  const pose=fitRouteCamera(camera,points,view,15.2)
  assert.ok(pose)
  camera.position.copy(pose.position);camera.lookAt(pose.target);camera.updateMatrixWorld()
  for(const point of points) {
    const p=point.clone().project(camera),x=(p.x+1)*view.width/2,y=(1-p.y)*view.height/2
    assert.ok(x>=view.left && x<=view.right,`x=${x}`)
    assert.ok(y>=view.top && y<=view.bottom,`y=${y}`)
    assert.ok(p.z>=-1&&p.z<=1)
  }
  assert.ok(pose.position.y>=15.2)
  assert.ok(pose.distance>=5)
})
test('short, repeated-point and empty routes have finite, deterministic framing',()=>{
  const camera=new PerspectiveCamera(60,1.4,.1,1000),view={width:1400,height:1000,left:300,right:1100,top:80,bottom:900}
  assert.equal(fitRouteCamera(camera,[],view,3),null)
  const points=[new Vector3(1,.4,1),new Vector3(1,.4,1)]
  const pose=fitRouteCamera(camera,points,view,3)
  assert.ok(pose.position.toArray().every(Number.isFinite))
  assert.deepEqual(fitRouteCamera(camera,points,view,3),pose)
})

test('a short same-floor route receives a closer pose than a long route',()=>{
  const camera=new PerspectiveCamera(60,1.44,.1,1000)
  const viewport={width:1440,height:1000,left:370,right:1050,top:80,bottom:920}
  const near=fitRouteCamera(camera,[new Vector3(0,.4,0),new Vector3(2,.4,0)],viewport,4.3)
  const far=fitRouteCamera(camera,[new Vector3(0,.4,0),new Vector3(80,.4,0)],viewport,4.3)
  assert.ok(near.distance<far.distance)
})


test('route visibility checks the unobscured viewport, depth and intermediate samples',()=>{
  const camera=new PerspectiveCamera(60,1,.1,100)
  camera.position.set(0,0,10);camera.lookAt(0,0,0)
  const viewport={width:1000,height:1000,left:200,right:800,top:100,bottom:850}
  const pose=camera.position.clone(),rotation=camera.quaternion.clone()
  assert.equal(isRouteInView(camera,[new Vector3(-1,0,0),new Vector3(1,0,0)],viewport),true)
  // 可在画布内，但被左侧面板覆盖；曲线中间点越界也不能只检查端点。
  assert.equal(isRouteInView(camera,[new Vector3(-4,0,0)],viewport),false)
  assert.equal(isRouteInView(camera,[new Vector3(0,0,0),new Vector3(8,0,0),new Vector3(1,0,0)],viewport),false)
  assert.equal(isRouteInView(camera,[new Vector3(0,0,20)],viewport),false)
  assert.equal(isRouteInView(camera,[new Vector3(0,0,-200)],viewport),false)
  assert.equal(isRouteInView(camera,[],viewport),false)
  assert.deepEqual(camera.position,pose);assert.deepEqual(camera.quaternion.toArray(),rotation.toArray())
})


test('renderer leaves an already visible route alone and only requests framing outside it',async()=>{
  const {Map3DRenderer}=await import('../src/utils/map3dRenderer.js')
  const renderer=Object.create(Map3DRenderer.prototype)
  renderer.camera=new PerspectiveCamera(60,1,.1,100)
  renderer.camera.position.set(0,0,10);renderer.camera.lookAt(0,0,0)
  let calls=0
  renderer.getVisibleBounds=()=>{calls++;return null}
  const viewport={width:1000,height:1000,left:100,right:900,top:100,bottom:900}
  renderer.focusRoute([new Vector3(0,0,0)],viewport)
  assert.equal(calls,0)
  renderer.focusRoute([new Vector3(20,0,0)],viewport)
  assert.equal(calls,1)
})
