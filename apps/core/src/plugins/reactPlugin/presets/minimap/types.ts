import { RenderSignal } from '../../types'

export type Rect = {
  width: number
  height: number
  left: number,
  top: number
}
export type Transform = {
  x: number
  y: number
  k: number
}
export type Translate = (dx: number, dy: number) => void

export type MinimapRender =
  | RenderSignal<'minimap', {
    ratio: number
    nodes: Rect[]
    viewport: Rect
    start(): Transform
    translate: Translate
    point(x: number, y: number): void
  }>
