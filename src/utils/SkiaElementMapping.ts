import {
  CanvasKit,
  Color as SkColor,
  FontStyle,
  Paint as SkPaint,
  ParagraphStyle as SkParagraphStyle,
  TextStyle as SkTextStyle,
} from "canvaskit-wasm"
import {CkFontStyle, FontSlantEnum, FontWeightEnum, FontWidthEnum, Paint, ParagraphStyle, TextStyle} from "../types/CKElement"

export interface PropsConverter<IN, OUT> {
  (canvasKit: CanvasKit, propIn?: IN): OUT | undefined
}

export interface Color {
  red: number
  green: number
  blue: number
  alpha?: number
}

export const toSkColor: PropsConverter<Color | string, SkColor> = (canvasKit, color) => {
  if (typeof color === 'string') {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return <SkColor>canvasKit.parseColorString(color)
  } else {
    return color ? canvasKit.Color(color.red, color.green, color.blue, color.alpha ?? 1) : undefined
  }
}

export const toSkPaint: PropsConverter<Paint, SkPaint> = (canvasKit, paint) => {
  if (paint === undefined) {
    return undefined
  }

  const skPaint = new canvasKit.Paint()

  // TODO blendMode?: BlendMode;

  const skColor = toSkColor(canvasKit, paint.color)
  if (skColor) {
    skPaint.setColor(skColor)
  }

  // TODO filterQuality?: FilterQuality;
  // TODO strokeCap?: StrokeCap;
  // TODO strokeJoin?: StrokeJoin;

  if (paint.strokeMiter) {
    skPaint.setStrokeMiter(paint.strokeMiter)
  }
  if (paint.strokeWidth) {
    skPaint.setStrokeWidth(paint.strokeWidth)
  }
  if (paint.antiAlias) {
    skPaint.setAntiAlias(paint.antiAlias)
  }
  if (paint.blendMode) {
    skPaint.setBlendMode(paint.blendMode)
  }
  if (paint.alphaf) {
    skPaint.setAlphaf(paint.alphaf)
  }
  // TODO colorFilter?: ColorFilter
  // TODO imageFilter?: ImageFilter;
  // TODO maskFilter?: MaskFilter
  // TODO pathEffect?: PathEffect
  // TODO shader?: Shader
  // TODO style?: PaintStyle

  return skPaint
}

export const toFontStyle: PropsConverter<CkFontStyle, FontStyle> = (_canvasKit, fontStyle): FontStyle => {
  return {
    slant: { value: fontStyle?.slant ?? FontSlantEnum.Upright },
    weight: { value: fontStyle?.weight ?? FontWeightEnum.Normal },
    width: { value: fontStyle?.width ?? FontWidthEnum.Normal },
  }
}

export const toSkTextStyle: PropsConverter<TextStyle, SkTextStyle> = (canvasKit, textStyle) => {
  return {
    backgroundColor: toSkColor(canvasKit, textStyle?.backgroundColor) ?? canvasKit.WHITE,
    color: toSkColor(canvasKit, textStyle?.color) ?? canvasKit.BLACK,
    decoration: textStyle?.decoration ?? 0,
    decorationThickness: textStyle?.decorationThickness ?? 0,
    fontFamilies: textStyle?.fontFamilies ?? [],
    fontSize: textStyle?.fontSize ?? 14,
    fontStyle: <FontStyle>toFontStyle(canvasKit, textStyle?.fontStyle),
    foregroundColor: toSkColor(canvasKit, textStyle?.foregroundColor) ?? canvasKit.BLACK,
  }
}

export const toSkParagraphStyle: PropsConverter<ParagraphStyle, SkParagraphStyle> = (canvasKit, paragraphStyle) => {
  const textAlign = paragraphStyle?.textAlign ? { value: paragraphStyle.textAlign } : undefined
  const textDirection = paragraphStyle?.textDirection ? { value: paragraphStyle.textDirection } : undefined
  return new canvasKit.ParagraphStyle({
    disableHinting: paragraphStyle?.disableHinting,
    ellipsis: paragraphStyle?.ellipsis,
    maxLines: paragraphStyle?.maxLines,
    textAlign,
    textDirection,
    textStyle: <SkTextStyle>toSkTextStyle(canvasKit, paragraphStyle?.textStyle),
  })
}
