import * as kiwi from "kiwi.js"
import * as React from 'react'

import ReactResizeDetector from 'react-resize-detector'

interface ConstraintSet {
  addConstraint(constraint: kiwi.Constraint, delay: number)
  removeConstraint(constraint: kiwi.Constraint, delay: number)
}

type Layout = {
  keyframeProgress: number
  layoutId: number
  debug: boolean
}

export type Expression = (kiwi.Variable | [number, kiwi.Variable])[] | kiwi.Variable | number

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
  layout: Layout
}

export class Container extends React.Component<ContainerProps, ContainerState> {
  constructor(props) {
    super(props)
    this.state = { layout: { keyframeProgress: 1.0, debug: !!props.debug, layoutId: 0 }, dirty: false }
  }

  private solver: kiwi.Solver = new kiwi.Solver()

  private lastKeyframeTime = Date.now()
  // Only allow for one animation at a time currently
  private nextKeyframes: number | null = null

  private constraintSet: ConstraintSet = {
    addConstraint: (constraint: kiwi.Constraint, delay: number) => {
      this.solver.addConstraint(constraint)
      this.setState({ dirty: true })
      if (delay !== 0) {
        this.lastKeyframeTime = Date.now()
        this.nextKeyframes = Date.now() + delay
      }
    },
    removeConstraint: (constraint: kiwi.Constraint, delay: number) => {
      this.solver.removeConstraint(constraint)
      this.setState({ dirty: true })
      if (delay !== 0) {
        this.lastKeyframeTime = Date.now()
        this.nextKeyframes = Date.now() + delay
      }
    }
  }

  componentDidMount() {
    this.recompute()
  }

  componentDidUpdate() {
    if (this.state.dirty) {
      this.recompute()
    } else {
      console.log("Skipping layout, no changes")
    }
  }

