import type { RenderSignal } from "../../types";

export interface Rect {
  width: number;
  height: number;
  left: number;
  top: number;
}
export interface Transform {
  x: number;
  y: number;
  k: number;
}
export type Translate = (dx: number, dy: number) => void;

export type MinimapRender = RenderSignal<
  "minimap",
  {
    ratio: number;
    nodes: Rect[];
    viewport: Rect;
    start(): Transform;
    translate: Translate;
    point(x: number, y: number): void;
  }
>;
