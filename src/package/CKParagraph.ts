import {CKElement, ElementProps, ParagraphStyle} from "../types/CKElement"
import {Canvas, FontMgr as SkFontManager, ParagraphStyle as SkParagraphStyle} from "canvaskit-wasm"
import { toSkParagraphStyle} from "../utils/SkiaElementMapping"

export interface CKParagraphProps extends ParagraphStyle,ElementProps {
  layout: number
  fontManager: SkFontManager
  x?: number
  y?: number
  children?: string
}

export default class CKParagraph extends CKElement{
  readonly type = 'canvas'
  readonly canvasKit
  props: CKParagraphProps
  declare skObject: Canvas | undefined

  constructor(props: CKParagraphProps) {
    super()
    this.canvasKit = props.canvasKit
    this.props = props
  }

  render(parent: CKElement) {
    if (parent.type !== 'canvas' || !parent.canvas) return
    this.skObject = parent.canvas
    const skParagraphBuilder = this.canvasKit.ParagraphBuilder.Make(
      <SkParagraphStyle>toSkParagraphStyle(this.canvasKit, this.props),
      this.props.fontManager,
    )
    if (this.props.children) {
      skParagraphBuilder.addText(this.props.children)
    }
    const skParagraphBuild = skParagraphBuilder.build()
    skParagraphBuild.layout(this.props.layout)
    parent.canvas.drawParagraph(skParagraphBuild, this.props.x ?? 0, this.props.y ?? 0)
    // TODO we can avoid deleting & recreating the paragraph skobject by checkin props that require a new paragraph instance.
  }
}
