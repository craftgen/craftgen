export interface Position {
  x: number;
  y: number;
}

export type ExtraRender =
  | { type: "render"; data: any }
  | { type: "rendered"; data: any }
  | { type: "unmount"; data: any };

export type RenderSignal<Type extends string, Data> =
  | {
      type: "render";
      data: { element: HTMLElement; filled?: boolean; type: Type } & Data;
    }
  | { type: "rendered"; data: { element: HTMLElement; type: Type } & Data };
