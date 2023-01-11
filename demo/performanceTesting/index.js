
const btn2d = document.getElementById('2dBtn')
const canvas2d = document.getElementById('canvas2D')
const btnWebgl = document.getElementById('webglBtn')
// const canvasWebgl = document.getElementById('canvasWebgl')

const app = new PIXI.Application({ antialias: true ,width: 2880, height: 600, background: '#fff'})
document.body.appendChild(app.view)


app.view.style.height = 300 + 'px'
app.view.style.width = 1440 + 'px'


console.log(app)

// btn2d.onclick = () => {
//   const ctx = canvas2d.getContext("2d")
//   ctx.fillStyle="#FF0000"
//   for (let i = 0; i < 1000000; i++) {
//     ctx.fillRect(Math.ceil(Math.random()*2880),Math.ceil(Math.random()*400),3,3)
//   }
// }

const graphics = new PIXI.Graphics()
// graphics.cacheAsBitmap = true
app.stage.addChild(graphics)

btnWebgl.onclick = () => {
  console.log(app)

  graphics.beginFill(0xDE3249)
  for (let i = 0; i < 1000000; i++) {
    graphics.drawRect(Math.ceil(Math.random()*2880),Math.ceil(Math.random()*400),10,10)
  }
  graphics.endFill()
  // graphics.clear()
}


let vertexShaderSource = '' +
  'attribute vec4 apos;' +
  'void main(){' +
  '   gl_Position =apos;' +
  '}'

var fragShaderSource = '' +
  'void main(){' +
  '   gl_FragColor = vec4(1.0,0.0,0.0,1.0);' +
  '}'

const gl = canvas2d.getContext("webgl")


btn2d.onclick = () => {

  const program = initShader(gl, vertexShaderSource, fragShaderSource)
  var aposLocation = gl.getAttribLocation(program, 'apos')
//创建缓冲区对象
  const buffer = gl.createBuffer()

  //绑定缓冲区对象
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  //缓冲区中的数据按照一定的规律传递给位置变量apos
  gl.vertexAttribPointer(aposLocation, 2, gl.FLOAT, false, 0, 0)
  //允许数据传递
  gl.enableVertexAttribArray(aposLocation)
  console.log(program)
  for (let i = 0; i < 1000000; i++) {
    const random = Math.ceil(Math.random() * 100) / 100

    // console.log(random)
    //类型数组构造函数Float32Array创建顶点数组
    var data = new Float32Array([random, random, -random, random, -random, -random, random, -random])


    // //顶点数组data数据传入缓冲区
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)

  }
//开始绘制图形
  gl.drawArrays(gl.LINE_LOOP, 0, 4)
}


//声明初始化着色器函数
function initShader(gl, vertexShaderSource, fragmentShaderSource) {
  const vertexShader = gl.createShader(gl.VERTEX_SHADER)
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
  gl.shaderSource(vertexShader, vertexShaderSource)
  gl.shaderSource(fragmentShader, fragmentShaderSource)
  gl.compileShader(vertexShader)
  gl.compileShader(fragmentShader)
  const program = gl.createProgram()
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  gl.useProgram(program)
  return program
}


