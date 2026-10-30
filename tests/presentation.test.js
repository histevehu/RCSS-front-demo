import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia,setActivePinia } from 'pinia'
import { Color,Scene,Fog,GridHelper,Mesh,BoxGeometry,MeshStandardMaterial,PerspectiveCamera,Group } from 'three'
import { messages,translate,durationLabel,publicText,errorLabel,englishLogMessage,readPreferences,preferenceKey } from '../src/utils/presentation.js'
import { useUiStore } from '../src/stores/uiStore.js'
import { Map3DRenderer } from '../src/utils/map3dRenderer.js'

test('Chinese and light defaults survive invalid, unavailable and partially corrupt storage',()=>{
  for(const raw of ['null','{broken','[]','{"locale":"invalid","theme":"blue","folds":{"robots":true,"list":"yes"}}']) {
    const prefs=readPreferences({getItem:()=>raw})
    assert.equal(prefs.locale,'zh-CN');assert.equal(prefs.theme,'light')
    assert.notEqual(prefs.folds.list,'yes')
  }
  assert.equal(readPreferences({getItem(){throw Error('denied')}}).theme,'light')
  const saved={locale:'en-US',theme:'dark',folds:{summary:true},leftHidden:true}
  assert.deepEqual(readPreferences({getItem:()=>JSON.stringify(saved)}),{...saved,rightHidden:false})
})

test('translation catalogues cover the same UI keys and safe public locations',()=>{
  assert.deepEqual(Object.keys(messages['zh-CN']).sort(),Object.keys(messages['en-US']).sort())
  assert.equal(translate('zh-CN','newTask'),'新建任务')
  assert.equal(durationLabel(62,'zh-CN'),'1分02秒')
  assert.equal(durationLabel(62,'en-US'),'1m02s')
  assert.equal(publicText('Stairs 4F–5F · S1 → Unknown location','zh-CN'),'楼梯 4F–5F · S1 → 地点不可用')
  assert.equal(errorLabel('zone_hidden: invalid request','en-US'),'Request failed. Check your connection or inputs and retry.')
})

test('locale, theme and folds persist independently of the scheduling store',()=>{
  const oldStorage=Object.getOwnPropertyDescriptor(globalThis,'localStorage'), data=new Map()
  Object.defineProperty(globalThis,'localStorage',{configurable:true,writable:true,value:{getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)}})
  try {
    setActivePinia(createPinia());const ui=useUiStore()
    ui.preferences.locale='en-US';ui.preferences.theme='dark';ui.toggleFold('robots')
    assert.equal(ui.t('newTask'),'New Task')
    assert.equal(JSON.parse(data.get(preferenceKey)).folds.robots,true)
    setActivePinia(createPinia());const restored=useUiStore()
    assert.equal(restored.preferences.locale,'en-US');assert.equal(restored.preferences.theme,'dark')
    assert.equal(restored.preferences.folds.robots,true)
  } finally { if(oldStorage===undefined) delete globalThis.localStorage;else Object.defineProperty(globalThis,'localStorage',oldStorage) }
})

test('log content remains English in both UI locales and planner diagnostics are concealed',()=>{
  const log={type:'assign',message:'T001 assigned to R1 · 10.0s execution'}
  assert.equal(englishLogMessage(log),log.message)
  assert.equal(englishLogMessage({type:'failed',taskId:'T002',message:'T002: PATH_UNREACHABLE — 内部区域 zone_private 不可达'}),'T002: No reachable path between the selected locations')
  assert.equal(englishLogMessage({type:'failed',taskId:'T003',message:'unknown private failure'}),'T003: Scheduling failed; please retry')
})

test('3D themes update the existing scene without replacing geometry, robots or camera',()=>{
  const renderer=Object.create(Map3DRenderer.prototype)
  renderer.scene=new Scene();renderer.scene.background=new Color();renderer.scene.fog=new Fog(0,100,280)
  renderer.grid=new GridHelper(100,100);renderer.scene.add(renderer.grid)
  renderer.camera=new PerspectiveCamera();renderer.camera.position.set(7,8,9)
  const wall=new Mesh(new BoxGeometry(),new MeshStandardMaterial()),floor=wall.clone()
  floor.material=wall.material.clone();wall.userData.themeRole='wall';floor.userData.themeRole='floor'
  const robot=new Group();robot.position.set(1,2,3);renderer.scene.add(wall,floor,robot)
  const geometry=wall.geometry,cam=renderer.camera.position.clone()
  renderer.setTheme('light');assert.equal(renderer.scene.background.getHex(),0xe8eff5)
  const lightWall=wall.material.color.getHex()
  renderer.setTheme('dark');assert.equal(renderer.scene.background.getHex(),0x0c1420)
  assert.notEqual(lightWall,wall.material.color.getHex());assert.equal(wall.geometry,geometry)
  assert.deepEqual(renderer.camera.position,cam);assert.deepEqual(robot.position.toArray(),[1,2,3])
})
