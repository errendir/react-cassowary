/// <reference path="../node_modules/kiwi.js/lib/kiwi.d.ts" />

import * as React from 'react'

//import * as Cassowary from 'cassowary'
// @ts-ignore
import * as Kiwi from 'kiwi.js'

import ReactResizeDetector from 'react-resize-detector'

interface ConstraintSet {
  addConstraint(constraint: Kiwi.Constraint)
  removeConstraint(constraint: Kiwi.Constraint)
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
    // console.log("recompute\n\t", this.solver._cnMap._array.map(({first,second}) => first.toString() + " " + second.toString()).join("\n\t"))
    this.solver.updateVariables()
    this.setState({ layout: { ...this.state.layout, data: Math.random() } })
  }

  render() {
    return (
      <ConstraintSetProvider value={this.constraintSet}>
        <LayoutProvider value={this.state.layout}>
          <DimensionGenerator namePrefix="">
            {this.props.children}
          </DimensionGenerator>
        </LayoutProvider>
      </ConstraintSetProvider>
    )
  }
}

interface ItemProps {
  animate?: boolean

  dimensions: DimensionVariables

  wrapContentWidth?: boolean
  wrapContentHeight?: boolean

  debug?: boolean

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
    const { width, height } = this.props.dimensions
    const debugProps = this.props.debug || this.props.layout.debug
      ? { "data-debug-dimension": `${this.props.dimensions}` }
      : {}
    const innerStyle = this.props.wrapContentWidth || this.props.wrapContentHeight
      ? { display: "flex", width: "100%", height: "100%", pointerEvents: "initial" as "initial" }
      : { display: "contents" }
    return <div style={this.computeStyleFromLayout()} {...debugProps}>
      <div style={innerStyle}>
        <ReactResizeDetector handleWidth handleHeight onResize={this.onResize} />
        { this.props.wrapContentWidth && <Constraint expr={width} equal={this.state.width} /> }
        { this.props.wrapContentHeight && <Constraint expr={height} equal={this.state.height} /> }
        {this.props.children}
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

      ...(this.props.debug || this.props.layout.debug ? {
        background: "blue",
        borderColor: "black",
        borderWidth: "3px",
        borderStyle: "dashed"
      } : {}),

      pointerEvents: "none" as "none"
    }
  }

  private findLayoutVariableValue(variable: kiwi.Variable) {
    // console.log(variable.name(), variable.value())
    return variable.value()
  }
}

interface ConstraintProps {
  expr: any,
  lessThan?: any,
  moreThan?: any,
  equal?: any,

  strength?: "strong" | "medium" | "weak"
  debug?: boolean
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

function areConstraintsEqual(c1, c2) {
  if (c1.op() !== c2.op()) {
    return false
  }
  if (c1.strength() !== c2.strength()) {
    return false
  }
  if (c1.expression().constant() !== c2.expression().constant()) {
    return false
  }
  const subExpression = c1.expression().minus(c2.expression())
  for (const pair of expressionIterator(subExpression)) {
    if (pair.second !== 0) {
      return false
    }
  }
  return true
}

class ConstraintSetter extends React.PureComponent<ConstraintSetterProps> {
  private constraint: kiwi.Constraint | null = null

  componentDidMount() {
    this.constraint = this.createConstraint()
    this.props.debug && console.log("Creating contraint", this.constraint.toString())
    this.props.constraintSet.addConstraint(this.constraint)
  }

  componentDidUpdate(prevProps: ConstraintSetterProps) {
    const oldConstraint = this.constraint
    const newConstraint = this.createConstraint()

    const equalConstraints = areConstraintsEqual(oldConstraint, newConstraint)
    this.props.debug && !equalConstraints &&
      console.log("Constraints changed\n\t" + oldConstraint.toString() + "\n\t" + newConstraint.toString())

    if (this.props.constraintSet !== prevProps.constraintSet || !equalConstraints) {
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

    const strength =
        this.props.strength === "strong"
          ? Kiwi.Strength.strong
      : this.props.strength === "medium"
          ? Kiwi.Strength.medium
      : this.props.strength === "weak"
          ? Kiwi.Strength.weak
      : Kiwi.Strength.strong

    // console.log({ lessThan: this.props.lessThan, moreThan: this.props.moreThan, equal: this.props.equal })
    const constraint = new Kiwi.Constraint(
      makeExpression([
        [1.0, makeExpression(this.props.expr)],
      ]),
        this.props.lessThan
          ? Kiwi.Operator.Le 
      : this.props.moreThan 
          ? Kiwi.Operator.Ge 
      : Kiwi.Operator.Eq,
      makeExpression(
        firstDefined([this.props.lessThan, this.props.moreThan, this.props.equal])
      ),
      strength
    )
    return constraint
  }

  render() { return null }
}

function printVariable(variable: kiwi.Variable) {
  return variable.value()
}

function printDimension(dimension: DimensionVariables) {
  return {
    left: printVariable(dimension.left),
    right: printVariable(dimension.right),
    top: printVariable(dimension.top),
    bottom: printVariable(dimension.bottom),
    width: printVariable(dimension.width),
    height: printVariable(dimension.height),
  }
}

type DimensionGeneratorProps = {
  namePrefix: GeneratorProps<DimensionVariables>["namePrefix"]
  children: GeneratorProps<DimensionVariables>["children"]
  debug?: boolean
}
export class DimensionGenerator extends React.PureComponent<DimensionGeneratorProps> {
  private generateDimension(variableName: string): DimensionVariables {
    return {
      left: new Kiwi.Variable(variableName + "-left"),
      right: new Kiwi.Variable(variableName + "-right"),
      top: new Kiwi.Variable(variableName + "-top"),
      bottom: new Kiwi.Variable(variableName + "-bottom"),
      width: new Kiwi.Variable(variableName + "-width"),
      height: new Kiwi.Variable(variableName + "-height"),
      [Symbol.toPrimitive as any]: (_hint) => variableName,
    }
  }

