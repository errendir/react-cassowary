import * as React from 'react'

import { Container, Item, Constraint } from '../src'

export default class Animation extends React.Component<{}, { left: number }> {
  constructor(props) {
    super(props)
    this.state = { left: 0 }
    this.intervalId = setInterval(() => {
      this.setState({ left: (150-this.state.left) })
    }, 1000)
  }

  componentWillUnmount() {
    clearInterval(this.intervalId)
  }

  private intervalId

  render() {
    return <Container>
      {({ fullScreen, animatedBox }) => <>
        <Item dimensions={fullScreen} wrapContentWidth wrapContentHeight>
          <div style={{ width: "100vw", height: "100vh", background: "hsla(230, 50%, 50%, 0.5)" }} />
        </Item>
        <Item dimensions={animatedBox} wrapContentWidth wrapContentHeight>
          <div style={{ width: "100px", height: "100px", background: "hsla(250, 50%, 50%, 1.0)" }} />
        </Item>
        <Constraint expr={fullScreen.left} equal={0} />
        <Constraint expr={fullScreen.top} equal={0} />

        <Constraint expr={animatedBox.left} equal={this.state.left} animateUpdates={300} />
        <Constraint expr={animatedBox.top} equal={150} animateUpdates={300} />
      </>}
    </Container>
  }
}