import test from 'node:test'
import assert from 'node:assert/strict'
import {prepareBuildingSurfaces} from '../src/utils/buildingSurfaces.js'
const map=(pixels,width,height,offset={x:0,y:0,z:0})=>({mapName:'test',pgmPixels:new Uint8Array(pixels),pgmWidth:width,pgmHeight:height,mapConfig:{resolution:1,origin:[0,0]},rotation:0,offset})
function topArea(chunks) {
 let area=0
 for(const {position:p,normal:n} of chunks) for(let i=0;i<p.length;i+=9)if(n[i+1]>.9){const ax=p[i+3]-p[i],az=p[i+5]-p[i+2],bx=p[i+6]-p[i],bz=p[i+8]-p[i+2];area+=Math.abs(ax*bz-az*bx)/2}
 return area
}
test('adjacent pixels extrude a single prism without internal seams',()=>{
 const m=map([0,0,0,0],2,2);prepareBuildingSurfaces([m])
 assert.equal(topArea(m.buildingSurfaces.wall),4)
 assert.equal(m.buildingSurfaces.wall[0].position.length/9,12)
})
test('wall holes and disconnected islands preserve exact occupied area',()=>{
 const m=map([0,0,0,0,255,0,0,0,0],3,3);prepareBuildingSurfaces([m])
 assert.equal(topArea(m.buildingSurfaces.wall),8)
 assert.equal(topArea(m.buildingSurfaces.floor),1)
 const islands=map([0,255,0],3,1);prepareBuildingSurfaces([islands]);assert.equal(topArea(islands.buildingSurfaces.wall),2)
})
test('same-floor overlaps union once while different floors stay independent',()=>{
 const a=map([0,0],2,1),b=map([0,0],2,1,{x:1,y:0,z:0}),c=map([0,0],2,1,{x:0,y:0,z:3})
 prepareBuildingSurfaces([a,b,c]);assert.equal(topArea(a.buildingSurfaces.wall),3);assert.equal(b.buildingSurfaces.wall.length,0);assert.equal(topArea(c.buildingSurfaces.wall),2)
})
test('rotated overlaps and negative origins do not duplicate surfaces',()=>{
 const a=map([0,0,0,0],2,2,{x:-1,y:-1,z:0}),b=map([0,0,0,0],2,2,{x:1,y:-1,z:0});b.rotation=Math.PI/2
 prepareBuildingSurfaces([a,b]);assert.ok(Math.abs(topArea(a.buildingSurfaces.wall)-4)<1e-5)
})

test('packaged rotated submaps prepare without floating point clipping failures',async()=>{
 const {readFile}=await import('node:fs/promises'),{default:yaml}=await import('js-yaml')
 const {parsePGM}=await import('../src/utils/pgmParser.js'),{Map3DRenderer}=await import('../src/utils/map3dRenderer.js')
 const transforms=[['zone_1',0,0,0,0],['zone_2',2.0780716354431936,13.78810100840523,3.61,4.68],['zone_3',-7.931582909773221,-22.437245888340918,0,.08]]
 const maps=await Promise.all(transforms.map(async([name,x,y,z,rotation])=>{
  const bytes=await readFile(new URL(`../public/maps/${name}/${name}.pgm`,import.meta.url))
  const pgm=parsePGM(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength))
  return {mapName:name,reconstructDemoWalls:true,offset:{x,y,z},rotation,mapConfig:yaml.load(await readFile(new URL(`../public/maps/${name}/${name}.yaml`,import.meta.url),'utf8')),pgmPixels:pgm.pixels,pgmWidth:pgm.width,pgmHeight:pgm.height}
 }))
 const renderer=Object.create(Map3DRenderer.prototype);renderer.allMaps=maps
 prepareBuildingSurfaces(maps,renderer.calculateGlobalIndoorMaps())
 assert.ok(maps.some(m=>m.buildingSurfaces.wall.length))
 for(const m of maps)for(const chunk of Object.values(m.buildingSurfaces).flat())assert.ok(chunk.position.every(Number.isFinite))
})
test('cancelled surface uploads never attach stale geometry',async()=>{
 const {Map3DRenderer}=await import('../src/utils/map3dRenderer.js'),{Group}=await import('three')
 const m=map([0],1,1);prepareBuildingSurfaces([m])
 const renderer=Object.create(Map3DRenderer.prototype),group=new Group()
 const pending=renderer.renderBuilding(group,m,'wall',true);renderer.disposed=true;await pending
 assert.equal(group.children.length,0)
})

test('demo display closes small wall breaks but keeps doors and does not chain gaps',async()=>{
 const {reconstructWallMask}=await import('../src/utils/buildingSurfaces.js')
 // Gap of three pixels (15 cm) closes; a seven-pixel opening (35 cm) does not.
 const pixels=new Uint8Array(18).fill(255);for(const x of [0,4,12,16])pixels[x]=0
 const before=pixels.slice(),mask=reconstructWallMask(pixels,18,1,.05)
 assert.deepEqual([...mask.slice(0,5)],[1,1,1,1,1])
 assert.deepEqual([...mask.slice(5,12)],[0,0,0,0,0,0,0])
 assert.deepEqual([...mask.slice(12,17)],[1,1,1,1,1])
 assert.deepEqual(pixels,before)
 const ordinary=map([...pixels],18,1);ordinary.mapConfig.resolution=.05
 const demo={...ordinary,reconstructDemoWalls:true}
 prepareBuildingSurfaces([ordinary]);prepareBuildingSurfaces([demo])
 assert.ok(topArea(demo.buildingSurfaces.wall)>topArea(ordinary.buildingSurfaces.wall))
})

test('short vertical and diagonal breaks are bounded by physical distance',async()=>{
 const {reconstructWallMask}=await import('../src/utils/buildingSurfaces.js')
 const pixels=new Uint8Array(9*9).fill(255)
 for(const [x,y] of [[1,0],[1,4],[4,0],[7,3]])pixels[y*9+x]=0
 const mask=reconstructWallMask(pixels,9,9,.05)
 for(const [x,y] of [[1,1],[1,2],[1,3],[5,1],[6,2]])assert.equal(mask[y*9+x],1)
 assert.equal(mask[8*9+8],0)
})
