import {CKElement, ElementProps, ParagraphStyle} from "../../types/CKElement"
import {Canvas, FontMgr as SkFontManager, ParagraphStyle as SkParagraphStyle} from "canvaskit-wasm"
import { toSkParagraphStyle} from "../../utils/SkiaElementMapping"

export interface CKParagraphProps extends ParagraphStyle,ElementProps {
  layout: number
  fontManager: SkFontManager
  x?: number
  y?: number

  content: string
}

export default class CKParagraph extends CKElement<CKParagraphProps>{
  readonly type = 'canvas'
  declare canvas: Canvas | undefined

  constructor(props: CKParagraphProps) {
    super(props)
  }

  render(parent: CKElement<ElementProps>) {
    if (parent.type !== 'canvas' || !parent.canvas) return
    this.canvas = parent.canvas
    const skParagraphBuilder = this.ckRoot.canvasKit.ParagraphBuilder.Make(
      <SkParagraphStyle>toSkParagraphStyle(this.ckRoot.canvasKit, this.props),
      this.props.fontManager,
    )
    if (this.props.content) {
      skParagraphBuilder.addText(this.props.content)
    }
    const skParagraphBuild = skParagraphBuilder.build()
    skParagraphBuild.layout(this.props.layout)
    parent.canvas.drawParagraph(skParagraphBuild, this.props.x ?? 0, this.props.y ?? 0)
    // TODO we can avoid deleting & recreating the paragraph skobject by checkin props that require a new paragraph instance.
  }
}
