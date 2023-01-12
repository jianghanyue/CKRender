import React, {useEffect, useRef} from "react"
import Header from "./components/Header"
import {CKRootInit} from "../../../../../src/package/canvaskit"
import canvasKitFile from 'canvaskit-wasm/bin/canvaskit.wasm?url'
import {ASTItem, PaintStyle, TextAlignEnum} from "../../../../../src/types/CKElement"

const json: ASTItem[] = [
  {
    type: 'paragraph',
    props: {
      y: -10,
      textStyle: {
        color: "#000000",
        backgroundColor: "rgba(255,255,255, 0)",
        // Noto Mono is the default canvaskit font, we use it as a fallback
        fontFamilies: ["Noto Mono", "Roboto", "Noto Color Emoji"],
        fontSize: 24,
      },
      textAlign: TextAlignEnum.Left,
      maxLines: 7,
      ellipsis: "...",
      layout: 500,
      content: "The quick brown fox 🦊 ate a zesty hamburgerfonts 🍔.\nThe 👩‍👩‍👧‍👧 laughed."
    },
  },
  // {
  //   type: 'paint',
  //   props: {
  //     dy: 100,
  //     dx: 400,
  //     width: 600,
  //     height: 600,
  //     clear: 'rgb(255, 255, 255)',
  //     children: [{
  //       type: 'line',
  //       props: {
  //         x1: 20,
  //         y1: -20,
  //         x2: 20,
  //         y2: 100,
  //         paint: { style: PaintStyle.Fill, antiAlias: true }
  //       }
  //     },
  //       {
  //         type: 'paragraph',
  //         props: {
  //           y: -20,
  //           textStyle: {
  //             color: "#000000",
  //             backgroundColor: "rgba(255,255,255, 0)",
  //             // Noto Mono is the default canvaskit font, we use it as a fallback
  //             fontFamilies: ["Noto Mono", "Roboto", "Noto Color Emoji"],
  //             fontSize: 50,
  //           },
  //           textAlign: TextAlignEnum.Left,
  //           maxLines: 7,
  //           ellipsis: "...",
  //           layout: 500,
  //           content: "The quick brown fox 🦊 ate a zesty hamburgerfonts 🍔.\nThe 👩‍👩‍👧‍👧 laughed."
  //         },
  //       }],
  //   }
  // },
  {
    type: 'group',
    props: {
      children: [
        {
          type: 'line',
          props: {
            x1: 720,
            y1: 100,
            x2: 720,
            y2: 400,
            paint: { style: PaintStyle.Fill, antiAlias: true }
          }
        }
      ]
    }
  },

]

const Interface = () => {
  const rootDom = useRef<HTMLDivElement>(null)

  const load = async () => {
    if (rootDom.current) {
      const fonts = [
        'https://storage.googleapis.com/skia-cdn/google-web-fonts/Roboto-Regular.ttf',
        'https://storage.googleapis.com/skia-cdn/misc/NotoColorEmoji.ttf'
      ]
      if (rootDom) {
        const ckr = await CKRootInit({fonts, canvasKitWasm: canvasKitFile, dom: rootDom.current})
        ckr.render({dataSource: json})
      }
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
