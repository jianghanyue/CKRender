import React, {useEffect, useRef} from "react"
import Header from "./components/Header"
import {Application} from "../../../../../src/package/editor/app"

const Interface = () => {
  const rootDom = useRef<HTMLDivElement>(null)

  const load = async () => {
    if (rootDom.current) {
      const app = new Application(rootDom.current)
      app.loadFile()
    }
  }

  useEffect(() => {
    load()
  },[])

  return <div>
    <Header />
    <div ref={rootDom} style={{height: "calc(100vh - 48px)"}} />
  </div>
}

export default Interface
