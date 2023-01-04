import {CKElement, ElementProps, Paint} from "../types/CKElement"
import {Surface, Paint as SkPaint, Canvas} from "canvaskit-wasm"
import {toSkPaint} from "../utils/SkiaElementMapping"

interface Props extends ElementProps {
  width: number
  height: number
  dx?: number
  dy?: number
  paint?: Paint

  children?: CKElement[]
}

export default class CKSurface extends CKElement{
  readonly type = 'canvas'
  readonly canvasKit
  declare canvas: Canvas | undefined
  surface: Surface | undefined
  props: Props
  children: CKElement[] = []

  readonly defaultPaint: SkPaint
  private renderPaint?: SkPaint

  constructor(props: Props) {
    super()
    this.canvasKit = props.canvasKit
    this.props = props
    this.defaultPaint = new this.canvasKit.Paint()
  }

  render(parent:CKElement) {
    const {width, height} = this.props
    this.canvas = parent.canvas
    const surface = this.canvasKit.MakeSurface(width, height)
    if (!surface) {
      throw Error('create surface is fail')
    }
    this.surface = surface
    this.children.forEach((child) => child.render(this))
    this.drawSelf(surface)
  }

  drawSelf(surface: Surface) {
    const skImage = surface.makeImageSnapshot()
    const { dx, dy, paint } = this.props
    // TODO we can be smart and only recreate the paint object if the paint props have changed.
    this.renderPaint?.delete()
    this.renderPaint = toSkPaint(this.canvasKit, paint)
    console.log(this.renderPaint,'this.renderPaint')
    this.canvas?.drawImage(skImage, dx ?? 0, dy ?? 0, this.renderPaint ?? this.defaultPaint)
  }
}
