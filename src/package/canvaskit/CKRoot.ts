import CanvasKitInit, {CanvasKit, FontMgr, Image as SkImage, Surface} from "canvaskit-wasm"
import CKCanvas from "./CKCanvas"
import CKParagraph from "./CKParagraph"
import {ASTItem, CKElement, ElementProps} from "../../types/CKElement"
import CKEmpty from "./CKEmpty"
import CKLine from "./CKLine"
import {DEFAULT_SCALE_DELTA, MAX_SCALE, MIN_SCALE, normalizeWheelEventDirection, promiseWrap} from "../../utils"
import CKPaint from "./CKPaint"
import CKGroup from "./CKGroup"
// import {toSkColor} from "../utils/SkiaElementMapping"
// import {toSkColor} from "../utils/SkiaElementMapping"


type CKRootProps = {
  fontMgr: FontMgr
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
  dataSource?: ASTItem[]
}

export class CKRoot {
  canvasHTML: HTMLCanvasElement
  fontMgr: FontMgr
  canvasKit: CanvasKit
  rootCanvas: CKCanvas
  props: CKRootProps
  webGLskSurface: Surface
  AST: ASTItem[] = []
  imageSnapshot: SkImage | undefined

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
      this.asyncUpdate()

      // // console.log(444)
      // // const colors = ['#b74c4c','#377abd','#5e984e','#e3bb5b']
      // const canvas = this.webGLskSurface.getCanvas()
      // canvas.clear(this.canvasKit.WHITE)
      // const paint = new this.canvasKit.Paint()
      // // Math.ceil(Math.random()*1440)
      // // Math.ceil(Math.random()*400)
      // for (let i = 0; i < 1000000; i++) {
      //   // const paint = new this.canvasKit.Paint()
      //   // paint.setColor(toSkColor(this.canvasKit,colors[Math.ceil(Math.random()*3)]) as Color)
      //   canvas.drawRRect(this.canvasKit.XYWHRect(Math.ceil(Math.random()*1440),Math.ceil(Math.random()*400),3,3), paint)
      //
      // }
      // this.webGLskSurface.flush()

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
      this.asyncUpdate()
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

    this.canvasHTML.style.display = 'block'
    this.bindEvent()

    const {rootCanvas, webGLskSurface} = this.load()
    this.rootCanvas = rootCanvas
    this.webGLskSurface = webGLskSurface
  }

  destory() {
    this.unbindEvent()
    this.canvasHTML.remove()
  }

  bindEvent() {
    this.canvasHTML.addEventListener('wheel', this.handleWheel)
    window.addEventListener('resize', this.handleResize)
  }

  unbindEvent() {
    this.canvasHTML.removeEventListener('wheel', this.handleWheel)
    window.removeEventListener('resize', this.handleResize)
  }

  handleResize = () => {
    const {rootCanvas, webGLskSurface} = this.load()
    this.rootCanvas = rootCanvas
    this.webGLskSurface = webGLskSurface
    this.asyncUpdate()
  }

  load = () => {
    const dom = this.props.dom
    this.canvasHTML.width = dom.clientWidth * window.devicePixelRatio
    this.canvasHTML.height = dom.clientHeight * window.devicePixelRatio
    this.canvasHTML.style.width = dom.clientWidth + 'px'
    this.canvasHTML.style.height = dom.clientHeight + 'px'
    this.props.dom.appendChild(this.canvasHTML)
    if (this.webGLskSurface) {
      this.webGLskSurface.dispose()
    }
    const webGLskSurface = this.canvasKit.MakeWebGLCanvasSurface(this.canvasHTML)
    if (!webGLskSurface) {
      throw Error("Failed to create skSurface")
    }

    const rootCanvas = new CKCanvas({
      ckRoot: this,
      clear: 'rgb(235, 236, 237)',
    })

    return {
      webGLskSurface,
      rootCanvas
    }
  }

  handleWheel = (evt: WheelEvent) => {
    evt.preventDefault()
    if (evt.ctrlKey || evt.metaKey) {
      const delta = normalizeWheelEventDirection(evt)
      let ticks: number

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
          x: evt.offsetX * window.devicePixelRatio,
          y: evt.offsetY * window.devicePixelRatio
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
      dataSource
    } = props

    if (dataSource) {
      this.AST = dataSource
    }
    this.asyncUpdate()
  }

  asyncUpdate() {
    return promiseWrap(() => this.updateTransform())
  }

  updateTransform() {
    //
    // if (this.imageSnapshot) {
    //   const skCanvas = this.webGLskSurface.getCanvas()
    //   skCanvas.save()
    //   skCanvas.clear(toSkColor(this.canvasKit, 'rgb(235, 236, 237)') as Color)
    //   skCanvas.translate(this.position.x, this.position.y)
    //   skCanvas.scale(this.scale, this.scale)
    //   const defaultPaint = new this.canvasKit.Paint()
    //   defaultPaint.setAntiAlias(true)
    //
    //   skCanvas.drawImage(this.imageSnapshot, 0, 0, defaultPaint)
    //   skCanvas.restore()
    //   this.webGLskSurface.flush()
    // } else {
    console.log(this.position)
    const skCanvas = this.webGLskSurface.getCanvas()

    skCanvas.save()
    skCanvas.translate(this.position.x, this.position.y)
    skCanvas.scale(this.scale, this.scale)
    this.update()
    skCanvas.restore()
    this.webGLskSurface.flush()
    // }
  }

  update() {
    let children: CKElement<ElementProps>[] = []
    children = this.initDataSource(this.AST)

    this.rootCanvas.children = children

    this.rootCanvas.render({skSurface: this.webGLskSurface})
    // this.makeAndCacheImg()
  }

  // makeAndCacheImg () {
  //   this.webGLskSurface.getCanvas().save()
  //   this.imageSnapshot = this.canvasKit.MakeImageFromCanvasImageSource(this.canvasHTML)
  //
  //   const paint = new this.canvasKit.Paint()
  //   this.webGLskSurface.getCanvas().clear(this.canvasKit.WHITE)
  //   this.webGLskSurface.getCanvas().drawImage(this.imageSnapshot, 0, 0, paint)
  //   this.webGLskSurface.getCanvas().restore()
  //   this.webGLskSurface.flush()
  //   this.imageSnapshot = this.webGLskSurface.makeImageSnapshot([0,0,1440,this.canvasHTML.height])
  //
  // }

  initDataSource(dataSource: ASTItem[]): CKElement<ElementProps>[] {
    return dataSource.map(item => {
      if (item.type === 'paragraph') {
        return new CKParagraph({
          ckRoot: this,
          fontManager: this.fontMgr,
          ...item.props
        })
      }
      if (item.type === 'line') {
        return new CKLine({
          ckRoot: this,
          ...item.props
        })
      }
      if (item.type === 'paint') {
        return new CKPaint({
          ckRoot: this,
          ...item.props,
          children: this.initDataSource(item.props.children || [])
        })
      }
      if (item.type === 'group') {
        return new CKGroup({
          ckRoot: this,
          ...item.props,
          children: this.initDataSource(item.props.children || [])
        })
      }
      return new CKEmpty({ckRoot: this})
    })
  }

  getWidth() {
    return this.webGLskSurface.width()
  }

  getHeight() {
    return this.webGLskSurface.height()
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
  const fontMgr = ck.FontMgr.FromData(...fonts)
  if (!fontMgr) {
    throw Error('Failed to create fontMgr')
  }
  return new CKRoot({fontMgr, canvasKit: ck, dom: props.dom})
}

