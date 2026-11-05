import test from 'node:test'
import assert from 'node:assert/strict'
import {locationLabel,routeLabels} from '../src/utils/locations.js'
import {describeRobotLocation} from '../src/utils/mapInteraction.js'

test('internal lane points describe the business segment without adding locations',()=>{
  const nodes={a:{id:'a',locationId:'A',displayCode:'P1',floorLabel:'4F',displayFloor:4},b:{id:'b',locationId:'B',displayCode:'P2',floorLabel:'4F',displayFloor:4},lane:{id:'lane',displayKind:'lane',laneFrom:'a',laneTo:'b',displayFloor:4,floorLabel:'4F'}}
  assert.deepEqual(routeLabels(['a','lane','b'],nodes),['4F · P1','4F · P2'])
  assert.equal(locationLabel(nodes,'lane'),'4F · P1 → 4F · P2')
  const task={id:'T1',robotId:'R1',scheduleStage:'assigned',startTime:0,finishTime:10,timetable:[{nodeId:'a',arrival:0,depart:0},{nodeId:'lane',arrival:1,depart:1},{nodeId:'b',arrival:10,depart:10}]}
  assert.equal(describeRobotLocation({id:'R1'},[task],nodes,5,'a').label,'4F · P1 → 4F · P2')
})
