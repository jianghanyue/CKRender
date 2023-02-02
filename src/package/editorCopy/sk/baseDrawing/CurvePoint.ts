import Base from "../base/Base"
import {Point} from "../base/Point"
import {CurveMode} from "@sketch-hq/sketch-file-format-ts/dist/cjs/types"
import {SketchFormat} from "../../../editor/model"
import {Rect} from "../base/Rect"

export default class CurvePoint extends Base {
  curveFrom = new Point()
  curveTo = new Point()
  point = new Point()

  curveMode = CurveMode.None

  cornerRadius = 0

  hasCurveFrom = false
  hasCurveTo = false

  constructor(options: SketchFormat.CurvePoint,public frame: Rect) {
    super()
    const { width, height } = frame

    this.curveMode = options.curveMode
    this.cornerRadius = options.cornerRadius

    this.point = Point.fromPointString(options.point).scale(width, height)

    this.curveFrom = Point.fromPointString(options.curveFrom).scale(width, height)
    this.curveTo = Point.fromPointString(options.curveTo).scale(width, height)

    this.hasCurveFrom = options.hasCurveFrom
    this.hasCurveTo = options.hasCurveTo
  }
}
