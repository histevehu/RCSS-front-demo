import test from 'node:test'
import assert from 'node:assert/strict'
import {BoxGeometry,InstancedMesh,MeshStandardMaterial,Matrix4,Frustum,Matrix4 as M4,PerspectiveCamera} from 'three'
import {stabilizeBuilding} from '../src/utils/buildingMaterial.js'
test('building samples use depth and complete instance bounds without alpha sorting',()=>{
 const mesh=new InstancedMesh(new BoxGeometry(),new MeshStandardMaterial({transparent:true,opacity:.35}),2)
 mesh.setMatrixAt(0,new Matrix4().makeTranslation(100,0,0));mesh.setMatrixAt(1,new Matrix4().makeTranslation(-100,0,0))
 stabilizeBuilding(mesh)
 assert.equal(mesh.material.transparent,false);assert.equal(mesh.material.alphaToCoverage,true)
 assert.equal(mesh.material.depthWrite,true);assert.ok(mesh.boundingSphere.radius>=100)
 assert.ok(mesh.boundingBox.min.x<=-100.5);assert.ok(mesh.boundingBox.max.x>=100.5)
 const camera=new PerspectiveCamera(60,1,.1,1000);camera.position.set(100,0,10);camera.lookAt(100,0,0);camera.updateMatrixWorld()
 assert.ok(new Frustum().setFromProjectionMatrix(new M4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse)).intersectsObject(mesh))
 stabilizeBuilding(mesh,false);assert.equal(mesh.material.alphaHash,true)
})
