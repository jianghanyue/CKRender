import { ClassValue } from './base'
import { SkyModel } from './sky-model'
import { SketchFormat } from '.'

export class SkyShapeGroup {
  readonly _class = ClassValue.ShapeGroup

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  constructor(private ctx: SkyModel, private data: SketchFormat.ShapeGroup) {
    //
  }

  buildLayers() {
    // this.data.layers.forEach((_layer) => {})
  }

  toJson() {
    return this.data
  }
}

// General Object
export class SkyGroup {
  readonly _class = ClassValue.ShapeGroup

  constructor(private ctx: SkyModel, private data: SketchFormat.Group) {
    //
  }

  toJson() {
    console.log(this.ctx)
    return this.data
  }
}

export class SkyRectangle {
  readonly _class = ClassValue.Rectangle

  constructor(private ctx: SkyModel, private data: SketchFormat.Rectangle) {
    //
  }
  toJson() {
    console.log(this.ctx)
    return this.data
  }
}
