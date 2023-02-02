// import {EditorState} from "./EditorState"
import {fromFile} from "./utils/sketch-file"
import CanvasKitInit, {CanvasKit} from "canvaskit-wasm"
import canvaskitWasm from "canvaskit-wasm/bin/canvaskit.wasm?url"
import {AppConfigType} from "./types"
import View from "./sk/View"

export const defaultFonts = [
  '/Roboto',
  '/HarmonyOS Sans SC',
]

type LoadParams = {
  canvaskitWasm?: string
  fonts?: string[]
  path?: string
}

export class Application {
  static CONFIG: AppConfigType = {
    canvasKit: null,
    fonts: [],
    file: null,
    typefaceFontProvider: null
  }

  static get canvasKit() {
    return Application.CONFIG.canvasKit
  }

  view?: View

  pages: string[] = []
  selectedPage = ''

  constructor(public appDom: HTMLElement) {
  }

  async load(loadParams: LoadParams = {}) {
    await Promise.all([
      this.loadCanvasKit(loadParams.canvaskitWasm),
      this.loadFonts(loadParams.fonts),
      this.loadFile(loadParams.path)
    ])
      .then(([canvasKit, fonts, file]) => {
        Application.CONFIG.canvasKit = canvasKit
        Application.CONFIG.fonts = fonts
        Application.CONFIG.file = file
        Application.CONFIG.typefaceFontProvider = canvasKit.TypefaceFontProvider.Make()
        fonts.forEach((item, index) => {
          if (Application.CONFIG.typefaceFontProvider) {
            Application.CONFIG.typefaceFontProvider.registerFont(item, (loadParams.fonts || defaultFonts)[index] || '')
          }
        })
      })
    this.view = new View(this.appDom)
  }

  async loadCanvasKit(_canvaskitWasm = canvaskitWasm): Promise<CanvasKit> {
    return await CanvasKitInit({
      locateFile: () => _canvaskitWasm,
    })
  }

  async loadFile(path = '/mock.sketch') {
    return fromFile(path)
  }

  async loadFonts(fonts = defaultFonts) {
    return Promise.all([...fonts.map(item => fetch(item).then(item => item.arrayBuffer()))]).then(res => {
      console.log('loadFonts')
      return res
    })
  }

  // async openSketch(filename: string, buffer: ArrayBuffer) {
  //   await EditorState.shared.openSketchArrayBuffer(removeExt(filename), buffer, this.appDom)
  // this.isEmpty = false
  // this.pages = EditorState.shared.pages
  // if (!this.selectedPage) {
  //   this.selectedPage = this.pages[0]
  // }
  //   this.renderPage()
  // }
}
