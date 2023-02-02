import ArtboardLayer from "./Artboard"
import Page from "../Page"

export default class SymbolMasterLayer extends ArtboardLayer {
  constructor(options: any) {
    super(options)
  }

  render(page: Page) {
    const {skCanvas} = page.view
    skCanvas.drawRect(this.skRect, this.paint)
  }
}
