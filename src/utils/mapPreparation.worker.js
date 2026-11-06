/** CPU-only raster preparation. No WebGL context or DOM is created in this worker. */
import {prepareBuildingSurfaces} from './buildingSurfaces.js'
import {parsePGM} from './pgmParser.js'
import {Map3DRenderer} from './map3dRenderer.js'
self.onmessage=({data})=>{
 try {
  const maps=data.map(m=>{const pgm=parsePGM(m.buffer);return {...m,buffer:undefined,pgmPixels:pgm.pixels,pgmWidth:pgm.width,pgmHeight:pgm.height}})
  const context=Object.create(Map3DRenderer.prototype);context.allMaps=maps
  const indoor=context.calculateGlobalIndoorMaps()
  prepareBuildingSurfaces(maps,indoor)
  const buffers=maps.flatMap(m=>[m.pgmPixels.buffer,...Object.values(m.buildingSurfaces).flat().flatMap(s=>[s.position.buffer,s.normal.buffer])])
  self.postMessage({maps,indoor},buffers)
 } catch(e) {self.postMessage({error:e.message})}
}
