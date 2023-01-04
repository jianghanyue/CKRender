import {Canvas} from "canvaskit-wasm"

type BaseProps = {
  canvas: Canvas

}

export default class CKBase {
  canvas: Canvas


  constructor(props: BaseProps) {
    this.canvas = props.canvas
  }

}
