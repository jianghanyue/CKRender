import './style.css'
import {EditorState} from "./package/editor"

const appDom = document.getElementById('app')

function removeExt(str: string) {
  console.log(str)
  const extIdx = str.toLowerCase().lastIndexOf('.sketch')
  return str.slice(0, extIdx)
}

class Application {
  isEmpty = true
  pages: string[] = []
  selectedPage = ''

  constructor(public appDom: HTMLElement) {
  }

  loadSketchFile(url: string) {
    return fetch(url).then((res) => {
      if (res.status !== 200) {
        return Promise.reject(new Error('Load sketch file error: ' + res.status + ':' + res.statusText))
      }
      return res.arrayBuffer()
    })
  }

  loadFile() {
    this.loadSketchFile('/mock.sketch')
      .then((buffer) => {

        return this.openSketch('mock.sketch', buffer)
      })
      .catch((err) => {
        console.error(err)
        console.log('Cant load local files. Please check local development env.')
      })
  }

  async openSketch(filename: string, buffer: ArrayBuffer) {
    await EditorState.shared.openSketchArrayBuffer(removeExt(filename), buffer, this.appDom)
    this.isEmpty = false
    this.pages = EditorState.shared.pages
    if (!this.selectedPage) {
      this.selectedPage = this.pages[0]
    }
    this.renderPage()
  }

  renderPage() {
    let idx = this.pages.indexOf(this.selectedPage)
    if (idx === -1) {
      idx = 0
      this.selectedPage = this.pages[0]
    }
    EditorState.shared.selectPage(idx)
  }
}



if (appDom) {
  const app = new Application(appDom)
  app.loadFile()
}
