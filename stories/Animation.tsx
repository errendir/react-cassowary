import * as React from 'react'

import { Container, Item, Constraint } from '../src'

export default class Animation extends React.Component<{}> {
  render() {
    return <Container>
      {({ fullScreen }) => <>
        <Item dimensions={fullScreen} wrapContentWidth wrapContentHeight>
          <div style={{ width: "100vw", height: "100vh", background: "hsla(230, 50%, 50%, 0.5)" }} />
        </Item>
        <Constraint expr={fullScreen.left} equal={0} />
        <Constraint expr={fullScreen.top} equal={0} />
      </>}
    </Container>
  }
}