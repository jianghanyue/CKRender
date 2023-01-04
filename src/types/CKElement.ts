import {BlendMode, Canvas, CanvasKit} from "canvaskit-wasm"
import { Color } from "../utils/SkiaElementMapping"

export type ElementProps = {
  canvasKit: CanvasKit
}

export abstract class CKElement {
  readonly type: 'paint' |
    'group' |
    'canvas' |
    'line' |
    'rect' |
    'path' |
    'circle' |
    'image' |
    undefined
  readonly canvasKit: CanvasKit | undefined
  canvas: Canvas | undefined

  abstract render(param: this): void
}

export enum TextDirectionEnum {
  Ltr = 0,
  Rtl = 1,
  // TODO
}

export enum FilterQuality {}

export enum StrokeCap {}

export enum StrokeJoin {}

export interface LerpColorFilter {
  lerp: number
  first: ColorFilter
  second: ColorFilter
}

export type LinearToSRGBGammaColorFilter = 'LinearToSRGBGamma'

export type Matrix = [number, number, number, number, number, number, number, number, number]

export interface MatrixColorFilter {
  matrix: Matrix
}

export type SRGBToLinearGammaColorFilter = 'SRGBToLinearGamma'


export type ColorFilter =
  | BlendColorFilter
  | ComposeColorFilter
  | LerpColorFilter
  | LinearToSRGBGammaColorFilter
  | MatrixColorFilter
  | SRGBToLinearGammaColorFilter

export interface BlendColorFilter {
  color: Color
  blendMode: BlendMode
}

export interface ComposeColorFilter {
  first: ColorFilter
  second: ColorFilter
}

export enum TileMode {}

export interface BlurImageFilter {
  rx: number
  ry: number
  tileMode: TileMode
  next: ImageFilter | null
}

export interface ColorImageFilter {
  filter: ColorFilter
  next: ImageFilter | null
}

export interface ComposeImageFilter {
  first: ImageFilter
  second: ImageFilter
}

export interface MatrixTransformImageFilter {
  matrix: MatrixColorFilter
  filterQuality: FilterQuality
  next: ImageFilter | null
}

export enum BlurStyle {}

export interface BlurMaskFilter {
  blurStyle: BlurStyle
  radius: number
  b: boolean
}

export type ImageFilter = BlurImageFilter | ColorImageFilter | ComposeImageFilter | MatrixTransformImageFilter

export type MaskFilter = BlurMaskFilter

export type PathEffect = DashPathEffect | CornerPathEffect | DiscretePathEffect

export type Shader = LinearGradientShader | RadialGradientShader | TwoPointConicalGradientShader

export interface TwoPointConicalGradientShader {
  start: Point
  startRadius: number
  end: Point
  endRadius: number
  colors: Color[]
  positions: number[]
  mode: number
  localMatrix?: Matrix
  flags: number
}

export interface RadialGradientShader {
  center: Point
  radius: number
  colors: Color[]
  positions: number[]
  mode: number
  localMatrix?: Matrix
  flags: number
}

export interface DashPathEffect {
  intervals: number[]
  phase: number
}

export interface DiscretePathEffect {
  frequency: number
  amplitude: number
  seed: number
}

export type Point = [number, number]

export interface LinearGradientShader {
  start: Point
  end: Point
  colors: Color[]
  positions: number[]
  mode: number
  localMatrix: Matrix | null
  flags: number
}

export interface CornerPathEffect {
  radius: number
}

export enum PaintStyle {
  /**
   * Fill the geometry.
   */
  Fill = 0,
  /**
   * Stroke the geometry.
   */
  Stroke = 1,
  /**
   * Fill and stroke the geometry.
   */
  StrokeAndFill = 2,
}

export interface Paint {
  blendMode?: BlendMode
  color?: Color | string
  filterQuality?: FilterQuality
  strokeCap?: StrokeCap
  strokeJoin?: StrokeJoin
  strokeMiter?: number
  strokeWidth?: number
  antiAlias?: boolean
  colorFilter?: ColorFilter
  imageFilter?: ImageFilter
  maskFilter?: MaskFilter
  pathEffect?: PathEffect
  shader?: Shader
  alphaf?: number
  style?: PaintStyle
}

export interface ParagraphStyle {
  disableHinting?: boolean
  heightMultiplier?: number
  ellipsis?: string
  maxLines?: number
  textAlign?: TextAlignEnum
  textDirection?: TextDirectionEnum
  textStyle: TextStyle
}

export interface TextStyle {
  backgroundColor?: Color | string
  color?: Color | string
  decoration?: number
  decorationThickness?: number
  fontFamilies?: string[]
  fontSize?: number
  fontStyle?: CkFontStyle
  foregroundColor?: Color | string
}

export interface CkFontStyle {
  weight?: FontWeightEnum
  slant?: FontSlantEnum
  width?: FontWidthEnum
}

export enum FontSlantEnum {
  Upright,
  Italic,
  Oblique,
}

export enum FontWidthEnum {
  /**
   * A condensed font width of 3.
   */
  Condensed = 3,
  /**
   * An expanded font width of 7.
   */
  Expanded = 7,
  /**
   *A condensed font width of 2.
   */
  ExtraCondensed = 2,
  /**
   *An expanded font width of 8.
   */
  ExtraExpanded = 8,
  /**
   *A normal font width of 5. This is the default font width.
   */
  Normal = 5,
  /**
   *A condensed font width of 4.
   */
  SemiCondensed = 4,
  /**
   *An expanded font width of 6.
   */
  SemiExpanded = 6,
  /**
   *A condensed font width of 1.
   */
  UltraCondensed = 1,
  /**
   *An expanded font width of 9.
   */
  UltraExpanded = 9,
}

export interface TypeFace {
  data: ArrayBuffer
}

export interface Font {
  typeFace?: TypeFace
  size: number
}

export enum FontWeightEnum {
  /**
   * A thick font weight of 900.
   */
  Black = 900,
  /**
   * A thick font weight of 700. This is the default for a bold font.
   */
  Bold = 700,
  /**
   * A thick font weight of 1000.
   */
  ExtraBlack = 1000,
  /**
   * A thick font weight of 800.
   */
  ExtraBold = 800,
  /**
   * A thin font weight of 200.
   */
  ExtraLight = 200,
  /**
   * The font has no thickness at all.
   */
  Invisible = 0,

  /**
   * A thin font weight of 300.
   */
  Light = 300,

  /**
   *A thicker font weight of 500.
   */
  Medium = 500,

  /**
   *A typical font weight of 400. This is the default font weight.
   */
  Normal = 400,

  /**
   *A thick font weight of 600.
   */
  SemiBold = 600,

  /**
   *A thin font weight of 100.
   */
  Thin = 100,
}

export enum TextAlignEnum {
  Left = 0,
  Center = 1,
  Right = 2,
}

export type ASTItem = {
  type: string
  props: Record<string, any>
  children?: ASTItem[]
}
