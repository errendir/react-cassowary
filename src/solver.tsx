/// <reference path="../node_modules/kiwi.js/lib/kiwi.d.ts" />

import * as React from 'react'

//import * as Cassowary from 'cassowary'
import * as Kiwi from 'kiwi.js'

import ReactResizeDetector from 'react-resize-detector'

interface ConstraintSet {
  addConstraint(constraint: Kiwi.Constraint)
  removeConstraint(constraint: Kiwi.Constraint)
  createVariable(variableName: string)
}

type Layout = {}

export type DimensionVariables = {
  left: kiwi.Variable,
  right: kiwi.Variable,
  top: kiwi.Variable,
  bottom: kiwi.Variable,
  width: kiwi.Variable,
  height: kiwi.Variable,
}

const { Consumer: ConstraintSetConsumer, Provider: ConstraintSetProvider } =
  React.createContext<ConstraintSet | null>(null)

const { Consumer: LayoutConsumer, Provider: LayoutProvider } =
  React.createContext<Layout | null>(null)

type ContainerProps = {
  debug?: boolean,
  children: (variables: { [key: string]: DimensionVariables }) => React.ReactNode
}
type ContainerState = {
  dirty: boolean
  layout
}

export class Container extends React.Component<ContainerProps, ContainerState> {
  constructor(props) {
    super(props)
    this.state = { layout: { debug: !!props.debug }, dirty: false }
  }

  private solver: Kiwi.Solver = new Kiwi.Solver()

  private constraintSet: ConstraintSet = {
    addConstraint: (constraint: Kiwi.Constraint) => {
      this.solver.addConstraint(constraint)
      this.setState({ dirty: true })
    },
    removeConstraint: (constraint: Kiwi.Constraint) => {
      this.solver.removeConstraint(constraint)
      this.setState({ dirty: true })
    },
    createVariable: (variableName: string) => {
      return new Kiwi.Variable(variableName)
    }
  }

  componentDidMount() {
    this.recompute()
  }

  componentDidUpdate() {
    if (this.state.dirty) {
      this.recompute()
      this.setState({ dirty: false })
    } else {
      console.log("Skipping layout, no changes")
    }
  }

  private recompute = () => {
    console.log("recompute\n\t", this.solver._cnMap._array.map(({first,second}) => first.toString() + " " + second.toString()).join("\n\t"))
    this.solver.updateVariables()
    this.setState({ layout: { ...this.state.layout, data: Math.random() } })
  }

  render() {
    if (typeof this.props.children !== "function") {
      throw new Error("Pass a function as a child")
    }
    const DimensionConsumer = this.props.children

    return <>
      <ConstraintSetProvider value={this.constraintSet}>
        <LayoutProvider value={this.state.layout}>
          <DimensionGenerator namePrefix="">
            {DimensionConsumer}
          </DimensionGenerator>
        </LayoutProvider>
      </ConstraintSetProvider>
    </>
  }
}

interface ItemProps {
  animate?: boolean

  dimensions: DimensionVariables

  wrapContentWidth?: boolean
  wrapContentHeight?: boolean
}

export class Item extends React.Component<ItemProps> {
  render() {
    return <LayoutConsumer>
      {(layout) => <ItemPositioned layout={layout} {...this.props} />}
    </LayoutConsumer>
  }
}

class ItemPositioned extends React.Component<{ layout: any, } & ItemProps, { width, height }> {
  constructor(props) {
    super(props)
    this.state = { width: 0, height: 0 }
  }

  render() {
    const { left, right, top, bottom, width, height } = this.props.dimensions
    const debugProps = this.props.layout.debug
      ? { "data-debug-dimension": `${this.props.dimensions}` }
      : {}
    return <div style={this.computeStyleFromLayout()} {...debugProps}>
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        <ReactResizeDetector handleWidth handleHeight onResize={this.onResize} />
        <Constraint expr={[[+1.0, right], [-1.0, left]]} equal={width} />
        <Constraint expr={[[+1.0, bottom], [-1.0, top]]} equal={height} />
        {this.props.children}
        { this.props.wrapContentWidth && <Constraint expr={width} equal={this.state.width} /> }
        { this.props.wrapContentHeight && <Constraint expr={height} equal={this.state.height} /> }
      </div>
    </div>
  }

  private onResize = (width, height) => {
    // console.log({ width, height })
    if (this.props.wrapContentHeight || this.props.wrapContentWidth) {
      this.setState({ width, height })
    }
  }

  computeStyleFromLayout() {
    const left = this.findLayoutVariableValue(this.props.dimensions.left)
    const right = this.findLayoutVariableValue(this.props.dimensions.right)
    const top = this.findLayoutVariableValue(this.props.dimensions.top)
    const bottom = this.findLayoutVariableValue(this.props.dimensions.bottom)

    return {
      transition: this.props.animate ? "top 1s, left 1s, width 1s, height 1s" : undefined,
      position: "absolute" as "absolute",
      left,
      top,
      width: (!this.props.wrapContentWidth) ? right - left : undefined,
      height: (!this.props.wrapContentHeight) ? bottom - top : undefined,

      ...(this.props.layout.debug ? {
        background: "blue",
        borderColor: "black",
        borderWidth: "3px",
        borderStyle: "dashed"
      } : {})
    }
  }

