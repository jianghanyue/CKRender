import {CKElement, ElementProps} from "../../types/CKElement"
import {Surface} from "canvaskit-wasm"
import {Color, toSkColor} from "../../utils/SkiaElementMapping"

export interface CanvasProps extends ElementProps {
  clear?: Color | string
  rotate?: { degree: number; px?: number; py?: number }
  children?: CKElement<ElementProps>[]
}

export default class CKCanvas extends CKElement<CanvasProps> {
  readonly type = 'canvas'
  declare skSurface: Surface | undefined
  children: CKElement<ElementProps>[] = []

  constructor(props: CanvasProps) {
    super(props)
    this.children = this.props.children || []
  }

  render(parent: { skSurface: Surface }) {
    const surface = (parent.skSurface as Surface)
    this.canvas = surface.getCanvas()
    this.skSurface = surface

    this.canvas.save()
    this.drawSelf()
    this.children.forEach((child) => child.render(this))
    this.canvas.restore()
    this.skSurface.flush()
  }

  drawSelf() {
    if (!this.canvas) {
      throw Error('canvas is not find!')
    }
    const skColor = toSkColor(this.ckRoot.canvasKit, this.props.clear)
    if (skColor) {
      this.canvas.clear(skColor)
    }

    if (this.props.rotate) {
      const { degree, px, py } = this.props.rotate
      this.canvas.rotate(degree, px ?? 0, py ?? 0)
    }
  }
}
