import {CKElement, ElementProps} from "../types/CKElement"
import {Canvas, Surface} from "canvaskit-wasm"
import {Color, toSkColor} from "../utils/SkiaElementMapping"

interface Props extends ElementProps {
  clear?: Color | string
  rotate?: { degree: number; px?: number; py?: number }
  children?: CKElement[]
  skObject: Canvas | Surface
}

export default class CKCanvas extends CKElement{
  readonly type = 'canvas'
  readonly canvasKit
  readonly canvas: Canvas
  readonly surface: Surface
  props: Props
  children: CKElement[] = []

  constructor(props: Props) {
    super()
    this.canvasKit = props.canvasKit
    const surface = (props.skObject as Surface)
    this.canvas = surface.getCanvas()
    this.surface = surface
    this.props = props
    // this.canvasKit.BlendMode.Plus
    this.children = props.children || []
  }

  render() {
    this.canvas.save()
    this.drawSelf()
    this.children.forEach((child) => child.render(this))
    this.canvas.restore()
    this.surface.flush()
  }

  drawSelf() {
    const skColor = toSkColor(this.canvasKit, this.props.clear)
    if (skColor) {
      this.canvas.clear(skColor)
    }

    if (this.props.rotate) {
      const { degree, px, py } = this.props.rotate
      this.canvas.rotate(degree, px ?? 0, py ?? 0)
    }
  }
}
