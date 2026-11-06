/** Use sample coverage instead of unsorted alpha blending inside InstancedMesh.
 * Depth is written per covered sample, retaining a see-through building without
 * changing camera limits. Alpha hashing is the fallback without MSAA support.
 */
export function stabilizeBuilding(mesh, multisampled = true) {
  mesh.material.transparent = false
  mesh.material.depthWrite = true
  mesh.material.alphaToCoverage = multisampled
  mesh.material.alphaHash = !multisampled
  mesh.material.needsUpdate = true
  // Matrices are final at this point; both render culling and fit-camera need
  // complete bounds, not the unscaled unit box used to create the instances.
  mesh.computeBoundingBox()
  mesh.computeBoundingSphere()
}
