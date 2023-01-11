import type { CanvasKit, FontMgr, InputColor } from '@skeditor/canvaskit-wasm'
import type {
  Canvas as SkCanvas,
  Path as SkPath,
  Color as SkColor,
  ImageFilter as SkImageFilter,
  SkPicture,
  Shader as SkShader,
  Paint as SkPaint,
  Surface as SkSurface,
  FontMgr as SkFontMgr,
  GrDirectContext as SkGrDirectContext,
  Paragraph as SkParagraph,
  TextShadow as SkTextShadow,
  ParagraphStyle as SkParagraphStyle,
  TypefaceFontProvider as SkTypefaceFontProvider,
} from '@skeditor/canvaskit-wasm'
import { Subject } from 'rxjs'
import canvaskitWasm from '@skeditor/canvaskit-wasm/bin/canvaskit.wasm?url'

import * as CanvasKitInitFn from '@skeditor/canvaskit-wasm'
// const CanvasKitInitFn = require('@skeditor/canvaskit-wasm')


const sk = {} as {
  CanvasKit: CanvasKit;
}

export const CanvaskitPromised = (CanvasKitInitFn as any)({
  locateFile: canvaskitWasm && (() => canvaskitWasm),
}).then((CanvasKitRes: CanvasKit) => {
  sk.CanvasKit = CanvasKitRes
  if (import.meta.env.DEV) {
    (window as any).CanvasKit = CanvasKitRes
  }
  fontProvider = sk.CanvasKit.TypefaceFontProvider.Make()

  return sk.CanvasKit
}) as Promise<CanvasKit>

let fontMgr: FontMgr | undefined
let fontProvider: SkTypefaceFontProvider | undefined

export const fontLoaded = new Subject<string>()

export const defaultFonts = [
  'Roboto',
  'HarmonyOS Sans SC',
  // 'Noto Color Emoji'
]
const defaultFontFiles = [
  'Roboto-Regular.ttf',
  'HarmonyOSSansSC-Regular.ttf',
  // 'colorfulemoji.woff2'
]

// 使用的时候再调用，CanvasKit 可能还没好。
export function getFontMgr() {
  if (fontMgr) {
    return Promise.resolve(fontMgr!)
  }
  console.log(import.meta.env)
  return Promise.all(
    defaultFontFiles.map((filename) => fetch(import.meta.env.VITE_PUBLIC_PATH + filename).then((res) => res.arrayBuffer()))
  ).then((fonts) => {
    fonts.forEach((font) => {
      const hFont = new sk.CanvasKit.Font((sk.CanvasKit.FontMgr.RefDefault() as any).MakeTypefaceFromData(font), 72)
      console.log('>>> Font info:', hFont.getMetrics())
    })

    fontMgr = sk.CanvasKit.FontMgr.FromData(...fonts)!

    fonts.forEach((_, i) => {
      console.log('>>> Font name: ', fontMgr?.getFamilyName(i))
    })
    return fontMgr!
  })
}

export function getFontProvider() {
  return fontProvider!
}

function prefetchFonts() {
  defaultFontFiles.forEach((filename, idx) => {
    Promise.all([fetch(import.meta.env.VITE_PUBLIC_PATH + filename), CanvaskitPromised])
      .then(([res]) => res.arrayBuffer())
      .then((buffer) => {
        const fontName = defaultFonts[idx]
        fontProvider!.registerFont(buffer, fontName)
        fontLoaded.next(fontName)
      })
  })
}

// 一进入页面就会加载字体，在优化字体加载后这个逻辑要去掉
prefetchFonts()

export function newColorPaint(color: InputColor) {
  const paint = new sk.CanvasKit.Paint()
  paint.setColor(color)
  return paint
}

export function newStrokePaint(width?: number, color?: InputColor) {
  const paint = new sk.CanvasKit.Paint()
  paint.setStyle(sk.CanvasKit.PaintStyle.Stroke)
  if (width !== undefined) {
    paint.setStrokeWidth(width)
  }
  if (color !== undefined) {
    paint.setColor(color)
  }
  return paint
}

export default sk

export {
  SkCanvas,
  SkPath,
  SkColor,
  SkImageFilter,
  SkPicture,
  SkPaint,
  SkShader,
  SkGrDirectContext,
  SkFontMgr,
  SkTypefaceFontProvider,
  SkSurface,
  SkParagraph,
  SkTextShadow,
  SkParagraphStyle,
}
