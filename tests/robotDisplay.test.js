import test from 'node:test'
import assert from 'node:assert/strict'
import {robotIsVisible,robotColor,mapThemes} from '../src/utils/mapTheme.js'

test('only the selected task robot overrides the global robot visibility switch',()=>{
  assert.equal(robotIsVisible(false,'R2','R2','all',4),true)
  assert.equal(robotIsVisible(false,'R1','R2','all',4),false)
  assert.equal(robotIsVisible(false,'R2',null,'all',4),false)
  assert.equal(robotIsVisible(true,'R1',null,'4',4),true)
  assert.equal(robotIsVisible(false,'R2','R2','5',4),false)
})
test('executing colour follows actual robot status in both themes',()=>{
  for(const theme of ['light','dark']) {
    assert.equal(robotColor(theme,'executing'),mapThemes[theme].executingRobot)
    assert.equal(robotColor(theme,'idle'),mapThemes[theme].robot)
    assert.notEqual(robotColor(theme,'idle'),robotColor(theme,'executing'))
  }
})
