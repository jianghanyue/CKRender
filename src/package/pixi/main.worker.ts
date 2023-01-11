import {DrawBoard} from "./app"

console.log(DrawBoard)
onmessage = function ({data}) {
  new DrawBoard(undefined,data.options)
}
