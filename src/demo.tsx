import * as React from 'react'
import * as ReactDOM from 'react-dom'

import {
  Container, Item, Constraint, AverageConstraint, ChainConstraint, Boundary
} from './index'

class App extends React.Component<{}, { arrangement: "centered" | "topLeft" }> {
  constructor(props) {
    super(props)
    this.state = { arrangement: "centered" }
  }

  render() {
    return <Container>
      {({ fullScreen, background, middleButton, firstRow, secondRow, box1, box2, box3, box4, box5, box6, box7, box8, box9 }) => <>
        <Item dimensions={fullScreen} wrapContentWidth wrapContentHeight>
          <div style={{ width: "100vw", height: "100vh", background: "hsla(280, 50%, 50%, 0.5)" }}>
          </div>
        </Item>
        <Item dimensions={background}>
          <div style={{ width: "100%", height: "100%", background: "hsla(320, 50%, 50%, 0.5)" }}>
          </div>
        </Item>
        <Item dimensions={middleButton} wrapContentWidth wrapContentHeight>
          <div
            style={{ width: 150, height: 50, background: "hsla(240, 50%, 50%, 0.5)", display: "flex", alignItems: "center", placeContent: "center", cursor: "pointer"}}
            onClick={() => this.setState(({ arrangement }) => ({ arrangement: arrangement === "centered" ? "topLeft" : "centered" }))}
          >
            <i className="material-icons" style={{ color: "white", fontSize: "3em" }}>swap_horiz</i>
          </div>
        </Item>
        { this.renderRow({ style: "spread", boundary: background }, box1, box2, box3) }
        { this.renderRow({ style: "spread_inside", boundary: background }, box4, box5, box6) }
        { this.renderRow({ style: "packed", boundary: background }, box7, box8, box9) }
        { this.state.arrangement === "centered" 
            ? this.createCeneteredConstraints({ fullScreen, background }) 
            : this.createTopLeftConstraints({ fullScreen, background }) 
        }

        <Constraint expr={box1.top} moreThan={background.top} />
        <Constraint expr={box2.top} moreThan={background.top} />
        <Constraint expr={box3.top} moreThan={background.top} />

        <Boundary boundary={firstRow} dimensions={[box1, box2, box3]} top left right bottom />

        <Constraint expr={box4.top} moreThan={firstRow.bottom} />
        <Constraint expr={box5.top} moreThan={firstRow.bottom} />
        <Constraint expr={box6.top} moreThan={firstRow.bottom} />

        <Boundary boundary={secondRow} dimensions={[box4, box5, box6]} top left right bottom />

        <Constraint expr={box7.top} moreThan={secondRow.bottom} />
        <Constraint expr={box8.top} moreThan={secondRow.bottom} />
        <Constraint expr={box9.top} moreThan={secondRow.bottom} />

        <Constraint expr={fullScreen.left} equal={0} />
        <Constraint expr={fullScreen.top} equal={0} />
        <Constraint expr={background.width} equal={[[0.9, fullScreen.width]]} />
        <Constraint expr={background.height} equal={[[0.9, fullScreen.height]]} />

        <AverageConstraint variables={[middleButton.left, middleButton.right]} average={[[1.0, background.left], [0.5, background.width]]} />
        <AverageConstraint variables={[middleButton.top, middleButton.bottom]} average={[[1.0, background.top], [0.5, background.height]]} />

        {/* Ensure halfs are equal */}
        {/* <ChainConstraint direction="column" style="packed" boundary={background} variables={[topHalf, bottomHalf]}  />
        <Constraint expr={topHalf.height} equal={bottomHalf.height} />
        <Constraint expr={[[1.0, topHalf.height], [1.0, bottomHalf.height]]} equal={background.height} />
        <Constraint expr={topHalf.top} equal={background.top} /> */}

        {/* <Constraint>
          <LineraExpression>
            <ScaledVariable scale={0.5}>leftSide</ScaledVariable>
            <ScaledVariable scale={0.5}>rightSide</ScaledVariable>
          </LineraExpression>
          <MoreThan>{250}</To>
        </Constraint> */}
      </>}
    </Container>
  }

  private renderRow({ style, boundary }, ...boxes) {
    return <>
      {boxes.map((box, i) => <Item dimensions={box} wrapContentWidth wrapContentHeight>
        <div style={{ minWidth: "20px", minHeight: "20px", background: "hsla(50, 50%, 50%, 0.5)" }}>
          {i}
        </div>
      </Item>)}
      <ChainConstraint direction="row" style={style} boundary={boundary} variables={boxes}  />
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

ReactDOM.render(
  <App />,
  document.querySelector("#root")
)