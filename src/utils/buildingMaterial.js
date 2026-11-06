/** Legacy instances need sample coverage instead of unsorted alpha blending.
 * Continuous boundary meshes use uniform unlit colours and fixed role order;
 * their same-role blending is order independent and needs no coverage noise.
 * For instances depth is written per covered sample, retaining a see-through building without
 * changing camera limits. Alpha hashing is the fallback without MSAA support.
 */
export function stabilizeBuilding(mesh, multisampled = true) {
  mesh.material.transparent = !mesh.isInstancedMesh
  mesh.material.depthWrite = !!mesh.isInstancedMesh
  mesh.material.alphaToCoverage = !!mesh.isInstancedMesh && multisampled
  mesh.material.alphaHash = !!mesh.isInstancedMesh && !multisampled
  mesh.material.needsUpdate = true
  // Matrices are final at this point; both render culling and fit-camera need
  // complete bounds, not the unscaled unit box used to create the instances.
  if(mesh.isInstancedMesh) {mesh.computeBoundingBox();mesh.computeBoundingSphere()}
  else {mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere()}
}
