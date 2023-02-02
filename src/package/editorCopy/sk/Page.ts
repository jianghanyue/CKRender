import View from "./View"
import Base from "./base/Base"
import Layer from "./Layer"
import {formatLayer} from "./base/FormatSketchFile"
import {Page as FilePage} from '@sketch-hq/sketch-file-format-ts/dist/cjs/types'

export default class Page extends Base {
  layers: Layer[]

  pageData: FilePage

  constructor(public view: View) {
    super()
    this.pageData = this.file.contents.document.pages[view.currentPageIndex]
    if (!this.pageData) throw Error('pageData is not find!')
    this.layers = formatLayer(this.pageData.layers)
  }

  renderBackground () {
    this.view.skCanvas.clear(this.canvasKit.parseColorString('#F9F9F9'))
  }

  render () {
    const {skCanvas, skSurface, dpi} = this.view
    console.log(555)
    console.log(this.layers,'this.layers')
    this.renderBackground()
    skCanvas.save()
    skCanvas.scale(dpi, dpi)
    skCanvas.scale(0.2, 0.2)
    // skCanvas.translate(0, 0)
    // const paint = new this.canvasKit.Paint()
    // paint.setColor(this.canvasKit.YELLOW)
    // skCanvas.drawRect(this.canvasKit.LTRBRect(10,200,1000,100), paint)
    this.layers.forEach(item => {
      item.render(this)
    })
    skCanvas.restore()
    skSurface.flush()
  }
}
