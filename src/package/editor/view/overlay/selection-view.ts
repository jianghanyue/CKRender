/**
 * Layer 的选中框
 * 给定一个 layer view。 计算出它在 page 中的范围。
 * 每次绘制的时候通过 scale/translate，重新计算 frame，而不是应用 scale。
 * 确保 stroke-width 固定。
 */
import {SkyBaseLayerView, SkyShapePathLikeView} from '..'
import sk, {CanvaskitPromised, newColorPaint, newStrokePaint, SkPaint} from '../../util/canvaskit'
import {SkyBoxView} from './box-view'
import {Rect} from "../../base"
import {DragDirectionType} from "../../controller/pointer-controller"

let selectPaint: SkPaint
let hoverPaint: SkPaint
let pointPaint: SkPaint

CanvaskitPromised.then(() => {
  const colorSelect = sk.CanvasKit.Color(21, 129, 205, 1)

  const colorHover = sk.CanvasKit.Color(21, 129, 205, 0.4)

  selectPaint = newStrokePaint(2, colorSelect)
  hoverPaint = newStrokePaint(2, colorHover)
  pointPaint = newColorPaint(sk.CanvasKit.WHITE)

  // const dashEffect = sk.CanvasKit.PathEffect.MakeDash([5, 5]);
  // hoverPaint.setPathEffect(dashEffect);
})

export class SelectionView extends SkyBoxView {
  clip = false
  pointRect: Rect[] = []
  actualFrame: Rect | undefined
  dragDirection: DragDirectionType = ''

  get cursorStyle() {
    switch (this.dragDirection) {
      case "bottom":
      case "top":
        return 'ns-resize'
      case "left":
      case "right":
        return 'ew-resize'
      case "topLeft":
      case "bottomRight":
        return 'nwse-resize'
      case "topRight":
      case "bottomLeft":
        return 'nesw-resize'
      default:
        return 'auto'
    }
  }

  constructor(public layerView: SkyBaseLayerView, private isHover = false) {
    super()
  }

  // setColor () {
  //   const color: Color = {
  //     alpha: 1,
  //     blue: 0,
  //     green: 1,
  //     red: 0,
  //     _class: "color",
  //   }
  //   this.pages[0].layers[0].backgroundColor = new SkyColor().fromJson(color)
  // }

  renderSelf() {
    const actualFrame = this.layerView.frame.onlySize.applyMatrix(this.layerView.transform.worldTransform)
    const {skCanvas} = this.ctx
    skCanvas.drawRect(actualFrame.toSk(), this.isHover ? hoverPaint : selectPaint)

    if (!this.isHover) {
      const layerView = this.layerView as SkyShapePathLikeView
      // const color: Color = {
      //   alpha: 1,
      //   blue: 0,
      //   green: 1,
      //   red: 0,
      //   _class: "color",
      // }
      console.log(layerView.transform,'layerView.transform')


      // if (this.pointRect.length === 0) {
        // const x = layerView.frame.x + layerView.frame.width
        // const y = layerView.frame.y + layerView.frame.height
        // layerView.transform.pivot.set(x,y)
        // layerView.transform.position.set(0,0)
        // layerView.frame.x = 0
        // layerView.frame.y = 0
        // layerView.frame.width += layerView.frame.width / 2
        // layerView.frame.height += layerView.frame.height / 2
        // layerView.model.points.forEach(item => {
        //
        // })

        // layerView.transform.scale.x = 1.5
        // layerView.transform.scale.y = 1.5
      //   this.ctx.pageView?.invalidateTiles(true)
      //   this.ctx.markDirty()
      // }

      // layerView.model.style?.fill(color)
      const size = 6
      const offset = size / 2 - 1
      this.actualFrame = actualFrame
      this.pointRect = [
        new Rect(actualFrame.left - offset, actualFrame.top - offset, size, size),
        new Rect(actualFrame.right - 4, actualFrame.top - offset, size, size),
        new Rect(actualFrame.left - offset, actualFrame.bottom - 4, size, size),
        new Rect(actualFrame.right - 4, actualFrame.bottom - 4, size, size),
      ]
      this.pointRect.forEach(item => {
        skCanvas.drawRect(item.toSk(), pointPaint)
        skCanvas.drawRect(item.toSk(), selectPaint)
      })
    } else {
      this.pointRect = []
    }
  }
}