  private generateConstraints(dimension: DimensionVariables) {
    const { left, right, top, bottom, width, height } = dimension
    return <React.Fragment key={dimension + ""}>
      <Constraint expr={[[+1.0, right], [-1.0, left]]} equal={width} />
      <Constraint expr={[[+1.0, bottom], [-1.0, top]]} equal={height} />
    </React.Fragment>
  }

  render() {
    return <Generator<DimensionVariables>
      generate={this.generateDimension}
      generateConstraints={this.generateConstraints}
      namePrefix={this.props.namePrefix}
      debug={this.props.debug}
      printElement={printDimension}
    >
      {this.props.children}
    </Generator>
  }
}

type VariableGeneratorProps = {
  namePrefix: GeneratorProps<kiwi.Variable>["namePrefix"]
  children: GeneratorProps<kiwi.Variable>["children"]
  debug?: boolean
}
export class VariableGenerator extends React.PureComponent<VariableGeneratorProps> {
  private generateVariable(variableName: string) {
    return new Kiwi.Variable(variableName)
  }

  render() {
    return <Generator<kiwi.Variable> 
      generate={this.generateVariable}
      namePrefix={this.props.namePrefix}
      debug={this.props.debug}
      printElement={printVariable}
    >
      {this.props.children}
    </Generator>
  }
}

type GeneratorProps<T> = {
  generate: (name: string) => T
  generateConstraints?: (object: T) => React.ReactNode
  namePrefix: string
  children: (variables: { [key: string]: T }) => React.ReactNode
  debug?: boolean
  printElement: (t: T) => any
}

// TODO: Make sure generated variables/dimensions are cleared once they are no longer needed
class Generator<T> extends React.PureComponent<GeneratorProps<T>> {
  private oldObjects: { [key: string]: T } | null = null
  private objects: { [key: string]: T } = {}
  private objectGeneratorProxy: { [key: string]: T } = new Proxy({}, {
    get: (_obj, variableName: string): T => {
      if (this.oldObjects === null) {
        throw new Error("Generator can only be used in the render prop function")
      }
      if (!this.oldObjects[variableName]) {
        this.props.debug && console.log("generating objects", this.props.namePrefix + variableName)
        this.objects[variableName] = this.props.generate(this.props.namePrefix + variableName)
      } else {
        this.objects[variableName] = this.oldObjects[variableName]
        // this.props.debug && console.log("reusing objects", variableName)
      }
      return this.objects[variableName]
    }
  })

  private log = () => {
    if(!this.props.debug) return
    for(const [variableName, variable] of Object.entries(this.objects)) {
      console.log(this.props.namePrefix + variableName + " = ", this.props.printElement(variable))
    }
  }

  render() {
    if (typeof this.props.children !== "function") {
      throw new Error("Pass a function as a child")
    }
    const VariableConsumer = this.props.children
    this.oldObjects = this.objects
    this.objects = {}
    const children = VariableConsumer(this.objectGeneratorProxy)
    this.props.debug && console.log(
      "discarding objects",
      Object.keys(this.oldObjects).filter(variableName => !!this.objects[variableName]).join(" ")
    )
    this.oldObjects = null

    if (this.props.debug) {
      return <>
        <LayoutConsumer>
          {() => <Logger log={this.log} />}
        </LayoutConsumer>
        {children}
        {this.props.generateConstraints && Object.values(this.objects).map(this.props.generateConstraints)}
      </>
    } else {
      return <>
        {children}
        {this.props.generateConstraints && Object.values(this.objects).map(this.props.generateConstraints)}
      </>
    }
  }
}

class Logger extends React.Component<{ log: () => void }> {
  componentDidMount() { this.props.log() }
  componentDidUpdate() { this.props.log() }
  render() { return null }
}