import {Disposable, Point, Rect} from '../base'
import {
  SkyArtboardView,
  SkyBaseLayerView,
  SkyPageView,
  SkyShapeGroupView,
  SkySymbolInstanceView,
  SkyView,
} from '../view'
import {fromEvent} from 'rxjs'
import {ClassValue} from '../model'
import {throttleTime} from 'rxjs/operators'

export type DragDirectionType = 'left' | 'right' | 'top' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | ''

export const pointIndexToDirection: Record<number, DragDirectionType> = {
  0: 'topLeft',
  1: 'topRight',
  2: 'bottomLeft',
  3: 'bottomRight',
}

export const lineIndexToDirection: Record<number, DragDirectionType> = {
  0: 'top',
  1: 'right',
  2: 'bottom',
  3: 'left',
}

export class PointerController extends Disposable {
  selectedView: SkyBaseLayerView | undefined

  constructor(private view: SkyView) {
    super()

    view.canvasEl$.subscribe((el) => {
      const canvasEl = el!
      this._disposables.push(
        fromEvent(canvasEl, 'contextmenu').subscribe((event) => {
          const mEvent = event as MouseEvent
          // ctrl 按左键，触发 context menu
          if (mEvent.button === 0) {
            event.preventDefault()
            this.onClick(event)
          }
        })
      )

      this._disposables.push(
        fromEvent(canvasEl, 'mousemove')
          .pipe(throttleTime(100))
          .subscribe((event) => {
            this.onHover(event as MouseEvent)
          })
      )

      // this._disposables.push(
      //   fromEvent(view.canvasEl, 'mousedown').subscribe((event) => {
      //     console.log('>>> mouse down');
      //     event.preventDefault();
      //   })
      // );
      this._disposables.push(fromEvent(canvasEl, 'click').subscribe(this.onClick))
    })
  }

  private static isDeepKey(event: MouseEvent) {
    return event.metaKey || event.ctrlKey
  }

  onClick = (_event: Event) => {
    const event = _event as MouseEvent
    const { offsetX, offsetY } = event
    const pt = new Point(offsetX, offsetY)

    const selectedBox = this.findSelectedBox(pt)

    if (selectedBox) {
      return
    }

    const targetView = this.findViewFromEvent(event, pt)
    this.view.selectLayer(targetView?.model)
  }

  onHover(event: MouseEvent) {
    const { offsetX, offsetY } = event
    const pt = new Point(offsetX, offsetY)

    const selectedBox = this.findSelectedBox(pt)
    const canvasHTML = this.view.canvasEl$.getValue()

    if (!canvasHTML) throw Error('canvasHTML is not find')
    if (selectedBox) {
      canvasHTML.style.cursor = this.view.overlayView.selectionView?.cursorStyle || 'auto'
      return
    } else {
      canvasHTML.style.cursor = 'auto'
    }

    const targetView = this.findViewFromEvent(event, pt)
    this.view.hoverLayer(targetView?.model)
  }

  findSelectedBox = (pt: Point) => {
    const selectionView = this.view.overlayView.selectionView
    const actualFrame = selectionView?.actualFrame
    if (selectionView) {
      for (let i = 0; i < selectionView.pointRect.length; i++) {
        const item = selectionView.pointRect[i]
        if (item.containsPoint(pt)) {
          selectionView.dragDirection = pointIndexToDirection[i]
          return item
        }
      }
    }
    if (actualFrame) {
      const base = 5
      const area = [
        new Rect(actualFrame.x, actualFrame.y - base, actualFrame.width, base * 2),
        new Rect(actualFrame.right - base, actualFrame.y, base * 2, actualFrame.height),
        new Rect(actualFrame.x, actualFrame.bottom - base, actualFrame.width, base * 2),
        new Rect(actualFrame.left - base, actualFrame.y, base * 2, actualFrame.height),
      ]

      for (let i = 0; i < area.length; i++) {
        const item = area[i]
        if (item.containsPoint(pt)) {
          selectionView.dragDirection = lineIndexToDirection[i]
          return item
        }
      }
    }

    return null
  }

  findViewFromEvent(event: MouseEvent, pt: Point) {


    // const start = Date.now();
    // const cost = Date.now() - start;
    // console.log('Find view', cost, offsetX, offsetY, targetView);

    // invariant(!(targetView instanceof SkyPageView), 'Cant select page view. It should be undefined')
    return this.findView(pt, PointerController.isDeepKey(event))
  }

  /**
   * @param pt 相对 canvas 的坐标
   * @param deepest deep select
   */
  findView(pt: Point, deepest: boolean): SkyBaseLayerView | undefined {
    const pageView = this.view.pageView
    if (!pageView) return

    if (!pageView.containsPoint(pt)) return

    const foundArtBoard = this.findOverlayArtBoard(pt)
    if (foundArtBoard) {
      return foundArtBoard
    }

    return deepest ? PointerController.findViewDeep(pageView, pt) : PointerController.findViewFirst(pageView, pt)
  }

  /**
   * 在 ArtBoard 标题上即算选中
   */
  findOverlayArtBoard(pt: Point) {
    const artBoards = this.view.overlayView.artBoardOverlays
    for (let i = 0; i < artBoards.length; i++) {
      if (artBoards[i].titleFrame.containsPoint(pt)) {
        return artBoards[i].artBoardView
      }
    }
    return null
  }

  private static findViewFirst(pageView: SkyPageView, pt: Point) {
    for (let i = pageView.children.length - 1; i >= 0; i--) {
      const layer = pageView.children[i]
      const type = layer.model._class

      if (
        layer.interactive &&
        ((type === ClassValue.Artboard && layer.containsPoint(pt)) || type === ClassValue.SymbolMaster)
      ) {
        for (let t = layer.children.length - 1; t >= 0; t--) {
          const subLayer = layer.children[t]
          if (subLayer.interactive && subLayer.containsPoint(pt)) {
            return subLayer
          }
        }
      } else {
        if (layer.interactive && layer.containsPoint(pt)) {
          return layer
        }
      }
    }
    return undefined
  }

  private static findViewDeep(pageView: SkyPageView, pt: Point) {
    let curLayer: SkyBaseLayerView = pageView

    while (curLayer.children.length > 0) {
      let foundChild = false
      for (let i = curLayer.children.length - 1; i >= 0; i--) {
        const child = curLayer.children[i]
        if (child.interactive && child.containsPoint(pt)) {
          foundChild = true

          // symbol instance、 shape group 是不行的
          const canExploreChildren = !(child instanceof SkySymbolInstanceView || child instanceof SkyShapeGroupView)

          if (canExploreChildren) {
            curLayer = child
            break
          } else {
            return child
          }
        }
      }
      if (!foundChild || curLayer.children.length === 0) {
        if (curLayer instanceof SkyArtboardView || curLayer instanceof SkyPageView) {
          return undefined
        } else {
          return curLayer
        }
      }
    }

    return undefined
  }
}
