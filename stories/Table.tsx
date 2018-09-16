import * as React from 'react'

import {
  Container, Item, Constraint, AverageConstraint, Boundary, ChainConstraint, WeightedSum, ConstraintMany, PlaceInside, Table
} from '../src'

const cellStyle = (hue) => ({ 
  width: "100%", height: "100%",
  background: `hsla(${hue}, 50%, 50%, 0.5)`,
  display: "flex", alignItems: "center", placeContent: "center",
  textAlign: "center" as "center",
  color: "white"
})

export default class TableDemo extends React.Component<{}, { mode: number }> {
  constructor(props) {
    super(props)
    this.state = { mode: 0 }
  }

  private interval = setInterval(() => {
    this.setState({ mode: 1-this.state.mode })
  }, 1000)

  componentWillUnmount() {
    clearInterval(this.interval)
  }

  render() {
    return <Container>
      {({ fullScreen }) => <>
        <Item dimensions={fullScreen} wrapContentWidth wrapContentHeight>
          <div style={{ width: "100vw", height: "100vh", background: "hsla(230, 50%, 50%, 0.5)" }} />
        </Item>
        <Constraint expr={fullScreen.left} equal={0} />
        <Constraint expr={fullScreen.top} equal={0} />
        <Table rows={3} cols={3} boundary={fullScreen}>
          {([row1, row2, row3], [col1, col2, col3], cells) => <>
            {this.renderCells(cells)}
            {this.state.mode === 0
              ? <>
                <Constraint animateOut={300} expr={row2.dimension.height} equal={[[2.0, row1.dimension.height]]} />
                <Constraint animateOut={300} expr={row3.dimension.height} equal={[[2.0, row2.dimension.height]]} />

                <Constraint animateOut={300} expr={col2.dimension.width} equal={[[2.0, col1.dimension.width]]} />
                <Constraint animateOut={300} expr={col3.dimension.width} equal={[[2.0, col2.dimension.width]]} />
              </>
              : <>
                <Constraint animateOut={300} expr={cells.c11.width} equal={[[5.0, cells.c11.height]]} />
                <PlaceInside innerDimension={cells.c11} outerDimension={fullScreen} horizontalRatio={0.5} verticalRatio={0.5} measureFrom="sides" />

                <Constraint animateOut={300} expr={row3.dimension.height} equal={row1.dimension.height} />

                <Constraint animateOut={300} expr={col3.dimension.width} equal={col1.dimension.width} />
                <Constraint animateOut={300} expr={col3.dimension.width} equal={col2.dimension.width} />
              </>}
          </>}
        </Table>
      </>}
    </Container>
  }

  private renderCells({ c00, c01, c02, c10, c11, c12, c20, c21, c22 }: any) {
    return <>
      <Item dimensions={c00}>
        <div style={cellStyle(150)} />
      </Item>
      <Item dimensions={c01}>
        <div style={cellStyle(170)} />
      </Item>
      <Item dimensions={c02}>
        <div style={cellStyle(190)} />
      </Item>
      <Item dimensions={c10}>
        <div style={cellStyle(210)} />
      </Item>
      <Item dimensions={c11}>
        <div style={cellStyle(230)} />
      </Item>
      <Item dimensions={c12}>
        <div style={cellStyle(250)} />
      </Item>
      <Item dimensions={c20}>
        <div style={cellStyle(270)} />
      </Item>
      <Item dimensions={c21}>
        <div style={cellStyle(290)} />
      </Item>
      <Item dimensions={c22}>
        <div style={cellStyle(310)} />
      </Item>
    </>
  }
}