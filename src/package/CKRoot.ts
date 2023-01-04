import CanvasKitInit, {CanvasKit, Color as SkColor, FontMgr, Image as SkImage, Surface} from "canvaskit-wasm"
import CKCanvas from "./CKCanvas"
import CKParagraph from "./CKParagraph"
import {ASTItem, CKElement, PaintStyle} from "../types/CKElement"
import CKEmpty from "./CKEmpty"
import CKLine from "./CKLine"
import {DEFAULT_SCALE_DELTA, MAX_SCALE, MIN_SCALE, normalizeWheelEventDirection, promiseWrap} from "../utils"
import {toSkColor} from "../utils/SkiaElementMapping"

type CKRootProps = {
  fontMgr: FontMgr | null
  canvasKit: CanvasKit
  dom: HTMLElement
}

type InitProps = {
  canvasKitWasm?: string
  locateFile?(file: string): string;
  fonts?: string[]
  dom: HTMLElement
}

export type RenderProps = {
  json?: ASTItem[]
}

export class CKRoot {
  canvasHTML: HTMLCanvasElement
  fontMgr: FontMgr | null = null
  canvasKit: CanvasKit
  rootCanvas: CKCanvas | undefined
  props: CKRootProps
  skSurface: Surface
  subSkSurface: Surface
  AST: ASTItem[] = []
  renderQueue: ASTItem[][] = []
  imgBytes: SkImage | undefined

  _position = {
    x: 0,
    y: 0
  }

  _origin = {
    x: 0,
    y: 0
  }

  get position() {
    return this._position
  }

  set position(value) {
    if (value.x !== this._position.x && value.y !== this._position.y) {
      this._position = value
      this.asyncUpdateTransform()
    }
  }

  _scale = 1
  _wheelUnusedTicks = 0

  get scale() {
    return this._scale
  }

  set scale(value) {
    if (this._scale !== value) {
      const difference = value - this._scale

      const xScale = (this._origin.x - this.position.x) / this._scale
      const yScale = (this._origin.y - this.position.y) / this._scale

      this._position = {
        x: this.position.x
          - xScale
          * difference,
        y: this.position.y
          - yScale
          * difference,
      }
      this._scale = value
      this.asyncUpdateTransform()
      this._origin = {
        x: 0,
        y: 0
      }
    }
  }

  constructor(props: CKRootProps) {
    this.fontMgr = props.fontMgr
    this.canvasKit = props.canvasKit
    this.props = props
    this.canvasHTML = document.createElement('canvas')
    this.canvasHTML.width = props.dom.clientWidth
    this.canvasHTML.height = props.dom.clientHeight
    props.dom.appendChild(this.canvasHTML)
    const skSurface = this.canvasKit.MakeWebGLCanvasSurface(this.canvasHTML, undefined)
    if (!skSurface) {
      throw Error("Failed to create skSurface")
    }
    this.skSurface = skSurface
    const subSkSurface = this.canvasKit.MakeSurface(this.canvasHTML.width, this.canvasHTML.height)
    if (!subSkSurface) {
      throw Error("Failed to create skSurface")
    }
    this.subSkSurface = subSkSurface
    this.canvasHTML.style.display = 'block'
    this.bindEvent()
  }

  destory() {
    this.unbindEvent()
    this.canvasHTML.remove()
  }

  bindEvent() {
    this.canvasHTML.addEventListener('wheel', this.handleWheel)
  }

  unbindEvent() {
    this.canvasHTML.removeEventListener('wheel', this.handleWheel)
  }

  handleWheel = (evt: WheelEvent) => {
    evt.preventDefault()
    if (evt.ctrlKey || evt.metaKey) {
      const delta = normalizeWheelEventDirection(evt)
      let ticks = 0

      if (evt.deltaMode === WheelEvent.DOM_DELTA_LINE || evt.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
        if (Math.abs(delta) >= 1) {
          ticks = Math.sign(delta)
        } else {
          ticks = this.accumulateWheelTicks(delta)
        }
      } else {
        const PIXELS_PER_LINE_SCALE = 30
        ticks = this.accumulateWheelTicks(delta / PIXELS_PER_LINE_SCALE)
      }
      if (ticks !== 0) {
        this._origin = {
          x: evt.offsetX,
          y: evt.offsetY
        }
      }
      if (ticks < 0) {
        this.decreaseScale(-ticks)
      } else if (ticks > 0) {
        this.increaseScale(ticks)
      }
    } else {
      this.position = {x: this.position.x - evt.deltaX, y: this.position.y - evt.deltaY}
    }
  }

  increaseScale(steps = 1) {
    let newScale = this.scale

    do {
      newScale = Number((newScale * DEFAULT_SCALE_DELTA).toFixed(2))
      newScale = Math.ceil(newScale * 10) / 10
      newScale = Math.min(MAX_SCALE, newScale)
    } while (--steps > 0 && newScale < MAX_SCALE)

    this.scale = newScale
  }

