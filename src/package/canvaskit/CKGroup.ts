import {CKElement, ElementProps} from "../../types/CKElement"
import CKCanvas from "./CKCanvas"

export type CKGroupProps = ElementProps

export default class CKGroup extends CKElement<CKGroupProps> {
  declare type: 'group'

  render(parent: CKCanvas) {
    console.log(this.props, parent)
    this.canvas = parent.canvas
    if (this.canvas) {
      this.canvas.save()
      this.props.children?.forEach(item => item.render(parent))
      this.canvas.restore()
      parent.skSurface?.flush()
    }
  }

}
