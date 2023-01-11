import {CKElement, ElementProps} from "../../types/CKElement"
import CKCanvas from "./CKCanvas"
import {Canvas} from "canvaskit-wasm"

type PaintProps = ElementProps

export default class CKPaint extends CKElement<PaintProps> {
  declare type: 'paint'
  declare canvas: Canvas | undefined
  skCanvas: CKCanvas

  constructor(props: PaintProps) {
    super(props)
    this.skCanvas = new CKCanvas(props)
    // this.ckSurface.skSurface.
  }

  render(parent: this) {
    if (!parent.canvas) {
      throw Error('canvas is not find!')
    }
    this.canvas = parent.canvas
    console.log(this.skCanvas,this.props.children,'paint')
  }
}
