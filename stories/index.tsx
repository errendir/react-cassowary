import * as React from 'react'
import { storiesOf } from '@storybook/react'
import { number, select, withKnobs } from '@storybook/addon-knobs';
//import { action } from '@storybook/addon-actions'

import AlignWithCompanions from './AlignWithCompanions'
import Chains from './Chains'
import Table from './Table'

import {
  Container, Item, Constraint, AverageConstraint, ChainConstraint, Boundary
} from '../src/index'

storiesOf('Constraint Layouts', module)
  .addDecorator(withKnobs)
  .add('align the box followed by its companions', () => {
    const comp1HRatio = number("Horizontal ratio", 0.5, {
        range: true,
        min: 0.0,
        max: 1.0,
        step: 0.01,
    })
    const comp1VRatio = number("Vertical ratio", 0.5, {
      range: true,
      min: 0.0,
      max: 1.0,
      step: 0.01,
    })
    const comp1MeasureFrom = select("Measure from", { "center": "center", "sides": "sides" }, "center")
    return <AlignWithCompanions comp1={{ hRatio: comp1HRatio, vRatio: comp1VRatio, measureFrom: comp1MeasureFrom }} />
  })
  .add('create vertical or horizontal chains', () => (
    <Chains />
  ))
  .add('create table', () => (
    <Table />
  ))