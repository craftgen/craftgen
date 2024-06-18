import * as React from "react";
import { Scope, type BaseSchemes, type CanAssignSignal } from "rete";

import type { RenderPreset } from "./presets/types";
import { getRenderer, type Renderer } from "./renderer";
import type { Position, RenderSignal } from "./types";
import type { Registry } from "./useRegistry";
import { Root } from "./utils";

export * as Presets from "./presets";
export type { ClassicScheme, ReactArea2D, RenderEmit } from "./presets/classic";
export { RefComponent } from "./ref-component";
export * from "./shared";
export * from "./types";
export { useRete } from "./utils";
export * from "./useRegistry";

/**
 * Signals that can be emitted by the plugin
 * @priority 9
 */
export type Produces<Schemes extends BaseSchemes> =
  | {
      type: "connectionpath";
      data: {
        payload: Schemes["Connection"];
        path?: string;
        points: Position[];
      };
    }
  | {
      type: "portal";
      data: { element: HTMLElement; reactElement: React.ReactElement };
    };

type Requires<Schemes extends BaseSchemes> =
  | RenderSignal<"node", { payload: Schemes["Node"] }>
  | RenderSignal<
      "connection",
      { payload: Schemes["Connection"]; start?: Position; end?: Position }
    >
  | { type: "unmount"; data: { element: HTMLElement } };

/**
 * Plugin props
 */
export interface Props {
  /** root factory for React.js 18+ */
  createRoot?: (container: Element | DocumentFragment) => any;
  createPortal?: Registry<HTMLElement, React.ReactNode>;
}

/**
 * React plugin. Renders nodes, connections and other elements using React.
 * @priority 10
 * @emits connectionpath
 * @listens render
 * @listens unmount
 */
export class ReactPlugin<
  Schemes extends BaseSchemes,
  T = Requires<Schemes>,
> extends Scope<Produces<Schemes>, [Requires<Schemes> | T]> {
  renderer: Renderer;
  presets: RenderPreset<Schemes, T>[] = [];

  constructor(props?: Props) {
    super("react-render");
    this.renderer = getRenderer({
      createRoot: props?.createRoot,
      createPortal: props?.createPortal,
    });

    this.addPipe((context) => {
      if (!context || typeof context !== "object" || !("type" in context))
        return context;
      if (context.type === "unmount") {
        this.unmount(context.data.element);
      } else if (context.type === "render") {
        if ("filled" in context.data && context.data.filled) {
          return context;
        }
        if (this.mount(context.data.element, context)) {
          return {
            ...context,
            data: {
              ...context.data,
              filled: true,
            },
          } as typeof context;
        }
      }

      return context;
    });
  }

  setParent(scope: Scope<Requires<Schemes> | T>): void {
    super.setParent(scope);

    this.presets.forEach((preset) => {
      if (preset.attach) preset.attach(this);
    });
  }

  private mount(element: HTMLElement, context: Requires<Schemes>) {
    const parent = this.parentScope();

    for (const preset of this.presets) {
      const result = preset.render(context as any, this);
      if (!result) continue;

      const reactElement = (
        <Root
          rendered={() =>
            parent.emit({ type: "rendered", data: context.data } as T)
          }
          unmount={() => this.renderer.unmount(element)}
        >
          {result}
        </Root>
      );

      this.renderer.mount(reactElement, element);
      return true;
    }
  }

  private unmount(element: HTMLElement) {
    this.renderer.unmount(element);
  }

  /**
   * Adds a preset to the plugin.
   * @param preset Preset that can render nodes, connections and other elements.
   */
  public addPreset<K>(
    preset: RenderPreset<
      Schemes,
      CanAssignSignal<T, K> extends true
        ? K
        : "Cannot apply preset. Provided signals are not compatible"
    >,
  ) {
    const local = preset as RenderPreset<Schemes, T>;

    if (local.attach) local.attach(this);
    this.presets.push(local);
  }
}
