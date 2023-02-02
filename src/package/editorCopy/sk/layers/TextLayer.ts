import {PathPainter} from '../baseDrawing/PathPaint'
import Layer from "../Layer"
import Page from "../Page"
import {Canvas, Color, Paint, Paragraph, Path, TextShadow} from "canvaskit-wasm"
import {Text as TextType} from "@sketch-hq/sketch-file-format-ts/dist/esm/types"
import {Application, defaultFonts} from "../../index"
import SketchFormat from "@sketch-hq/sketch-file-format-ts"
import {StringAttribute, TextStyle} from "@sketch-hq/sketch-file-format-ts/dist/cjs/types"
import {StringAttributeAttributes} from "../../../editor/model"

export class TextLayer extends Layer {
  private textShadows?: TextShadow[]

  private textPaint?: Paint
  private textBorderPaint?: Paint
  private _cachePaintInfo?: ParaPaintInfo
  private _cacheBorderPaintInfo?: ParaPaintInfo

  private _path?: Path


  constructor(public options: TextType) {
    super(options)
    this.calcTextShadow()

    this.calcTextPaint()
  }

  get shadowPath() {
    return undefined
  }

  get hasFill() {
    return this.validFillCount > 0
  }

  get hasInnerShadow() {
    return this.options.style?.innerShadows.some((shadow) => shadow.isEnabled)
  }

  /**
   * Not plain color
   * gradient pattern etc.
   * need set shader in paint.
   */
  get hasComplicatedPaint() {
    return (
      this.options.style?.fills?.some((fill) => fill.isEnabled && fill.fillType !== SketchFormat.FillType.Color) ||
      this.options.style?.borders?.some((border) => border.isEnabled && border.fillType !== SketchFormat.FillType.Color)
    )
  }

  get validFillCount() {
    return this.options.style?.fills?.reduce((a, b) => (a += b.isEnabled ? 1 : 0), 0) || 0
  }

  /**
   * 是否整体转换成 path 再进行绘制。
   * 1 fill/border gradient
   * 2 多个 fill
   * 3 inner shadow
   */
  get needPaintWithPath(): boolean {
    return this.hasInnerShadow || this.hasComplicatedPaint || this.validFillCount > 1
  }

  invalidatePainter() {
    this.dispose()
  }

  _tryClip(skCanvas: Canvas) {
    const path = this._path || this.calcPath()
    if (path) {
      skCanvas.clipPath(path, this.canvasKit.ClipOp.Intersect, false)
    }
  }


  // Line spacing ok
  // Todo letter spacing
  // Todo default line height 看起来 sketch 的和 skia 的不一样。
  // 默认 leading 有点奇怪，sketch 中的比例不知道如何计算出来的。 另外，
  render(page: Page) {
    console.log(page)
    if (this.needPaintWithPath) {
      this.pathPainter.paint()
    } else {
      // 同时有 border 的 fill 的时候要绘制两次
      // chrome 参考
      // https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/platform/graphics/graphics_context.cc;l=617;
      this.paintWith(this.cachePaintInfo, page.view.skCanvas)
      this.paintWith(this.cacheBorderPaintInfo, page.view.skCanvas)
    }
    page.view.skCanvas.save()
  }

  private calcTextShadow() {
    this.textShadows = this.options.style?.shadows?.map((shadow) => {
      return {
        color: this.toSkColor(shadow.color),
        blurRadius: shadow.blurRadius,
        offset: [shadow.offsetX, shadow.offsetY],
      } as TextShadow
    })
  }

  // 这里提前计算了，没有写成 getter 为了方便点。
  // 不过这里可能用不上，因为可能 text 被当作 path 渲染。
  private calcTextPaint() {
    const border = this.options.style?.borders?.find((border) => border.isEnabled)
    const fill = this.options.style?.fills?.find((fill) => fill.isEnabled)

    if (border) {
      const paint = this.createStrokePaint(border.thickness)
      paint.setColor(this.toSkColor(border.color) as Color)
      this.textBorderPaint = paint
    }

    if (fill) {
      this.textPaint = this.createColorPaint(this.toSkColor(fill.color) as Color)
    }
  }

