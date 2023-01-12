import React from "react"
import Cursor from '../../../../assets/svg/cursor'
import Paint from '../../../../assets/svg/paint'
import Shape from '../../../../assets/svg/shape'
import {DrawBoard} from "../../../../../../../src/package/pixi"

type Props = {
  drawBoard?: DrawBoard
}

const Header: React.FC<Props> = (props) => {
  const {drawBoard} = props
  const iconButtons = [
    {icon: Cursor, title: '选择工具'},
    {icon: Paint, title: '画布工具'},
    {icon: Shape, title: '矩形', handle: () => {drawBoard?.drawReady('rect')}},
  ]
  return <div className=" border-b-gray-100 border-b-2 h-12 flex items-center pl-1 pr-1">
    <div className={'flex gap-2'}>
      {iconButtons.map((item, index) => {
        return <div onClick={item.handle} className={'flex items-center justify-end align-middle w-8 hover:bg-blue-500 cursor-pointer h-8 rounded'} style={{color: '#fff'}} key={index} title={item.title}>
          {item.icon}
          <div className={'w-2'}></div>
        </div>
      })}
    </div>
  </div>
}

export default Header