  private recompute = () => {
    window.requestAnimationFrame(() => {
      // console.log("recompute\n\t", this.solver._cnMap._array.map(({first,second}) => first.toString() + " " + second.toString()).join("\n\t"))
      this.solver.updateVariables()
      const keyframeProgress = this.nextKeyframes === null 
        ? 1.0
        : Math.min(1.0, (Date.now() - this.lastKeyframeTime) / (this.nextKeyframes - this.lastKeyframeTime))
      const dirty = keyframeProgress < 1.0

      console.log({ keyframeProgress })
      this.setState({ dirty, layout: {
        ...this.state.layout, layoutId: Math.random(),
        keyframeProgress,
      }})  
    })
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

interface ConstraintProps {
  expr: Expression,
  lessThan?: Expression,
  moreThan?: Expression,
  equal?: Expression,

  strength?: "strong" | "medium" | "weak"
  debug?: boolean

  animateIn?: number
  animateOut?: number
  animateUpdates?: number
}

export class Constraint extends React.PureComponent<ConstraintProps> {
  render() {
    return <ConstraintSetConsumer>
      {constraintSet => <ConstraintSetter constraintSet={constraintSet} {...this.props} />}
    </ConstraintSetConsumer>
  }
}

type ConstraintSetterProps = { constraintSet: ConstraintSet } & ConstraintProps

function expressionIterator(expression: kiwi.Expression) {
  return expression.terms().array[Symbol.iterator]()
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
    this.props.constraintSet.addConstraint(this.constraint, this.props.animateIn || 0)
  }

  componentDidUpdate(prevProps: ConstraintSetterProps) {
    const oldConstraint = this.constraint
    const newConstraint = this.createConstraint()

    const equalConstraints = areConstraintsEqual(oldConstraint, newConstraint)
    this.props.debug && !equalConstraints &&
      console.log("Constraints changed\n\t" + oldConstraint.toString() + "\n\t" + newConstraint.toString())

    // TODO: Perhaps constraintSet swap should count as remove and add of the constraint
    // with regard to the animation delays
    if (this.props.constraintSet !== prevProps.constraintSet || !equalConstraints) {
      prevProps.constraintSet.removeConstraint(oldConstraint, this.props.animateUpdates || 0)
      this.props.constraintSet.addConstraint(newConstraint, this.props.animateUpdates || 0)
      this.constraint = newConstraint
    }
  }

  componentWillUnmount() {
    this.props.constraintSet.removeConstraint(this.constraint, this.props.animateOut || 0)
  }

  createConstraint() {
    const firstDefined = (array) => 
      array.reduce((acc, val) => acc !== undefined ? acc : val, undefined)

    const makeExpression = (data) => new kiwi.Expression(...(Array.isArray(data) ? data : [data]))

    const strength =
        this.props.strength === "strong"
          ? kiwi.Strength.strong
      : this.props.strength === "medium"
          ? kiwi.Strength.medium
      : this.props.strength === "weak"
          ? kiwi.Strength.weak
      : kiwi.Strength.strong

    // console.log({ lessThan: this.props.lessThan, moreThan: this.props.moreThan, equal: this.props.equal })
    const constraint = new kiwi.Constraint(
      makeExpression([
        [1.0, makeExpression(this.props.expr)],
      ]),
        this.props.lessThan
          ? kiwi.Operator.Le 
      : this.props.moreThan 
          ? kiwi.Operator.Ge 
      : kiwi.Operator.Eq,
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
      left: new kiwi.Variable(variableName + "-left"),
      right: new kiwi.Variable(variableName + "-right"),
      top: new kiwi.Variable(variableName + "-top"),
      bottom: new kiwi.Variable(variableName + "-bottom"),
      width: new kiwi.Variable(variableName + "-width"),
      height: new kiwi.Variable(variableName + "-height"),
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
    return new kiwi.Variable(variableName)
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

type NamedVariables = { [key: string]: kiwi.Variable }
type NamedDimesions = { [key: string]: DimensionVariables }
interface LayoutElementProps<V extends NamedVariables, D extends NamedDimesions> {
  variables?: V,
  dimesions?: D,
  layout?: Layout
  children: (vars: { [T in keyof V]: number }, dims: { [T in keyof D]: any }) => React.ReactNode
}
export class LayoutElement<V extends NamedVariables, D extends NamedDimesions> extends React.Component<LayoutElementProps<V,D>> {
  render() {
    if (!this.props.layout) {
      return <LayoutConsumer>
        {(layout) => <LayoutElement layout={layout} {...this.props} />}
      </LayoutConsumer>
    }

    const vars: any = {}
    for (const [key, variable] of Object.entries(this.props.variables || {} as { [key: string]: never })) {
      vars[key] = this.findLayoutVariableValue(variable)
    }

    const dims: any = {}
    for (const [key, dimension] of Object.entries(this.props.dimesions || {} as { [key: string]: never })) {
      dims[key] = this.findLayoutDimensionValue(dimension)
    }

    return this.props.children(vars, dims)
  }

  private keyframeValuesCache: { [key: number]: number } = {}

  private findLayoutVariableValue(variable: kiwi.Variable) {
    // console.log(variable.name(), variable.value())
    const { keyframeProgress } = this.props.layout
    const nextKeyframeValue = variable.value()
    const oldKeyframeValue = this.keyframeValuesCache[variable.id()]

    if (keyframeProgress === 1.0 || oldKeyframeValue === undefined) {
      this.keyframeValuesCache[variable.id()] = nextKeyframeValue
      return nextKeyframeValue
    } else {
      return (nextKeyframeValue - oldKeyframeValue) * keyframeProgress + oldKeyframeValue
    }
  }

  private findLayoutDimensionValue(dimension: DimensionVariables) {
    return {
      left: this.findLayoutVariableValue(dimension.left),
      right: this.findLayoutVariableValue(dimension.right),
      top: this.findLayoutVariableValue(dimension.top),
      bottom: this.findLayoutVariableValue(dimension.bottom),
      width: this.findLayoutVariableValue(dimension.width),
      height: this.findLayoutVariableValue(dimension.height),
    }
  }
}

interface ItemProps {
  dimensions: DimensionVariables

  wrapContentWidth?: boolean
  wrapContentHeight?: boolean

  debug?: boolean
}

export class Item extends React.Component<ItemProps, { width: number, height: number }> {
  constructor(props) {
    super(props)
    this.state = { width: 0, height: 0 }
  }

  render() {
    return <LayoutElement dimesions={{ dimensions: this.props.dimensions }}>
      {(_vars, { dimensions }) => {
        const debugProps = this.props.debug
          ? { "data-debug-dimension": `${this.props.dimensions}` }
          : {}
        const innerStyle = this.props.wrapContentWidth || this.props.wrapContentHeight
          ? { display: "flex", width: "100%", height: "100%", pointerEvents: "initial" as "initial" }
          : { display: "contents" }
        return <div style={this.computeStyleFromLayout(dimensions)} {...debugProps}>
          <div style={innerStyle}>
            <ReactResizeDetector handleWidth handleHeight onResize={this.onResize} />
            { this.props.wrapContentWidth && <Constraint expr={this.props.dimensions.width} equal={this.state.width} /> }
            { this.props.wrapContentHeight && <Constraint expr={this.props.dimensions.height} equal={this.state.height} /> }
            {this.props.children}
          </div>
        </div>
      }}
    </LayoutElement>
  }

  private onResize = (width, height) => {
    // console.log({ width, height })
    if (this.props.wrapContentHeight || this.props.wrapContentWidth) {
      this.setState({ width, height })
    }
  }

  private computeStyleFromLayout({ left, right, top, bottom }) {
    return {
      position: "absolute" as "absolute",
      left,
      top,
      width: (!this.props.wrapContentWidth) ? right - left : undefined,
      height: (!this.props.wrapContentHeight) ? bottom - top : undefined,

      ...(this.props.debug ? {
        background: "blue",
        borderColor: "black",
        borderWidth: "3px",
        borderStyle: "dashed"
      } : {}),

      pointerEvents: "none" as "none"
    }
  }
}  

// export class Item extends React.Component<ItemProps> {
//   render() {
//     return <LayoutConsumer>
//       {(layout) => <ItemPositioned layout={layout} {...this.props} />}
//     </LayoutConsumer>
//   }
// }

// class ItemPositioned extends React.Component<{ layout: Layout, } & ItemProps, { width, height }> {
//   constructor(props) {
//     super(props)
//     this.state = { width: 0, height: 0 }
//   }

//   render() {
//     const { width, height } = this.props.dimensions
//     const debugProps = this.props.debug
//       ? { "data-debug-dimension": `${this.props.dimensions}` }
//       : {}
//     const innerStyle = this.props.wrapContentWidth || this.props.wrapContentHeight
//       ? { display: "flex", width: "100%", height: "100%", pointerEvents: "initial" as "initial" }
//       : { display: "contents" }
//     return <div style={this.computeStyleFromLayout()} {...debugProps}>
//       <div style={innerStyle}>
//         <ReactResizeDetector handleWidth handleHeight onResize={this.onResize} />
//         { this.props.wrapContentWidth && <Constraint expr={width} equal={this.state.width} /> }
//         { this.props.wrapContentHeight && <Constraint expr={height} equal={this.state.height} /> }
//         {this.props.children}
//       </div>
//     </div>
//   }

//   private onResize = (width, height) => {
//     // console.log({ width, height })
//     if (this.props.wrapContentHeight || this.props.wrapContentWidth) {
//       this.setState({ width, height })
//     }
//   }

//   private computeStyleFromLayout() {
//     const left = this.findLayoutVariableValue(this.props.dimensions.left)
//     const right = this.findLayoutVariableValue(this.props.dimensions.right)
//     const top = this.findLayoutVariableValue(this.props.dimensions.top)
//     const bottom = this.findLayoutVariableValue(this.props.dimensions.bottom)

//     return {
//       position: "absolute" as "absolute",
//       left,
//       top,
//       width: (!this.props.wrapContentWidth) ? right - left : undefined,
//       height: (!this.props.wrapContentHeight) ? bottom - top : undefined,

//       ...(this.props.debug ? {
//         background: "blue",
//         borderColor: "black",
//         borderWidth: "3px",
//         borderStyle: "dashed"
//       } : {}),

//       pointerEvents: "none" as "none"
//     }
//   }

//   private keyframeValuesCache = {}

//   private findLayoutVariableValue(variable: kiwi.Variable) {
//     // console.log(variable.name(), variable.value())
//     const { keyframeProgress } = this.props.layout
//     const nextKeyframeValue = variable.value()
//     const oldKeyframeValue = this.keyframeValuesCache[variable.id()]

//     if (keyframeProgress === 1.0 || oldKeyframeValue === undefined) {
//       this.keyframeValuesCache[variable.id()] = nextKeyframeValue
//       return nextKeyframeValue
//     } else {
//       return (nextKeyframeValue - oldKeyframeValue) * keyframeProgress + oldKeyframeValue
//     }
//   }
// }

type EvaluateSingleExpressionProps = {
  expr: Expression,
  children: (expressionValue: number) => React.ReactNode,
}
type EvaluateMultipleExpressionsProps<T extends { [key: string]: Expression }> = {
  exprs: T
  children: (values: { [K in keyof T]: number }) => React.ReactNode,
}
type EvaluateExpressionProps<T extends { [key: string]: Expression }> = 
  EvaluateSingleExpressionProps | 
  EvaluateMultipleExpressionsProps<T>
export class EvaluateExpression<T extends { [key: string]: Expression }> extends React.PureComponent<EvaluateExpressionProps<T>> {
  render() {
    if ("expr" in this.props) {
      return <EvaluateSingleExpression {...this.props} />
    } else {
      return <EvaluateMultipleExpressions {...this.props} />
    }
  }
}

// TODO: This approach to evaluating expressions can be optimized - there is no need for the separate variable and constraint
class EvaluateSingleExpression extends React.PureComponent<EvaluateSingleExpressionProps> {
  render() {
    return <VariableGenerator namePrefix="">
      {({ expressionValue }) => <>
        <Constraint expr={this.props.expr} equal={expressionValue} />
        <LayoutElement variables={{ expressionValue }}>
          {({ expressionValue }) => this.props.children(expressionValue)}
        </LayoutElement>
      </>}
    </VariableGenerator>
  }
}

class EvaluateMultipleExpressions<T extends { [key: string]: Expression }> extends React.PureComponent<EvaluateMultipleExpressionsProps<T>> {
  render() {
    return <VariableGenerator namePrefix="">
      {(generator) => {
        const variables = this.prepareVariables(generator)
        return <>
          {Object.entries(this.props.exprs).map(([name, expr]) => <Constraint
            key={name}
            expr={expr}
            equal={variables[name]}
          />)}
          <LayoutElement variables={variables}>
            {this.props.children}
          </LayoutElement>
        </>
      }}
    </VariableGenerator>
  }

  private prepareVariables(generator: { [key: string]: kiwi.Variable }) {
    const _variables: { [key: string]: kiwi.Variable } = {}
    for (const key of Object.keys(this.props.exprs)) {
      _variables[key] = generator[key]
    }
    return _variables as { [key in keyof T]: kiwi.Variable }
  }
}