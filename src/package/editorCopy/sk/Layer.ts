import Base from "./base/Base"
import {LayerType} from "../types"
import {Transform} from "./base/Transform"
import LayerPaint from "./layerProperties/LayerPaint"
import {degreeToRadian} from "./base/Common"
import {Rect} from "./base/Rect"
import Page from "./Page"
import sk from "../../editor/util/canvaskit"
import {Canvas} from "canvaskit-wasm"

export default class Layer extends Base {
  isVisible: boolean
  hasClippingMask: boolean | undefined
  shouldBreakMaskChain: boolean
  isLocked: boolean
  transform: Transform
  layerPaint: LayerPaint
  frame: Rect

  constructor(public options: LayerType) {
    super()
    this.isVisible = options.isVisible
    this.hasClippingMask = options.hasClippingMask
    this.shouldBreakMaskChain = options.shouldBreakMaskChain
    this.isLocked = options.isLocked
    this.transform = new Transform()
    this.layerPaint = new LayerPaint(options.style)

    const {frame} = options

    this.frame = new Rect(frame.x, frame.y, frame.width, frame.height)
    this.updateTransform()
  }

  updateTransform() {
    const { isFlippedHorizontal, isFlippedVertical, rotation, frame } = this.options

    this.transform.pivot.set(frame.width / 2, frame.height / 2)

    const scaleX = isFlippedHorizontal ? -1 : 1
    const scaleY = isFlippedVertical ? -1 : 1
    this.transform.scale.set(scaleX, scaleY)

    this.transform.rotation = -1 * scaleX * scaleY * degreeToRadian(rotation)

    this.transform.position.set(frame.x + frame.width / 2, frame.y + frame.height / 2)
    this.transform.updateLocalTransform()
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  render(page: Page) {
    page
  }

  get isMask() {
    return this.options.hasClippingMask
  }

  tryClip(skCanvas: Canvas) {
    if (!this.isMask) return

    // save and restore 会将 clip 也撤回
    // 所以需要手动进行坐标转换，并回退

    const mat = this.transform.localTransform.toArray(false)
    skCanvas.concat(mat)
    this._tryClip(skCanvas)
    skCanvas.concat(sk.CanvasKit.Matrix.invert(mat)!)
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  _tryClip(skCanvas: Canvas) {skCanvas}
}

export class WrapLayer extends Layer {
  renderLayers (page: Page,layers: Layer[]) {
    let isMasking = false
    const {skCanvas} = page.view
    layers.forEach(layer => {
      if (layer.render) {
        if ((layer.isMask || layer.shouldBreakMaskChain) && isMasking) {
          skCanvas.restore()
          isMasking = false
        }
        if (layer.isVisible) {
          layer.render(page)
        }
        if (layer.isMask) {
          skCanvas.save()
          layer.tryClip(page.view.skCanvas)
          isMasking = true
        }
      }
    })
    if (isMasking) {
      skCanvas.restore()
    }
  }
}