  get cachePaintInfo() {
    if (!this._cachePaintInfo) {
      this._cachePaintInfo = this.buildPaintInfo()
    }
    return this._cachePaintInfo
  }

  get cacheBorderPaintInfo() {
    if (!this.textBorderPaint) return
    if (!this._cacheBorderPaintInfo) {
      this._cacheBorderPaintInfo = this.buildPaintInfo(true)
    }
    return this._cacheBorderPaintInfo
  }

  private _pathPainter?: PathPainter

  get pathPainter() {
    if (!this._pathPainter) {
      this._pathPainter = new PathPainter(this.view)
    }
    return this._pathPainter
  }

  get fontFamilies() {
    return defaultFonts
  }

  private paintWith(paintInfo: ParaPaintInfo | undefined, skCanvas: Canvas) {
    if (!paintInfo) return
    const { paraArr, baseY } = paintInfo
    paraArr.forEach(([para, y]) => {
      skCanvas.drawParagraph(para, 0, y + baseY)
    })
  }

  // Todo 位置有点偏移，看看什么原因。
  private calcPath() {

    // const { paraArr, baseY } = this.cachePaintInfo
    const retPath = new this.canvasKit.Path()
    // console.log('>>>>', this.view.id);

    // paraArr.forEach(([para, offset]) => {
    //   const path = para.getPath(canvas)
    //   // console.log('>>> raw', path.getBounds());
    //
    //   const shiftPath = path.transform(this.canvasKit.Matrix.translated(0, offset + baseY))
    //   // console.log('>>> shift', shiftPath.getBounds());
    //   retPath.addPath(shiftPath)
    //   // console.log('>>> ret', retPath.getBounds());
    // })
    return retPath
  }

  private buildPaintInfo(isBorder = false): ParaPaintInfo {
    const { attributedString, style } = this.options
    const { frame } = this
    const { string: text, attributes } = attributedString

    const fgPaint = isBorder ? this.textBorderPaint : this.textPaint

    const paraSpacing = style?.textStyle?.encodedAttributes.paragraphStyle?.paragraphSpacing || 0

    const lines = text.split(/\r\n|\r|\n/)

    const lineSegs = this.breakLines(lines, attributes)

    let curY = 0
    const paraArr = lines.map((line, idx) => {
      const segs = lineSegs[idx]
      const paraStyle = this.buildParaStyle(style?.textStyle)
      const builder = this.canvasKit.ParagraphBuilder.MakeFromFontProvider(paraStyle, this.typefaceFontProvider)

      segs.forEach((seg) => {
        const { length, location, attributes } = seg

        const textStyle = this.buildTextStyle(attributes as any, isBorder)
        const segStr = transText(line.slice(location, location + length), attributes as StringAttributeAttributes)
        // console.log(`>>>>|${segStr}|`, segStr.length);
        if (fgPaint) {
          builder.pushPaintStyle(textStyle, fgPaint, new this.canvasKit.Paint())
        } else {
          builder.pushStyle(textStyle)
        }

        builder.addText(segStr)
        builder.pop()
      })

      const para = builder.build()
      builder.delete()
      if (
        frame.height / (paraStyle.textStyle?.fontSize || 12) > 2 ||
        paraStyle.textAlign !== this.canvasKit.TextAlign.Left
      ) {
        para.layout(frame.width)
      } else {
        para.layout(10e6)
      }
      const paraHeight = para.getHeight()
      para.getMaxWidth

      const ret = [para, curY] as [Paragraph, number]
      curY += paraHeight + paraSpacing
      return ret
    })

    const sumHeight = curY - paraSpacing
    const baseY = verAlign(sumHeight, frame.height, style?.textStyle?.verticalAlignment || 0) as number

    return {
      baseY,
      paraArr,
    }
  }

