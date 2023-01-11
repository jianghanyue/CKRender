import {CKElement, ElementProps, Paint} from "../../types/CKElement"
import {Surface, Paint as SkPaint, Canvas} from "canvaskit-wasm"
import {toSkPaint} from "../../utils/SkiaElementMapping"

export interface SurfaceProps extends ElementProps {
  width: number
  height: number
  dx?: number
  dy?: number
  paint?: Paint

  children?: CKElement<ElementProps>[]
}

export default class CKSurface extends CKElement<SurfaceProps> {
  readonly type = 'canvas'
  declare canvas: Canvas | undefined
  declare skSurface: Surface
  children: CKElement<ElementProps>[] = []

  readonly defaultPaint: SkPaint
  private renderPaint?: SkPaint

  constructor(props: SurfaceProps) {
    super(props)
    this.defaultPaint = new this.ckRoot.canvasKit.Paint()
    const {width, height} = this.props
    const surface = this.ckRoot.canvasKit.MakeSurface(width, height)
    if (!surface) {
      throw Error('create surface is fail')
    }
    this.skSurface = surface
    this.children = this.props.children || []
  }

  render(parent: CKElement<ElementProps>) {
    this.canvas = parent.canvas
    console.log(parent,'surface')

    this.children.forEach((child) => child.render(this))
    this.drawSelf(this.skSurface)
  }

  drawSelf(surface: Surface) {
    const skImage = surface.makeImageSnapshot()
    const { dx, dy, paint } = this.props
    // TODO we can be smart and only recreate the paint object if the paint props have changed.
    this.renderPaint?.delete()
    this.renderPaint = toSkPaint(this.ckRoot.canvasKit, paint)
    this.canvas?.drawImage(skImage, dx ?? 0, dy ?? 0, this.renderPaint ?? this.defaultPaint)
  }
}
