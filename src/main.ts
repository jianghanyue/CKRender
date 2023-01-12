import './style.css'
import {Application} from "./package/editor/app"

const appDom = document.getElementById('app')

if (appDom) {
  const app = new Application(appDom)
  app.loadFile()
}
