import Layer, {WrapLayer} from "../Layer"
import {Artboard} from "@sketch-hq/sketch-file-format-ts/dist/cjs/types"
import {Color, Paint, Rect} from "canvaskit-wasm"
import Page from "../Page"
import {formatLayer} from "../base/FormatSketchFile"

/**
 * Layer子类
 */
export default class ArtboardLayer extends WrapLayer {
  backgroundColor: Color
  layers: (Layer | ArtboardLayer)[] = []

  paint: Paint

  skRect: Rect

  constructor(public options: Artboard) {
    super(options)
    this.backgroundColor = options.hasBackgroundColor ? this.toSkColor(options.backgroundColor) as Color : this.canvasKit.WHITE
    this.paint = this.createColorPaint(this.backgroundColor)

    this.skRect = this.frame.onlySize.toSk()
    this.layers = formatLayer(options.layers)
  }

  render(page: Page) {
    const {skCanvas} = page.view
    console.log(this.options.backgroundColor)

    skCanvas.drawRect(this.skRect, this.paint)

    skCanvas.save()
    skCanvas.clipRect(this.skRect, this.canvasKit.ClipOp.Intersect, true)
    this.renderLayers(page, this.layers)
    skCanvas.restore()
  }

}
