import * as React from 'react'

import { Constraint, VariableGenerator, DimensionVariables } from './solver'

type AverageConstraintProps = {
  variables: any[],
  average: any
}
export class AverageConstraint extends React.PureComponent<AverageConstraintProps> {
  render() {
    const weight = 1.0 / this.props.variables.length
    return <Constraint expr={this.props.variables.map(variable => ([weight, variable]))} moreThan={this.props.average} />
  }
}

type ChainConstraintProps = {
  variables: any[],
  boundary,
  direction: "row" | "row-reverse" | "column" | "column-reverse"
  style: "spread" | "spread_inside" | "packed" // TODO: Fix differences between spread and spread_inside, align packed
}
export class ChainConstraint extends React.PureComponent<ChainConstraintProps> {
  render() {
    const { variables: variablesRaw, boundary, direction: directionAndReverse, style } = this.props
    const { direction, reverse }= directionAndReverse.match(/(?<direction>.*)(?<reverse>-.*)?/).groups
    let startExtractor, endExtractor
    if (direction === "row") {
      startExtractor = (dimension) => dimension.left
      endExtractor = (dimension) => dimension.right
    } else {
      startExtractor = (dimension) => dimension.top
      endExtractor = (dimension) => dimension.bottom
    }
    const variables = reverse === "-reverse"
      ? variablesRaw.slice().reverse()
      : variablesRaw

    const consecutivePairs = []
    variables.forEach((_, i) => i !== 0 && consecutivePairs.push([variables[i-1], variables[i]]))
    return <>
      <VariableGenerator namePrefix="gap">
        {({ gap }) => <>
          <Constraint expr={[[1.0, startExtractor(boundary)], ...(style === "spread_inside" ? [] : [[1.0, gap]])]} equal={startExtractor(variables[0])} />
          {
            consecutivePairs.map(([v1, v2], i) =>
              <Constraint key={i} expr={[[1.0, endExtractor(v1)], ...(style === "packed" ? [] : [[1.0, gap]])]} equal={startExtractor(v2)} />
            ) 
          }
          <Constraint expr={[[1.0, endExtractor(variables[variables.length-1])], ...(style === "spread_inside" ? [] : [[1.0, gap]])]} equal={endExtractor(boundary)} />
        </>}
      </VariableGenerator>
    </>
  }
}

type BoundaryProps = {
  boundary: DimensionVariables
  dimensions: any[],
  left?: boolean
  right?: boolean
  top?: boolean
  bottom?: boolean
}
export class Boundary extends React.PureComponent<BoundaryProps> {
  render() {
    const { left, right, top, bottom, boundary, dimensions } = this.props
    return <>
      {left && dimensions.map((dimension, i) => <Constraint key={i} expr={boundary.left} lessThan={dimension.left} />)}
      {right && dimensions.map((dimension, i) => <Constraint key={i} expr={boundary.right} moreThan={dimension.right} />)}
      {top && dimensions.map((dimension, i) => <Constraint key={i} expr={boundary.top} lessThan={dimension.top} />)}
      {bottom && dimensions.map((dimension, i) => <Constraint key={i} expr={boundary.bottom} moreThan={dimension.bottom} />)}
    </>
  }
}