  decreaseScale(steps = 1) {
    let newScale = this.scale

    do {
      newScale = Number((newScale / DEFAULT_SCALE_DELTA).toFixed(2))
      newScale = Math.floor(newScale * 10) / 10
      newScale = Math.max(MIN_SCALE, newScale)
    } while (--steps > 0 && newScale > MIN_SCALE)

    this.scale = newScale
  }

  accumulateWheelTicks(ticks: number) {
    if (this._wheelUnusedTicks > 0 && ticks < 0 || this._wheelUnusedTicks < 0 && ticks > 0) {
      this._wheelUnusedTicks = 0
    }

    this._wheelUnusedTicks += ticks
    const wholeTicks = Math.sign(this._wheelUnusedTicks) * Math.floor(Math.abs(this._wheelUnusedTicks))
    this._wheelUnusedTicks -= wholeTicks
    return wholeTicks
  }

  render(props: RenderProps) {
    const {
      json
    } = props

    if (json) {
      this.AST = json
    }
    this.asyncUpdate()
  }

  asyncUpdate() {
    return promiseWrap(() => this.update())
  }

  asyncUpdateTransform() {
    return promiseWrap(() => this.updateTransform())
  }

  updateTransform() {

    if (this.imgBytes) {
      console.log(555)
      const skCanvas = this.skSurface.getCanvas()
      skCanvas.save()
      skCanvas.clear(toSkColor(this.canvasKit, 'rgb(235, 236, 237)') as SkColor)
      skCanvas.translate(this.position.x, this.position.y)
      skCanvas.scale(this.scale, this.scale)
      const defaultPaint = new this.canvasKit.Paint()
      defaultPaint.setAntiAlias(true)

      skCanvas.drawImage(this.imgBytes, 0, 0, defaultPaint)
      skCanvas.restore()
      this.skSurface.flush()
    } else {
      const skCanvas = this.subSkSurface.getCanvas()
      skCanvas.save()
      skCanvas.translate(this.position.x, this.position.y)
      skCanvas.scale(this.scale, this.scale)
      this.update()
      skCanvas.restore()
    }
  }

  update() {
    console.log(4555)
    let children: CKElement[] = []

    children = this.initJson(this.AST)
    this.rootCanvas = new CKCanvas({
      canvasKit: this.canvasKit,
      skObject: this.subSkSurface,
      clear: 'rgb(235, 236, 237)',
      children
    })

    this.rootCanvas.render()

    const canvas2 = new CKCanvas({
      canvasKit: this.canvasKit,
      skObject: this.subSkSurface,
      children: [
        new CKLine({
          canvasKit: this.canvasKit,
          x1: 600,
          y1: -200,
          x2: 600,
          y2: 600,
          paint: {style: PaintStyle.Fill, antiAlias: true}
        })
      ]
    })
    canvas2.render()
    this.skSurface.getCanvas().save()
    this.imgBytes = this.subSkSurface.makeImageSnapshot()
    const paint = new this.canvasKit.Paint()
    paint.setColor(this.canvasKit.WHITE)
    paint.setStyle(this.canvasKit.PaintStyle.Fill)
    this.skSurface.getCanvas().clear(this.canvasKit.WHITE)
    this.skSurface.getCanvas().drawImage(this.imgBytes, 0, 0, paint)
    this.skSurface.getCanvas().restore()
    this.skSurface.flush()

  }

  initJson(json: Record<string, any>[]) {
    return json.map(item => {
      if (item.type === 'paragraph') {
        return new CKParagraph({
          canvasKit: this.canvasKit,
          fontManager: this.fontMgr,
          ...item.props
        })
      }
      if (item.type === 'line') {
        return new CKLine({
          canvasKit: this.canvasKit,
          ...item.props
        })
      }
      return new CKEmpty()
    })
  }

  getWidth() {
    return this.skSurface.width()
  }

  getHeight() {
    return this.skSurface.height()
  }
}

const loadFont = async (fonts?: string[]) => {
  const fontsPromise = (fonts || ['https://storage.googleapis.com/skia-cdn/google-web-fonts/Roboto-Regular.ttf'])
    .map(item => {
      return fetch(
        item
      ).then((resp) => resp.arrayBuffer())
    })
  return await Promise.all(fontsPromise)
}

let fonts: ArrayBuffer[]

let ck: CanvasKit

export const CKRootInit = async (props: InitProps) => {
  if (!fonts) {
    fonts = await loadFont(props.fonts)
  }
  if (!ck) {
    ck = await CanvasKitInit({
      locateFile: props.locateFile || ((file: string): string => props.canvasKitWasm || `https://unpkg.com/canvaskit-wasm@0.37.2/bin/${file}`),
    })
  }
  return new CKRoot({fontMgr: ck.FontMgr.FromData(...fonts), canvasKit: ck, dom: props.dom})
}

