import Base from "../base/Base"
import {Style} from "@sketch-hq/sketch-file-format-ts/dist/esm/types"
import {ImageFilter, Paint} from "canvaskit-wasm"
import {SkyBlurType} from "../../../editor/model"

export default class LayerPaint extends Base {
  skPaint: Paint | undefined

  constructor(style?: Style) {
    super()

    if (style) {
      const { contextSettings,blur, } = style

      if (contextSettings) {
        /**
         * 设置透明度
         */
        if (contextSettings.opacity !== 1) {
          this.getPaint().setAlphaf(contextSettings.opacity)
        }
        /**
         * 设置图层效果
         */
        if (contextSettings.blendMode !== this.canvasKit.BlendMode.Src.value) {
          const blendMode = Object.values(this.canvasKit.BlendMode).find(item => item.value===contextSettings.blendMode)
          if (blendMode) {
            this.getPaint().setBlendMode(blendMode)
          }
        }
      }

      /**
       * 设置滤镜效果
       */
      if (blur && blur.isEnabled && blur.radius) {
        const { type, radius } = blur
        let imageFilter: ImageFilter | undefined

        switch (type) {
          case SkyBlurType.Gaussian:
            imageFilter = this.canvasKit.ImageFilter.MakeBlur(radius, radius, this.canvasKit.TileMode.Clamp, null)
            break
          case SkyBlurType.Motion:
            // imageFilter = sk.CanvasKit.ImageFilter._MakeMatrixConvolution();
            console.warn('unimplemented: motion blur')
            break
          case SkyBlurType.Zoom:
            console.warn('unimplemented: zoom blur')
            break
          case SkyBlurType.Background:
            console.warn('unimplemented: background blur')
            break
        }

        if (imageFilter) {
          this.getPaint().setImageFilter(imageFilter)
        }
      }

    }

  }

  getPaint () {
    if (!this.skPaint) {
      this.skPaint = new this.canvasKit.Paint()
    }
    return this.skPaint
  }


}
