import * as React from 'react'

import {
  Container, Item, Constraint, AverageConstraint, Boundary, ChainConstraint, WeightedSum
} from '../src'

const cellStyle = (hue) => ({ 
  width: "100%", height: "100%",
  background: `hsla(${hue}, 50%, 50%, 0.5)`,
  display: "flex", alignItems: "center", placeContent: "center",
  textAlign: "center" as "center",
  color: "white"
})

export default class Table extends React.Component<{}> {
  constructor(props) {
    super(props)
  }

  render() {
    return <Container>
      {({ fullScreen, c11, c12, c13, c21, c22, c23, c31, c32, c33, row1, row2, row3, col1, col2, col3 }) => <>
        <Item dimensions={fullScreen} wrapContentWidth wrapContentHeight>
          <div style={{ width: "100vw", height: "100vh", background: "hsla(280, 50%, 50%, 0.5)" }}>
          </div>
        </Item>
        <Item dimensions={c11}>
          <div style={cellStyle(250)} />
        </Item>
        <Item dimensions={c12}>
          <div style={cellStyle(270)} />
        </Item>
        <Item dimensions={c13}>
          <div style={cellStyle(280)} />
        </Item>
        <Item dimensions={c21}>
          <div style={cellStyle(290)} />
        </Item>
        <Item dimensions={c22}>
          <div style={cellStyle(300)} />
        </Item>
        <Item dimensions={c23}>
          <div style={cellStyle(310)} />
        </Item>
        <Item dimensions={c31}>
          <div style={cellStyle(320)} />
        </Item>
        <Item dimensions={c32}>
          <div style={cellStyle(330)} />
        </Item>
        <Item dimensions={c33}>
          <div style={cellStyle(340)} />
        </Item>

        <Constraint expr={fullScreen.left} equal={0} />
        <Constraint expr={fullScreen.top} equal={0} />

        {/* TODO: Add helpers for making tables like that */}
        {/* <ChainConstraint style="gapless" boundary={fullScreen} direction="row" variables={[c11, c12, c13]} />
        <ChainConstraint style="gapless" boundary={fullScreen} direction="row" variables={[c21, c22, c23]} />
        <ChainConstraint style="gapless" boundary={fullScreen} direction="row" variables={[c31, c32, c33]} /> */}

        <WeightedSum variables={[c11, c12, c13].map(v => ({ variable: v.width, weight: 1.0 }))} equal={fullScreen.width} />
        <WeightedSum variables={[c21, c22, c23].map(v => ({ variable: v.width, weight: 1.0 }))} equal={fullScreen.width} />
        <WeightedSum variables={[c31, c32, c33].map(v => ({ variable: v.width, weight: 1.0 }))} equal={fullScreen.width} />

        <WeightedSum variables={[c11, c21, c31].map(v => ({ variable: v.height, weight: 1.0 }))} equal={fullScreen.height} />
        <WeightedSum variables={[c12, c22, c32].map(v => ({ variable: v.height, weight: 1.0 }))} equal={fullScreen.height} />
        <WeightedSum variables={[c13, c23, c33].map(v => ({ variable: v.height, weight: 1.0 }))} equal={fullScreen.height} />


        <Boundary boundary={row1} dimensions={[c11, c12, c13]} top bottom left right />
        <Boundary boundary={row2} dimensions={[c21, c22, c23]} top bottom left right />
        <Boundary boundary={row3} dimensions={[c31, c32, c33]} top bottom left right />

        <Boundary boundary={col1} dimensions={[c11, c21, c31]} top bottom left right />
        <Boundary boundary={col2} dimensions={[c12, c22, c32]} top bottom left right />
        <Boundary boundary={col3} dimensions={[c13, c23, c33]} top bottom left right />

        <ChainConstraint style="gapless" boundary={fullScreen} direction="row" variables={[row1, row2, row3]} />
        <ChainConstraint style="gapless" boundary={fullScreen} direction="column" variables={[col1, col2, col3]} />
      </>}
    </Container>
  }

  private createCeneteredConstraints({ fullScreen, image }) {
    return <>
      <AverageConstraint variables={[image.left, image.right]} average={[[0.5, fullScreen.width]]} />
      <AverageConstraint variables={[image.top, image.bottom]} average={[[0.5, fullScreen.height]]} />
    </>
  }

  private createTopLeftConstraints({ fullScreen, image }) {
    return <>
      <Constraint expr={image.left} equal={fullScreen.left} />
      <Constraint expr={image.top} equal={fullScreen.top} />
    </>
  }
}