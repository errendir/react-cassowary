import * as React from 'react'
import { storiesOf } from '@storybook/react'
//import { action } from '@storybook/addon-actions'

import AlignWithCompanions from './AlignWithCompanions'
import Chains from './Chains'
import Table from './Table'

import {
  Container, Item, Constraint, AverageConstraint, ChainConstraint, Boundary
} from '../src/index'

storiesOf('Constraint Layouts', module)
  .add('align the box followed by its companions', () => (
    <AlignWithCompanions />
  ))
  .add('create vertical or horizontal chains', () => (
    <Chains />
  ))
  .add('create table', () => (
    <Table />
  ))