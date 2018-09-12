import * as React from 'react'

import { Constraint, VariableGenerator, DimensionVariables } from './solver'
import { equal } from 'assert';

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
  style: "spread" | "spread_inside" | "packed" | "gapless" // TODO: Fix differences between spread and spread_inside, align packed
  namePrefix? : string
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
      <VariableGenerator namePrefix={`${this.props.namePrefix || ""}gap`} debug>
        {({ gap }) => {
          const outerGap = (style === "spread_inside" || style === "gapless" ? [] : [gap])
          const innerGap = (style === "packed" || style === "gapless" ? [] : [gap])
          return <>
            {/* Gap cannot be negative */}
            {/* <Constraint expr={gap} moreThan={0} strength="weak" /> */}
            <Constraint
              expr={[startExtractor(boundary), ...outerGap]}
              equal={startExtractor(variables[0])}
            />
            {
              consecutivePairs.map(([v1, v2], i) =>
                <Constraint key={i} expr={[endExtractor(v1), ...innerGap]} equal={startExtractor(v2)} />
              ) 
            }
            <Constraint
              expr={[endExtractor(variables[variables.length-1]), ...outerGap]}
              equal={endExtractor(boundary)}
            />
          </>
        }}
      </VariableGenerator>
    </>
  }
}

type WeightedSumProps = {
  variables: { variable: any, weight: number }[],
  lessThan?: any,
  moreThan?: any,
  equal?: any,

  strength?: "strong" | "medium" | "weak"
}
export class WeightedSum extends React.PureComponent<WeightedSumProps> {
  render() {
    return <>
      <VariableGenerator namePrefix="">
        {({ unit }) => <>
          <Constraint
            expr={this.props.variables.map(({ weight }) => ([ weight, unit ]))}
            lessThan={this.props.lessThan}
            moreThan={this.props.moreThan}
            equal={this.props.equal}
            strength={this.props.strength}
          />
          {this.props.variables.map(({ variable, weight }, i) => <Constraint
            key={i}
            expr={[[weight, unit]]}
            equal={variable}
          />)}
        </>}
      </VariableGenerator>

    </>
  }
}

type PlaceInsideProps = {
  innerDimension: DimensionVariables
  outerDimension: DimensionVariables
  horizontalRatio?: number
  verticalRatio?: number
  measureFrom: "sides" | "center"
}
export class PlaceInside extends React.PureComponent<PlaceInsideProps> {
  render() {
    const { innerDimension, outerDimension, horizontalRatio, verticalRatio, measureFrom } = this.props
    const topMargin = (alpha) => [[alpha, innerDimension.top], [-alpha, outerDimension.top]]
    const bottomMargin = (alpha) => [[alpha, outerDimension.bottom], [-alpha, innerDimension.bottom]]
    const leftMargin = (alpha) => [[alpha, innerDimension.left], [-alpha, outerDimension.left]]
    const rightMargin = (alpha) => [[alpha, outerDimension.right], [-alpha, innerDimension.right]]
    return <>
      {typeof horizontalRatio === "number" && measureFrom === "center" 
        ? <Constraint
            expr={[[0.5, innerDimension.left], [0.5, innerDimension.right]]}
            equal={[[1.0 - horizontalRatio, outerDimension.left], [horizontalRatio, outerDimension.right]]}
          />
        : <Constraint
            expr={leftMargin(1.0 - horizontalRatio)}
            equal={rightMargin(horizontalRatio)}
          />
      }
      {typeof verticalRatio === "number" && measureFrom === "center" 
        ? <Constraint
            expr={[[0.5, innerDimension.top], [0.5, innerDimension.bottom]]}
            equal={[[1.0 - verticalRatio, outerDimension.top], [verticalRatio, outerDimension.bottom]] }
          />
        : <Constraint
            expr={topMargin(1.0 - verticalRatio)}
            equal={bottomMargin(verticalRatio)}
          />
      }
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
