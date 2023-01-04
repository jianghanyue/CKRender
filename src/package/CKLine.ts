import {CKElement, ElementProps, Paint} from "../types/CKElement"
import { Canvas, Paint as SkPaint } from "canvaskit-wasm"
import {toSkPaint} from "../utils/SkiaElementMapping"

export interface CKLineProps extends ElementProps {
  x1: number
  y1: number
  x2: number
  y2: number
  paint?: Paint
}

export default class CKLine extends CKElement{
  readonly type = 'canvas'
  readonly canvasKit
  declare canvas: Canvas | undefined
  props: CKLineProps

  private readonly defaultPaint: SkPaint
  private renderPaint?: SkPaint

  constructor(props: CKLineProps) {
    super()
    this.canvasKit = props.canvasKit
    this.defaultPaint = new this.canvasKit.Paint()
    this.defaultPaint.setStyle(this.canvasKit.PaintStyle.Fill)
    this.defaultPaint.setAntiAlias(true)
    this.props = props
  }

  render(parent: CKElement) {
    if (parent.type !== 'canvas' || !parent.canvas) return
    this.canvas = parent.canvas
    this.renderPaint?.delete()
    this.renderPaint = toSkPaint(this.canvasKit, this.props.paint)
    // parent.skObject?.save()
    // parent.skObject?.translate(100,100)
    this.canvas.drawLine(
      this.props.x1,
      this.props.y1,
      this.props.x2,
      this.props.y2,
      this.renderPaint ?? this.defaultPaint,
    )
    // parent.skObject?.restore()
  }
}
