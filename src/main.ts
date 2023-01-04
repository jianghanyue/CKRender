import './style.css'
import {CKRootInit} from "./package"
import canvasKitFile from 'canvaskit-wasm/bin/canvaskit.wasm?url'
import {ASTItem, PaintStyle, TextAlignEnum} from "./types/CKElement"

const json: ASTItem[] = [
  {
    type: 'paragraph',
    props: {
      textStyle: {
        color: "#000000",
        backgroundColor: "rgba(255,255,255, 0)",
        // Noto Mono is the default canvaskit font, we use it as a fallback
        fontFamilies: ["Noto Mono", "Roboto", "Noto Color Emoji"],
        fontSize: 50,
      },
      textAlign: TextAlignEnum.Left,
      maxLines: 7,
      ellipsis: "...",
      layout: 500,
      children: "The quick brown fox 🦊 ate a zesty hamburgerfonts 🍔.\nThe 👩‍👩‍👧‍👧 laughed."
    },
  },
  {
    type: 'line',
    props: {
      x1: 1440,
      y1: 0,
      x2: 1440,
      y2: 400,
      paint: { style: PaintStyle.Fill, antiAlias: true }
    }
  },
  {
    type: 'line',
    props: {
      x1: 720,
      y1: 0,
      x2: 720,
      y2: 400,
      paint: { style: PaintStyle.Fill, antiAlias: true }
    }
  }
]

const button = document.createElement('button')
button.innerText = '渲染'
button.style.position = 'fixed'
button.style.top = "0"
button.style.left = "0"
document.body.appendChild(button)

const load = async () => {
  const rootDom = document.getElementById('app')
  const fonts = [
    'https://storage.googleapis.com/skia-cdn/google-web-fonts/Roboto-Regular.ttf',
    'https://storage.googleapis.com/skia-cdn/misc/NotoColorEmoji.ttf'
  ]
  if (rootDom) {
    const ckr = await CKRootInit({fonts, canvasKitWasm: canvasKitFile, dom: rootDom})
    ckr.render({json})
    button.onclick = () => {
      const arry = ckr.imgBytes?.encodeToBytes()
      if (!arry) return
      const str12 = arrayBufferToBase64(arry)//转换字符串
      console.log(str12)
      const outputImg = document.createElement('img')
      outputImg.src = 'data:image/png;base64,'+str12
      outputImg.style.position = 'fixed'
      outputImg.style.top = "0"
      outputImg.style.left = "0"
      // // append it to your page
      document.body.appendChild(outputImg)
      console.log(outputImg)
      function arrayBufferToBase64( buffer: Uint8Array ) {
        let binary = ''
        const bytes = new Uint8Array( buffer )
        const len = bytes.byteLength
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode( bytes[ i ] )
        }
        return window.btoa( binary )
      }
    }
  }
}

load()
