import * as React from 'react'

import {
  Container, Item, Constraint, Boundary, PlaceInside, DimensionGenerator
} from '../src'

const companionStyle = { 
  width: 150, height: 50,
  background: "hsla(240, 50%, 50%, 1.0)",
  borderRadius: 5,
  display: "flex", alignItems: "center", placeContent: "center",
  textAlign: "center" as "center",
  color: "white"
}

type AlignWithCompanionsProps = {
  comp1: {
    hRatio: number
    vRatio: number
    measureFrom: "center" | "sides"
  }
  showComp2: boolean
}

export default class AlignWithCompanions extends React.Component<AlignWithCompanionsProps, { arrangement: "centered" | "topLeft" }> {
  constructor(props) {
    super(props)
    this.state = { arrangement: "centered" }
  }

  render() {
    return <Container>
      {({ fullScreen, image, comp1, comp3, imageWithCompanions }) => <>
        <Item dimensions={fullScreen} wrapContentWidth wrapContentHeight>
          <div style={{ width: "100vw", height: "100vh", background: "hsla(230, 50%, 50%, 0.5)" }} />
        </Item>
        <Item dimensions={image}>
          <div
            id="image"
            style={{ width: "100%", height: "100%", background: "hsla(320, 50%, 50%, 0.5)", cursor: "poiner", pointerEvents: "initial" }}
            onClick={() => this.setState({ arrangement: "topLeft" })}
          >
            <img style={{ width: "100%", height: "100%", objectFit: "cover" }} src="https://source.unsplash.com/random/800x600" />
          </div>
        </Item>
        <Item dimensions={imageWithCompanions}>
          <div style={{ width: "100%", height: "100%", border: "1px dashed red", pointerEvents: "none" }}>
          </div>
        </Item>
        <Item dimensions={comp1} wrapContentWidth wrapContentHeight>
          <div style={companionStyle}>
            This is perfectly centered
          </div>
        </Item>
        {this.props.showComp2 && <DimensionGenerator namePrefix="">
          {({ comp2 }) => <>
            <Item dimensions={comp2} wrapContentWidth wrapContentHeight>
              <div style={{ ...companionStyle, width: companionStyle.width/2 }}>
                Right
              </div>
            </Item>
            <PlaceInside innerDimension={comp2} outerDimension={image} measureFrom="center" horizontalRatio={1.0} verticalRatio={0.4} />
            <Boundary boundary={imageWithCompanions} dimensions={[comp2]} top bottom left right />
          </>}
        </DimensionGenerator>}
        <Item dimensions={comp3} wrapContentWidth wrapContentHeight>
          <div style={{ ...companionStyle, width: companionStyle.width*2 }}>
            Larger left companion
          </div>
        </Item>
        <PlaceInside
          innerDimension={image}
          outerDimension={fullScreen}
          measureFrom="sides"
          horizontalRatio={this.state.arrangement === "centered" ? 0.5 : 0.0}
          verticalRatio={this.state.arrangement === "centered" ? 0.5 : 0.0}
        />

        <Constraint expr={fullScreen.left} equal={0} />
        <Constraint expr={fullScreen.top} equal={0} />
        <Constraint expr={image.width} equal={[[0.7, fullScreen.width]]} />
        <Constraint expr={image.height} equal={[[0.7, fullScreen.height]]} />

        <Boundary boundary={imageWithCompanions} dimensions={[image, comp1, comp3]} top bottom left right />

        <PlaceInside innerDimension={comp1} outerDimension={image}
          measureFrom={this.props.comp1.measureFrom}
          horizontalRatio={this.props.comp1.hRatio}
          verticalRatio={this.props.comp1.vRatio}
        />
        <PlaceInside innerDimension={comp3} outerDimension={image} measureFrom="center" horizontalRatio={0.05} verticalRatio={0.6} />
      </>}
    </Container>
  }
}