  // hard break lines into segments.
  breakLines(lines: string[], segs: StringAttribute[]): StringAttribute[][] {
    segs = segs.slice(0)

    let curSeg = segs.shift()

    let lineBaseIdx = 0

    return lines.map((line) => {
      const lineSegs = [] as StringAttribute[]

      const lineStart = lineBaseIdx
      const lineEnd = lineBaseIdx + line.length

      while (curSeg) {
        const { location, length } = curSeg

        const segStart = location
        const segEnd = location + length

        // overlaps
        if (!(segEnd <= lineStart || segStart >= lineEnd)) {
          const start = Math.max(segStart, lineStart)
          const end = Math.min(segEnd, lineEnd)
          const len = end - start
          const loc = start - lineBaseIdx
          lineSegs.push({
            ...curSeg,
            location: loc,
            length: len,
          })
        }

        // seg finished
        if (segEnd <= lineEnd) {
          curSeg = segs.shift()
        }

        // line finished
        if (lineEnd <= segEnd) {
          break
        }
      }

      lineBaseIdx += line.length + 1
      return lineSegs
    })
  }

  // 文字样式相关
  // https://stackoverflow.com/questions/56799068/what-is-the-strutstyle-in-the-flutter-text-widget
  // https://api.flutter.dev/flutter/painting/StrutStyle-class.html
  // workspace/others/flutter-engine-master/lib/web_ui/lib/src/engine/canvaskit/text.dart

  // # 上下均匀的 leading 实现：
  // heightMultiplier: 1, leading: lineHeight/fontSize - 1,
  // sketch 的 leading 是上下均匀分配的，通过这种设置可以实现。
  // 而在 skia 中，设置了 multiplier 的时候，是按照 accent/descent 比例上下添加的。 一般造成上边空间更多。

  buildParaStyle(textStyle?: TextStyle | undefined) {
    if (!textStyle) {
      return new this.canvasKit.ParagraphStyle({
        textStyle: {},
      })
    }

    const { encodedAttributes } = textStyle
    const fontSize = encodedAttributes.MSAttributedStringFontAttribute.attributes.size
    let heightMultiplier: number | undefined
    let leadingMultiplier: number | undefined

    // Todo, 这里的 minLineHeight 和 maxLineHeight 区别在哪？
    // sketch 未设置 lineHeight 的时候默认 lineHeight 如何计算？
    if (encodedAttributes.paragraphStyle?.maximumLineHeight) {
      heightMultiplier = encodedAttributes.paragraphStyle.maximumLineHeight / fontSize
      leadingMultiplier = heightMultiplier - 1
      heightMultiplier = 1
    }

    // console.log('>>>> multiplier', heightMultiplier, leadingMultiplier);

    return new this.canvasKit.ParagraphStyle({
      textAlign: mapTextHorAlign(encodedAttributes.paragraphStyle?.alignment),
      textStyle: {
        color: encodedAttributes.MSAttributedStringColorAttribute
          ? sketchColorToSk(encodedAttributes.MSAttributedStringColorAttribute)
          : this.canvasKit.BLACK,
        fontFamilies: this.fontFamilies,
        fontSize,
      },
      strutStyle: {
        fontSize,
        strutEnabled: true,
        heightMultiplier: heightMultiplier,
        leading: leadingMultiplier,
        fontFamilies: this.fontFamilies,
        halfLeading: true,
        forceStrutHeight: true,
      },

      // heightMultiplier,
      // textHeightBehavior: CanvasKit.TextHeightBehavior.DisableAll,
    })
  }

  buildTextStyle(attr: StringAttributeAttributes, isBorder = false) {
    // let heightMultiplier: number | undefined;
    const fontSize = attr.MSAttributedStringFontAttribute.attributes.size

    // if (attr.paragraphStyle?.maximumLineHeight) {
    //   heightMultiplier = attr.paragraphStyle.maximumLineHeight / fontSize;
    // }

    const decoration = isBorder
      ? this.canvasKit.NoDecoration
      : attr.strikethroughStyle
        ? this.canvasKit.LineThroughDecoration
        : attr.underlineStyle
          ? this.canvasKit.UnderlineDecoration
          : this.canvasKit.NoDecoration

    // 每个 TextStyle 都是独立的， 它并不会从 paragraph 中继承属性。
    return new this.canvasKit.TextStyle({
      fontSize,
      fontFamilies: this.fontFamilies,
      letterSpacing: attr.kerning,
      decoration,
      color: isBorder
        ? this.canvasKit.TRANSPARENT
        : this.textPaint?.getColor() ||
        (attr.MSAttributedStringColorAttribute && attr.MSAttributedStringColorAttribute.skColor),
      // heightMultiplier,
      fontStyle: {
        weight: getHintFontWeight(attr.MSAttributedStringFontAttribute.attributes.name),
      },
      shadows: isBorder ? undefined : this.textShadows,
    })
  }

