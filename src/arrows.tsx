import * as kiwi from 'kiwi.js'
import * as React from "react"

import { EvaluateExpression, DimensionGenerator, Expression } from './solver'
import { Boundary } from './helpers';

interface ArrowProps {
  startX: Expression
  startY: Expression
  endX: Expression
  endY: Expression
}
export class Arrow extends React.PureComponent<ArrowProps> {
  render() {
    const { startX, startY, endX, endY } = this.props
    return <DimensionGenerator namePrefix="">
      {({ arrowBox }) => <>
        <Boundary boundary={arrowBox} xs={[startX, endX]} ys={[startY, endY]} />
        <EvaluateExpression exprs={{ startX, startY, endX, endY, top: arrowBox.top, left: arrowBox.left }}>
          {({ startX, startY, endX, endY, top, left }) => <>
            <svg style={{ transform: `translate(${left}px, ${top}px)`, left: 0, top: 0, width: "100%", height: "100%", position: "absolute" }}>
              <path 
                x1={startX} y1={startY} x2={endX} y2={endY}
                d={drawArrow(startX, startY, endX, endY, 3, 0.1, 0.3)}
                style={{ fill: "#ad3e1d", stroke: "#e26945", strokeWidth: "1px" }}
              />
              <text>{top}/{left}</text>
            </svg>
          </>}
        </EvaluateExpression>
      </>}
    </DimensionGenerator>
  }
}

function drawArrow(x1, y1, x2, y2, width, headLengthRatio, headWidthRatio) {
  const l = Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1))
  const headLength = l * headLengthRatio
  const headWidth = headLength * headWidthRatio
  const c = (y2-y1)/l
  const s = (x2-x1)/l
  const perpC = -s
  const perpS = c
  return `M${x1+perpS*width/2},${y1+perpC*width/2}
          L${x2+perpS*width/2-headLength*s},${y2+perpC*width/2-headLength*c}
            L${x2+perpS*(width/2+headWidth)-headLength*s},${y2+perpC*(width/2+headWidth)-headLength*c}
              L${x2},${y2}
            L${x2-perpS*(width/2+headWidth)-headLength*s},${y2-perpC*(width/2+headWidth)-headLength*c}
          L${x2-perpS*width/2-headLength*s},${y2-perpC*width/2-headLength*c}
          L${x1-perpS*width/2},${y1-perpC*width/2}
          `
}