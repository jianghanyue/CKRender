import Base from "./base/Base"
import {Canvas, Surface} from "canvaskit-wasm"
import {Rect} from "./base/Rect"
import {Observable} from "rxjs"
import {debounceTime} from "rxjs/operators"
import Page from "./Page"

export default class View extends Base {
  canvasEl: HTMLCanvasElement
  skSurface: Surface
  skCanvas: Canvas
  frame: Rect
  dpi = 1
  page: Page
  currentPageIndex = 0

  constructor(public appDom: HTMLElement) {
    super()
    this.frame = new Rect()
    this.page = new Page(this)

    const canvasEl = document.createElement('canvas')
    this.canvasEl = canvasEl
    canvasEl.style.display = 'block'
    this.attachParentNode(this.appDom)

    const skSurface = this.canvasKit.MakeWebGLCanvasSurface(canvasEl)

    if (!skSurface) throw Error("surface creation failed!")

    const skCanvas = skSurface.getCanvas()

    canvasEl.addEventListener('webglcontextlost', () => {
      console.log('webglcontextlost')
      this.forceRestoreWebglContext()
    })
    canvasEl.addEventListener('webglcontextrestored', () => {
      console.log('webglcontextrestored')
    })

    this.skSurface = skSurface
    this.skCanvas = skCanvas


    this.render()
  }

  /**渲染page
   *
    */
  render() {
    this.page.render()
  }

  /** 缓存销毁重新加载
   *
   */
  forceRestoreWebglContext() {
    const canvasEl = this.canvasEl
    canvasEl.parentNode?.removeChild(canvasEl)
    this.skSurface.delete()
    // this.init()
    this.canvasEl.appendChild(this.canvasEl)
    this.doResize(true)
  }

  /**
   * 将canvas渲染到容器里，new View时获取容器el
   * @param el HTML节点
   * @private
   */
  private attachParentNode(el: HTMLElement) {
    const canvasEl = this.canvasEl
    console.log(el, canvasEl)
    el.appendChild(canvasEl)
    this.doResize()

    new Observable((sub) => {
      const ro = new ResizeObserver(() => {
        sub.next()
      })
      ro.observe(el)
      return () => ro.disconnect()
    })
      .pipe(debounceTime(200))
      .subscribe(() => {
        this.doResize()
      })
  }

  /**
   * 控制canvas标签宽高以及dpi，初始化、容器大小改变时重新设置并渲染
   * @param force
   */
  doResize(force = false) {
    const bounds = this.appDom.getBoundingClientRect()
    if (!force && this.frame.width === bounds.width && this.frame.height === bounds.height) {
      return
    }

    const canvasEl = this.canvasEl

    this.frame.width = bounds.width
    this.frame.height = bounds.height
    this.dpi = window.devicePixelRatio

    canvasEl.style.width = `${bounds.width}px`
    canvasEl.style.height = `${bounds.height}px`

    const canvasWidth = this.frame.width * this.dpi
    const canvasHeight = this.frame.height * this.dpi

    canvasEl.width = canvasWidth
    canvasEl.height = canvasHeight
    if (this.skSurface) {
      const skSurface = this.canvasKit.MakeWebGLCanvasSurface(canvasEl)
      if (skSurface) {
        this.skSurface = skSurface
        this.skCanvas = this.skSurface.getCanvas()
      }
    }
    if (this.skSurface) {
      this.render()
    }
  }
}
