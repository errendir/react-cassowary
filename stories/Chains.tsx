import * as React from 'react'

import {
  Container, Item, Constraint, AverageConstraint, Boundary, ChainConstraint, WeightedSum, PlaceInside
} from '../src/index'

export default class Chains extends React.Component<{}> {
  render() {
    return <Container>
      {({ fullScreen, background, middleButton, firstRow, secondRow, thirdRow, fourthRow, box1, box2, box3, box4, box5, box6, box7, box8, box9, box10, box11, box12, box13 }) => <>
        <Item dimensions={fullScreen} wrapContentWidth wrapContentHeight>
          <div style={{ width: "100vw", height: "100vh", background: "hsla(280, 50%, 50%, 0.5)" }}>
          </div>
        </Item>
        <Item dimensions={background}>
          <div style={{ width: "100%", height: "100%", background: "hsla(320, 50%, 50%, 0.5)" }}>
          </div>
        </Item>
        { this.renderRow({ style: "spread", boundary: background, wrapW: true }, box1, box2, box3) }
        { this.renderRow({ style: "spread_inside", boundary: background, wrapW: true }, box4, box5, box6) }
        { this.renderRow({ style: "packed", boundary: background, wrapW: true }, box7, box8, box9) }
        { this.renderRow({ style: "gapless", boundary: background, wrapW: false }, box10, box11, box12, box13) }

        {/* Constraint {first,second,third}Row dimensions to envelop boxes in corresponding rows */}
        <Boundary boundary={firstRow} dimensions={[box1, box2, box3]} top left right bottom />
        <Boundary boundary={secondRow} dimensions={[box4, box5, box6]} top left right bottom />
        <Boundary boundary={thirdRow} dimensions={[box7, box8, box9]} top left right bottom />
        <Boundary boundary={fourthRow} dimensions={[box10, box11, box12, box13]} top left right bottom />

        <ChainConstraint direction="column" style="spread" boundary={background} variables={[firstRow, secondRow, thirdRow, fourthRow]}  />

        <Constraint expr={fullScreen.left} equal={0} />
        <Constraint expr={fullScreen.top} equal={0} />

        <Constraint expr={background.width} equal={[[0.9, fullScreen.width]]} />
        <Constraint expr={background.height} equal={[[0.9, fullScreen.height]]} />
        <PlaceInside innerDimension={background} outerDimension={fullScreen} measureFrom="center" horizontalRatio={0.5} verticalRatio={0.5} />

        <AverageConstraint variables={[middleButton.left, middleButton.right]} average={[[1.0, background.left], [0.5, background.width]]} />
        <AverageConstraint variables={[middleButton.top, middleButton.bottom]} average={[[1.0, background.top], [0.5, background.height]]} />
      </>}
    </Container>
  }

  private renderRow({ style, boundary, wrapW }, ...boxes) {
    return <>
      {boxes.map((box, i) => <Item dimensions={box} wrapContentWidth={!!wrapW} wrapContentHeight>
        <div style={{
          minWidth: "20px", minHeight: "20px",
          width: "100%", height: "100%",
          background: "hsla(220, 80%, 50%, 1.0)", color: "white", textAlign: "center", padding: 20,
          border: "1px dashed blue"
        }}>
          {i}
        </div>
      </Item>)}
      <ChainConstraint direction="row" namePrefix="row" style={style} boundary={boundary} variables={boxes}  />
      { style === "gapless" && <WeightedSum variables={boxes.map(box => ({ variable: box.width, weight: 1.0 }))} equal={boundary.width} />}
    </>
  }

  private createCeneteredConstraints({ fullScreen, background }) {
    return <>
      <AverageConstraint variables={[background.left, background.right]} average={[[0.5, fullScreen.width]]} />
      <AverageConstraint variables={[background.top, background.bottom]} average={[[0.5, fullScreen.height]]} />
    </>
  }

  private createTopLeftConstraints({ fullScreen, background }) {
    return <>
      <Constraint expr={background.left} equal={fullScreen.left} />
      <Constraint expr={background.top} equal={fullScreen.top} />
    </>
  }
}