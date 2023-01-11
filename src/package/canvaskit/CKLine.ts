import {CKElement, ElementProps, Paint} from "../../types/CKElement"
import { Canvas, Paint as SkPaint } from "canvaskit-wasm"
import {toSkPaint} from "../../utils/SkiaElementMapping"

export interface CKLineProps extends ElementProps {
  x1: number
  y1: number
  x2: number
  y2: number
  paint?: Paint
}

export default class CKLine extends CKElement<CKLineProps> {
  readonly type = 'canvas'
  declare canvas: Canvas | undefined

  private readonly defaultPaint: SkPaint
  private renderPaint?: SkPaint

  constructor(props: CKLineProps) {
    super(props)
    this.defaultPaint = new this.ckRoot.canvasKit.Paint()
    this.defaultPaint.setStyle(this.ckRoot.canvasKit.PaintStyle.Fill)
    this.defaultPaint.setAntiAlias(true)
  }

  render(parent: CKElement<ElementProps>) {
    if (parent.type !== 'canvas' || !parent.canvas) return
    this.canvas = parent.canvas
    this.renderPaint?.delete()
    this.renderPaint = toSkPaint(this.ckRoot.canvasKit, this.props.paint)
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
