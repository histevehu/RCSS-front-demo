/** Exact polygon union of PGM cell footprints, followed by boundary extrusion.
 * Runs in the preparation worker. No smoothing, gap filling or pixel sampling:
 * holes and disconnected islands remain part of the original occupancy mask.
 */
import clipping from 'polygon-clipping'
import {Shape,Path,ExtrudeGeometry} from 'three'
import {mergeGridCells} from './gridRectangles.js'

/** Collect the same floor mask as the legacy renderer, before any polygon union. */
export function buildingCells(map, indoor) {
 const walls=[], floors=[]
 const {resolution,origin}=map.mapConfig, c=Math.cos(map.rotation),s=Math.sin(map.rotation)
 for(let y=0;y<map.pgmHeight;y++) for(let x=0;x<map.pgmWidth;x++) {
  if(map.pgmPixels[y*map.pgmWidth+x]<200) {walls.push({x,y});continue}
  if(indoor) {
   const lx=origin[0]+(x+.5)*resolution,ly=origin[1]+(map.pgmHeight-y-.5)*resolution
   const gx=Math.floor((map.offset.x+lx*c-ly*s-indoor.minX)/indoor.resolution)
   const gy=Math.floor((map.offset.y+lx*s+ly*c-indoor.minY)/indoor.resolution)
   if(gx<0||gx>=indoor.gridWidth||gy<0||gy>=indoor.gridHeight||indoor.indoorMap[gy*indoor.gridWidth+gx]!==0) continue
  }
  floors.push({x,y})
 }
 return {walls,floors}
}
// Normalize shared corners to micrometres before clipping; independent floating
// point expressions for rotated cell boundaries otherwise create sliver rings.
function polygons(map,cells) {
 const {resolution:r,origin:o}=map.mapConfig,c=Math.cos(map.rotation),s=Math.sin(map.rotation)
 const rects=mergeGridCells(cells).map(({x,y,width:w,height:h})=>[[[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]]])
 // Resolve all shared cell corners on the exact integer grid first. Only the
 // resulting boundary rings need a floating-point world transform.
 return union(rects).map(polygon=>polygon.map(ring=>ring.map(([px,py])=>{
  const a=o[0]+px*r,b=o[1]+(map.pgmHeight-py)*r
  return [map.offset.x+a*c-b*s,map.offset.y+a*s+b*c].map(v=>Math.round(v*1e6)/1e6)
 })))
}
/** Bounded fan-in avoids argument-count limits on large outdoor maps. */
function union(parts) {
 if(!parts.length)return []
 let batches=parts.map(p=>[p])
 while(batches.length>1) {
  const next=[]
  for(let i=0;i<batches.length;i+=64) next.push(clipping.union(...batches.slice(i,i+64)))
  batches=next
 }
 return batches[0]
}
function geometry(polys,map,height,base) {
 const c=Math.cos(map.rotation),s=Math.sin(map.rotation),chunks=[]
 for(const polygon of polys) {
  const local=polygon.map(ring=>ring.slice(0,-1).map(([x,y])=>{
   const dx=x-map.offset.x,dy=y-map.offset.y
   return [dx*c+dy*s,-dx*s+dy*c]
  }))
  const shape=new Shape();shape.moveTo(...local[0][0]);for(const p of local[0].slice(1))shape.lineTo(...p)
  for(const ring of local.slice(1)) {const hole=new Path();hole.moveTo(...ring[0]);for(const p of ring.slice(1))hole.lineTo(...p);shape.holes.push(hole)}
  // One prism per connected region: internal rectangle walls no longer exist.
  const mesh=new ExtrudeGeometry(shape,{depth:height,bevelEnabled:false,steps:1,curveSegments:1})
  mesh.rotateX(-Math.PI/2);mesh.translate(0,base,0)
  chunks.push({position:mesh.attributes.position.array,normal:mesh.attributes.normal.array})
  mesh.dispose()
 }
 // Pack small disconnected islands together, keeping upload batches bounded.
 const packed=[];let batch=[],count=0
 const flush=()=>{if(!count)return;const position=new Float32Array(count),normal=new Float32Array(count);let at=0;for(const item of batch){position.set(item.position,at);normal.set(item.normal,at);at+=item.position.length}packed.push({position,normal});batch=[];count=0}
 for(const chunk of chunks){if(count+chunk.position.length>300000)flush();batch.push(chunk);count+=chunk.position.length}flush()
 return packed
}
/** Union in world XY only within a floor; never merge geometry across floors.
 * Polygon clipping removes actual overlaps, including rotated submap seams,
 * without changing the scheduler's coordinates, edges or map assets.
 */
export function prepareBuildingSurfaces(maps,indoorMaps) {
 const floors=new Map()
 for(const map of maps) {
  map.buildingSurfaces={wall:[],floor:[]}
  if(map.mapName.toLowerCase().includes('stair'))continue
  const key=Math.round(map.offset.z*10)/10
  if(!floors.has(key))floors.set(key,[])
  floors.get(key).push(map)
 }
 for(const [key,layer] of floors) {
  const walls=[],floors=[]
  for(const map of layer){const cells=buildingCells(map,indoorMaps?.get(key));walls.push(...polygons(map,cells.walls));floors.push(...polygons(map,cells.floors))}
  const wall=union(walls),floor=union(floors)
  const owner=layer[0]
  owner.buildingSurfaces={wall:geometry(wall,owner,1.5,0),floor:geometry(wall.length&&floor.length?clipping.difference(floor,wall):floor,owner,.02,-.02)}
 }
 return maps
}
