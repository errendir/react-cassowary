import * as React from 'react'
import * as ReactDOM from 'react-dom'

import { Container, Item, Constraint, AverageConstraint } from './index'

class App extends React.Component<{}, { arrangement: "centered" | "topLeft" }> {
  constructor(props) {
    super(props)
    this.state = { arrangement: "centered" }
  }

  render() {
    return <Container>
      {({ fullScreen, background, middleButton }) => <>
        <Item dimensions={fullScreen} wrapContentWidth wrapContentHeight>
          <div style={{ width: "100vw", height: "100vh", background: "hsla(280, 50%, 50%, 0.5)" }}>
          </div>
        </Item>
        <Item dimensions={background} animate>
          <div style={{ width: "100%", height: "100%", background: "hsla(320, 50%, 50%, 0.5)" }}>
          </div>
        </Item>
        <Item dimensions={middleButton} wrapContentWidth wrapContentHeight animate>
          <div
            style={{ width: 150, height: 50, background: "hsla(240, 50%, 50%, 0.5)", display: "flex", alignItems: "center", placeContent: "center", cursor: "pointer"}}
            onClick={() => this.setState(({ arrangement }) => ({ arrangement: arrangement === "centered" ? "topLeft" : "centered" }))}
          >
            <i className="material-icons" style={{ color: "white" }}>swap_horiz</i>
          </div>
        </Item>
        { this.state.arrangement === "centered" 
            ? this.createCeneteredConstraints({ fullScreen, background }) 
            : this.createTopLeftConstraints({ fullScreen, background }) 
        }
        <Constraint expr={fullScreen.left} equal={0} />
        <Constraint expr={fullScreen.top} equal={0} />
        <Constraint expr={background.width} equal={[[0.9, fullScreen.width]]} />
        <Constraint expr={background.height} equal={[[0.9, fullScreen.height]]} />
        <AverageConstraint variables={[middleButton.left, middleButton.right]} average={[[1.0, background.left], [0.5, background.width]]} />
        <AverageConstraint variables={[middleButton.top, middleButton.bottom]} average={[[1.0, background.top], [0.5, background.height]]} />
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