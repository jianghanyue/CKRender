import {CanvasKit, TypefaceFontProvider} from "canvaskit-wasm"
import {SketchFile} from "@sketch-hq/sketch-file"
import {
  Artboard, Bitmap,
  Group, Hotspot,
  Oval,
  Polygon,
  Rectangle, ShapeGroup,
  ShapePath, Slice,
  Star, SymbolInstance, SymbolMaster, Text, Triangle,
  Page
} from "@sketch-hq/sketch-file-format-ts/dist/cjs/types"
import {SketchFormat, SkyColor, SkyStringAttribute} from "../../editor/model"

export type AppConfigType = {
  canvasKit: CanvasKit | null
  fonts: ArrayBuffer[]
  file: SketchFile | null
  typefaceFontProvider: TypefaceFontProvider | null
}

export type LayerType = (Artboard | Group | Oval | Polygon | Rectangle | ShapePath | Star | Triangle | ShapeGroup | Text | SymbolMaster | SymbolInstance | Slice | Hotspot | Bitmap | Page)
