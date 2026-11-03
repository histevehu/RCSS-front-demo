/** CPU-only raster preparation. No WebGL context or DOM is created in this worker. */
import {parsePGM} from './pgmParser.js'
import {Map3DRenderer} from './map3dRenderer.js'
self.onmessage=({data})=>{
 try {
  const maps=data.map(m=>{const pgm=parsePGM(m.buffer);return {...m,buffer:undefined,pgmPixels:pgm.pixels,pgmWidth:pgm.width,pgmHeight:pgm.height}})
  const context=Object.create(Map3DRenderer.prototype);context.allMaps=maps
  const indoor=context.calculateGlobalIndoorMaps()
  self.postMessage({maps,indoor},maps.map(m=>m.pgmPixels.buffer))
 } catch(e) {self.postMessage({error:e.message})}
}
