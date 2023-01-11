import {Application, FederatedPointerEvent, FederatedWheelEvent, Graphics, Rectangle} from 'pixi.js'
import {IApplicationOptions} from "@pixi/app/lib/Application"

let count = 0

export class DrawBoard {
  app: Application
  graphics: Graphics
  isDrawReady = false

  constructor(wrapDom?: HTMLElement, options?: IApplicationOptions) {
    count++
    console.log(count)
    const _options: IApplicationOptions = {}

    if (wrapDom) {
      _options.width = wrapDom.clientWidth
      _options.height = wrapDom.clientHeight
      _options.resolution = window.devicePixelRatio
      _options.backgroundColor = '#eeeeee'
      _options.resizeTo = wrapDom
    }
    this.app = new Application(Object.assign(_options, options))
    console.log(this.app)
    if (wrapDom) {
      const view = this.app.view as HTMLCanvasElement
      view.style.width = '100%'
      view.style.height = '100%'
      wrapDom.appendChild(view)
    }

    this.graphics = new Graphics()
    this.graphics.cacheAsBitmap = true
    this.graphics.interactive = true
    this.app.stage.addChild(this.graphics)
    this.app.stage.transform.position.set(300, 100)

    this.drawRect({x: 0, y: 0, width: 100, height: 100, color: 0xDE3249})
    // this.drawRect({x: 200, y: 0, width: 100, height: 100, color: 0xDE3249})
    console.log(this.app.stage)
    this.bindEvent()
  }

  bindEvent() {
    this.app.stage.interactive = true
    this.app.stage.hitArea = this.getGlobalHitArea()
    window.addEventListener('wheel', (e) => {
      e.preventDefault()
    }, {passive: false})
    this.app.stage.addEventListener('wheel', (e) => {
      const evt = e as FederatedWheelEvent
      console.log(e)
      this.app.stage.x -= evt.deltaX
      this.app.stage.y -= evt.deltaY
      this.app.stage.hitArea = this.getGlobalHitArea()
    }, {passive: true})
    this.app.renderer.on('resize', () => {
      console.log('resize')
      this.app.stage.hitArea = this.getGlobalHitArea()
    })
  }

  drawRect(props: { x: number, y: number, width: number, height: number, color?: number, graphics?: Graphics }) {
    const {
      x,
      y,
      width,
      height,
      color = 0x000000,
      graphics = this.graphics
    } = props

    graphics.beginFill(color)
    const rect = graphics.drawRect(x, y, width, height)
    graphics.endFill()

    return rect
  }

  getGlobalHitArea() {
    return new Rectangle(-this.app.stage.x, -this.app.stage.y, this.app.screen.width, this.app.screen.height)
  }

  drawReady(type: 'rect') {
    this.isDrawReady = true
    const kv = {
      rect: this.drawRect.bind(this)
    }
    console.log(this.graphics)

    console.log(this.app.stage.hitArea)
    const startPosition = {x: 0, y: 0}
    const endPosition = {x: 0, y: 0}
    let shape: Graphics

    const handlePointermove = (e: Event) => {
      const evt = e as FederatedPointerEvent
      endPosition.x = evt.global.x
      endPosition.y = evt.global.y
      const position = {
        x: endPosition.x > startPosition.x ? startPosition.x : endPosition.x,
        y: endPosition.y > startPosition.y ? startPosition.y : endPosition.y,
        width: endPosition.x > startPosition.x ? endPosition.x - startPosition.x : startPosition.x - endPosition.x,
        height: endPosition.y > startPosition.y ? endPosition.y - startPosition.y : startPosition.y - endPosition.y,
      }

      // endPosition.y = evt.global.y
      if (!shape) {
        shape = kv[type]({
          x: position.x - this.app.stage.x,
          y: position.y - this.app.stage.y,
          width: position.width || 1,
          height: position.height || 10,
          graphics: new Graphics(),
          color: 0xDE3249
        })
        this.app.stage.addChild(shape)
      } else {
        // this.app.ticker.addOnce(() => {
          // shape.pivot = {
          //   x: endPosition.x > startPosition.x ? shape.x : shape.x + shape.width,
          //   y: endPosition.y > startPosition.y ? shape.y : shape.y + shape.height
          // }
          // shape.x = position.x - this.app.stage.x
          // shape.y = position.y - this.app.stage.y
          shape.width = position.width
          // shape.height = position.height
        // })
      }
      console.log(shape, 'shape', position)
    }

    const handleMousedown = (e: Event) => {
      const evt = e as FederatedPointerEvent
      console.log(evt.screenY, evt.global.y)
      startPosition.x = evt.global.x
      startPosition.y = evt.global.y
      this.app.stage.addEventListener('mousemove', handlePointermove)
    }

    const handleMouseup = () => {
      this.app.stage.removeEventListener('mousemove', handlePointermove)
      this.app.stage.removeEventListener('mousedown', handleMousedown)
      window.removeEventListener('mouseup', handleMouseup)
      console.log(this.app)
    }

    this.app.stage.addEventListener('mousedown', handleMousedown)
    window.addEventListener('mouseup', handleMouseup)


    this.isDrawReady = false
  }
}