  private findLayoutVariableValue(variable: kiwi.Variable) {
    console.log(variable.name(), variable.value())
    return variable.value()
  }
}

interface ConstraintProps {
  expr: any,
  lessThan?: any,
  moreThan?: any,
  equal?: any,
}

export class Constraint extends React.PureComponent<ConstraintProps> {
  render() {
    return <ConstraintSetConsumer>
      {constraintSet => <ConstraintSetter constraintSet={constraintSet} {...this.props} />}
    </ConstraintSetConsumer>
  }
}

type ConstraintSetterProps = { constraintSet: ConstraintSet } & ConstraintProps

function* expressionIterator(expression) {
  const iterator = expression.terms()["__iter__"]()
  while (true) {
    const element = iterator["__next__"]()
    if (element === undefined) break
    yield element
  }
} 

function areConstraintsEqual(c1, c2, debug = false) {
  const logDiff = () => debug && console.log("Constraints changed\n\t" + c1.toString() + "\n\t" + c2.toString())
  if (c1.op() !== c2.op()) {
    logDiff()
    return false
  }
  if (c1.strength() !== c2.strength()) {
    logDiff()
    return false
  }
  if (c1.expression().constant() !== c2.expression().constant()) {
    logDiff()
    return false
  }
  const subExpression = c1.expression().minus(c2.expression())
  for (const pair of expressionIterator(subExpression)) {
    if (pair.second !== 0) {
      logDiff()
      return false
    }
  }
  return true
}

class ConstraintSetter extends React.PureComponent<ConstraintSetterProps> {
  private constraint: kiwi.Constraint | null = null

  componentDidMount() {
    this.constraint = this.createConstraint()
    console.log("Creating contraint", this.constraint.toString())
    this.props.constraintSet.addConstraint(this.constraint)
  }

  componentDidUpdate(prevProps: ConstraintSetterProps) {
    const oldConstraint = this.constraint
    const newConstraint = this.createConstraint()

    if (this.props.constraintSet !== prevProps.constraintSet || !areConstraintsEqual(oldConstraint, newConstraint, true)) {
      prevProps.constraintSet.removeConstraint(oldConstraint)
      this.props.constraintSet.addConstraint(newConstraint)
      this.constraint = newConstraint
    }
  }

  componentWillUnmount() {
    this.props.constraintSet.removeConstraint(this.constraint)
  }

  createConstraint() {
    const firstDefined = (array) => 
      array.reduce((acc, val) => acc !== undefined ? acc : val, undefined)

    const makeExpression = (data) => new Kiwi.Expression(...(Array.isArray(data) ? data : [data]))

    // console.log({ lessThan: this.props.lessThan, moreThan: this.props.moreThan, equal: this.props.equal })
    const constraint = new Kiwi.Constraint(
      makeExpression([
        [1.0, makeExpression(this.props.expr)],
      ]),
      this.props.lessThan
        ? Kiwi.Operator.Le 
        : this.props.moreThan 
          ? Kiwi.Operator.Ge : Kiwi.Operator.Eq,
      makeExpression(
        firstDefined([this.props.lessThan, this.props.moreThan, this.props.equal])
      ),
      Kiwi.Strength.strong
    )
    return constraint
  }

  render() { return null }
}

type GeneratorProps<T> = {
  generate: (name: string) => T
  namePrefix: string
  children: (variables: { [key: string]: T }) => React.ReactNode
}

export class DimensionGenerator extends React.PureComponent<{ children: any, namePrefix: string }> {
  private generateVariable(variableName: string) {
    return {
      left: new Kiwi.Variable(variableName + "-left"),
      right: new Kiwi.Variable(variableName + "-right"),
      top: new Kiwi.Variable(variableName + "-top"),
      bottom: new Kiwi.Variable(variableName + "-bottom"),
      width: new Kiwi.Variable(variableName + "-width"),
      height: new Kiwi.Variable(variableName + "-height"),
      [Symbol.toPrimitive]: (_hint) => variableName,
    }
  }

  render() {
    return <Generator<DimensionVariables> generate={this.generateVariable} namePrefix={this.props.namePrefix}>
      {this.props.children}
    </Generator>
  }
}

export class VariableGenerator extends React.PureComponent<{ children: any, namePrefix: string }> {
  private generateVariable(variableName: string) {
    return new Kiwi.Variable(variableName)
  }

  render() {
    return <Generator<DimensionVariables> generate={this.generateVariable} namePrefix={this.props.namePrefix}>
      {this.props.children}
    </Generator>
  }
}

class Generator<T> extends React.PureComponent<GeneratorProps<T>> {
  private objects: { [key: string]: T } = {}
  private objectGeneratorProxy: { [key: string]: T } = new Proxy({}, {
    get: (_obj, variableName: string): T => {
      if (!this.objects[variableName]) {
        console.log("generating objects", this.props.namePrefix + variableName)
        this.objects[variableName] = this.props.generate(this.props.namePrefix + variableName)
      } else {
        // console.log("reusing objects", variableName)
      }
      return this.objects[variableName]
    }
  })

  render() {
    if (typeof this.props.children !== "function") {
      throw new Error("Pass a function as a child")
    }
    const VariableConsumer = this.props.children

    return VariableConsumer(this.objectGeneratorProxy)
  }
}