  dispose() {
    this._cachePaintInfo?.paraArr.forEach(([para]) => {
      para.delete()
    })
    this._cacheBorderPaintInfo?.paraArr.forEach(([para]) => {
      para.delete()
    })
    this._path?.delete()
    this._pathPainter?.dispose()
    this.textPaint?.delete()
    this.textBorderPaint?.delete()
  }
}

type ParaPaintInfo = { baseY: number; paraArr: [Paragraph, number][] };

// https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight
// https://fonts.google.com/specimen/Roboto#standard-styles
function getHintFontWeight(fontName = '') {
  fontName = fontName.toLowerCase()
  const CanvasKit = Application.CONFIG.canvasKit
  if (!CanvasKit) throw Error('CanvasKit is not create!')
  const map = {
    thin: CanvasKit.FontWeight.Thin,
    light: CanvasKit.FontWeight.Light,
    lighter: CanvasKit.FontWeight.ExtraLight,
    regular: CanvasKit.FontWeight.Normal,
    normal: CanvasKit.FontWeight.Normal,
    bold: CanvasKit.FontWeight.Bold,
    black: CanvasKit.FontWeight.Black,
    ultra: CanvasKit.FontWeight.ExtraBold,
    extra: CanvasKit.FontWeight.ExtraBold,
  }
  for (const key in map) {
    if (fontName.includes(key)) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return map[key]
    }
  }

  return CanvasKit.FontWeight.Normal
}

function mapTextHorAlign(align?: SketchFormat.TextHorizontalAlignment) {
  const CanvasKit = Application.CONFIG.canvasKit
  if (!CanvasKit) throw Error('CanvasKit is not create!')
  if (!align) return CanvasKit.TextAlign.Left
  return {
    [SketchFormat.TextHorizontalAlignment.Left]: CanvasKit.TextAlign.Left,
    [SketchFormat.TextHorizontalAlignment.Centered]: CanvasKit.TextAlign.Center,
    [SketchFormat.TextHorizontalAlignment.Right]: CanvasKit.TextAlign.Right,
    [SketchFormat.TextHorizontalAlignment.Justified]: CanvasKit.TextAlign.Justify,
    [SketchFormat.TextHorizontalAlignment.Natural]: CanvasKit.TextAlign.Left, // Todo ?????
  }[align]
}

// 根据垂直布局的设置，计算出 y 值。
function verAlign(contentHeight: number, boxHeight: number, align: SketchFormat.TextVerticalAlignment) {
  switch (align) {
    case SketchFormat.TextVerticalAlignment.Top:
      return 0
    case SketchFormat.TextVerticalAlignment.Middle:
      return (boxHeight - contentHeight) / 2
    case SketchFormat.TextVerticalAlignment.Bottom:
      return boxHeight - contentHeight
    default:
      return 0
  }
}

function transText(text: string, attr: StringAttributeAttributes) {
  switch (attr.MSAttributedStringTextTransformAttribute) {
    case SketchFormat.TextTransform.Lowercase:
      return text.toLowerCase()
    case SketchFormat.TextTransform.Uppercase:
      return text.toUpperCase()
    default:
      return text
  }
}

function sketchColorToSk(color: SketchFormat.Color) {
  const CanvasKit = Application.CONFIG.canvasKit
  if (!CanvasKit) throw Error('CanvasKit is not create!')
  return CanvasKit.Color((color.red * 256) | 0, (color.green * 256) | 0, (color.blue * 256) | 0, color.alpha)
}
