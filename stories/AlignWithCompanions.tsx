import * as React from 'react'

import {
  Container, Item, Constraint, AverageConstraint, Boundary
} from '../src/index'

const companionStyle = { 
  width: 150, height: 50,
  background: "hsla(240, 50%, 50%, 1.0)",
  borderRadius: 5,
  display: "flex", alignItems: "center", placeContent: "center",
  textAlign: "center" as "center",
  color: "white"
}

export default class AlignWithCompanions extends React.Component<{}, { arrangement: "centered" | "topLeft" }> {
  constructor(props) {
    super(props)
    this.state = { arrangement: "centered" }
  }

  render() {
    return <Container>
      {({ fullScreen, image, comp1, comp2, comp3, imageWithCompanions }) => <>
        <Item dimensions={fullScreen} wrapContentWidth wrapContentHeight>
          <div style={{ width: "100vw", height: "100vh", background: "hsla(280, 50%, 50%, 0.5)" }}>
          </div>
        </Item>
        <Item dimensions={image}>
          <div style={{ width: "100%", height: "100%", background: "hsla(320, 50%, 50%, 0.5)" }}>
            <img style={{ width: "100%", height: "100%", objectFit: "cover" }} src="https://source.unsplash.com/random/800x600" />
          </div>
        </Item>
        <Item dimensions={imageWithCompanions}>
          <div style={{ width: "100%", height: "100%", border: "1px dashed red" }}>
          </div>
        </Item>
        <Item dimensions={comp1} wrapContentWidth wrapContentHeight>
          <div style={companionStyle}>
            This is perfectly centered
          </div>
        </Item>
        <Item dimensions={comp2} wrapContentWidth wrapContentHeight>
          <div style={{ ...companionStyle, width: companionStyle.width/2 }}>
            Right
          </div>
        </Item>
        <Item dimensions={comp3} wrapContentWidth wrapContentHeight>
          <div style={{ ...companionStyle, width: companionStyle.width*2 }}>
            Larger left companion
          </div>
        </Item>
        { this.state.arrangement === "centered" 
            ? this.createCeneteredConstraints({ fullScreen, image }) 
            : this.createTopLeftConstraints({ fullScreen, image }) 
        }

        <Constraint expr={fullScreen.left} equal={0} />
        <Constraint expr={fullScreen.top} equal={0} />
        <Constraint expr={image.width} equal={[[0.7, fullScreen.width]]} />
        <Constraint expr={image.height} equal={[[0.7, fullScreen.height]]} />

        <Boundary boundary={imageWithCompanions} dimensions={[image, comp1, comp2, comp3]} top bottom left right />

        <AverageConstraint variables={[comp1.left, comp1.right]} average={[[1.0, image.left], [0.5, image.width]]} />
        <AverageConstraint variables={[comp1.top, comp1.bottom]} average={[[1.0, image.top], [0.5, image.height]]} />

        <Constraint expr={[comp2.left, [0.5, comp2.width]]} equal={image.right} />
        <AverageConstraint variables={[comp2.top, comp2.bottom]} average={[[1.0, image.top], [0.5, image.height]]} />

        <Constraint expr={[comp3.left, [0.5, comp3.width]]} equal={image.left} />
        <AverageConstraint variables={[comp3.top, comp3.bottom]} average={[[1.0, image.top], [0.5, image.height]]} />
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