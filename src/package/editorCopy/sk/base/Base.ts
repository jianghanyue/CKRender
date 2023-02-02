import {Application} from "../../index"
import {CanvasKit, TypefaceFontProvider} from "canvaskit-wasm"
import {SketchFile} from "@sketch-hq/sketch-file"
import {InputColor} from "@skeditor/canvaskit-wasm"
import SketchFormat from "@sketch-hq/sketch-file-format-ts"
import { Disposable } from "./disposable"


abstract class Base extends Disposable {
  canvasKit: CanvasKit
  file: SketchFile
  fonts: ArrayBuffer[]
  typefaceFontProvider: TypefaceFontProvider

  protected constructor() {
    super()
    const {
      canvasKit,
      file,
      fonts,
      typefaceFontProvider
    } = Application.CONFIG
    if (!fonts || !canvasKit || !file || !typefaceFontProvider) {
      throw Error("canvaskit is not create!")
    }
    this.canvasKit = canvasKit
    this.file = file
    this.fonts = fonts
    this.typefaceFontProvider = typefaceFontProvider
  }

  createColorPaint(color: InputColor) {
    const paint = new this.canvasKit.Paint()
    paint.setColor(color)
    return paint
  }

  createStrokePaint(width?: number, color?: InputColor) {
    const paint = new this.canvasKit.Paint()
    paint.setStyle(this.canvasKit.PaintStyle.Stroke)
    if (width !== undefined) {
      paint.setStrokeWidth(width)
    }
    if (color !== undefined) {
      paint.setColor(color)
    }
    return paint
  }

  toSkColor (color: SketchFormat.Color | string) {
    if (typeof color === 'string') {
      return this.canvasKit.parseColorString(color)
    } else {
      return color ? this.canvasKit.Color(color.red * 255, color.green * 255, color.blue * 255, color.alpha ?? 1) : undefined
    }
  }
}

export default Base

export class SkyTextStyle {
  _class = 'textStyle'
  verticalAlignment = SketchFormat.TextVerticalAlignment.Top
  encodedAttributes: SketchFormat.TextStyle['encodedAttributes'] = {} as any

  readonly defaultFontAttribute = {
    _class: SketchFormat.ClassValue.FontDescriptor as any,
    attributes: {
      name: 'Roboto',
      size: 12,
    },
  }

  fromJson(data: SketchFormat.TextStyle) {
    this.verticalAlignment = data.verticalAlignment
    Object.assign(this.encodedAttributes, data.encodedAttributes)
    if (!this.encodedAttributes.MSAttributedStringFontAttribute) {
      this.encodedAttributes.MSAttributedStringFontAttribute = this.defaultFontAttribute
    }
    return this
  }
}
