import Layer from "../Layer"
import {
 Page
} from "@sketch-hq/sketch-file-format-ts/dist/cjs/types"
import SymbolMasterLayer from "../layers/SymbolMaster"
import ArtboardLayer from "../layers/Artboard"
import SymbolInstance from "../layers/SymbolInstance"

// export const formatPage = (pageIndex: number) => {
//   const pageData = this.file.contents.document.pages[pageIndex]
//   if (!pageData) throw Error('pageData is not find!')
//   return pageData.layers
// }

export const formatLayer = (layers: Page['layers']) => {
  return layers.map(item => {
    switch (item._class) {
      case "artboard":
        return new ArtboardLayer(item)
      case "symbolMaster":
        return new SymbolMasterLayer(item)
      case "symbolInstance":
        return new SymbolInstance(item)
      default:
        return new Layer(item)
    }

  })
}
