import * as React from "react";
import { ClassicPreset, type Scope } from "rete";
import {
  classicConnectionPath,
  getDOMSocketPosition,
  loopConnectionPath,
  type SocketPositionWatcher,
} from "rete-render-utils";

import type { Position } from "../../types";
import type { RenderPreset } from "../types";
import { Connection } from "./components/Connection";
import { ConnectionWrapper } from "./components/ConnectionWrapper";
import { Control } from "./components/Control";
import { Node } from "./components/Node";
import { Socket } from "./components/Socket";
import type {
  ClassicScheme,
  ExtractPayload,
  ReactArea2D,
  RenderEmit,
} from "./types";
import type { AcceptComponent } from "./utility-types";

export { Connection } from "./components/Connection";
export { useConnection } from "./components/ConnectionWrapper";
export { Control } from "./components/Control";
export { Control as InputControl } from "./components/Control";
export { Node, NodeStyles } from "./components/Node";
export { RefControl } from "./components/refs/RefControl";
export { RefSocket } from "./components/refs/RefSocket";
export { Socket } from "./components/Socket";
export type { ClassicScheme, ReactArea2D, RenderEmit } from "./types";
export * as vars from "./vars";

interface CustomizationProps<Schemes extends ClassicScheme> {
  node?: (
    data: ExtractPayload<Schemes, "node">,
  ) => AcceptComponent<
    (typeof data)["payload"],
    { emit: RenderEmit<Schemes> }
  > | null;
  connection?: (
    data: ExtractPayload<Schemes, "connection">,
  ) => AcceptComponent<(typeof data)["payload"]> | null;
  socket?: (
    data: ExtractPayload<Schemes, "socket">,
  ) => AcceptComponent<(typeof data)["payload"]> | null;
  control?: (
    data: ExtractPayload<Schemes, "control">,
  ) => AcceptComponent<(typeof data)["payload"]> | null;
}

interface ClassicProps<Schemes extends ClassicScheme, K> {
  socketPositionWatcher?: SocketPositionWatcher<Scope<never, [K]>>;
  customize?: CustomizationProps<Schemes>;
}

/**
 * Classic preset for rendering nodes, connections, controls and sockets.
 */
export function setup<
  Schemes extends ClassicScheme,
  K extends ReactArea2D<Schemes>,
>(props?: ClassicProps<Schemes, K>): RenderPreset<Schemes, K> {
  const positionWatcher =
    typeof props?.socketPositionWatcher === "undefined"
      ? getDOMSocketPosition<Schemes, K>()
      : props?.socketPositionWatcher;
  const { node, connection, socket, control } = props?.customize || {};

  return {
    attach(plugin) {
      positionWatcher.attach(plugin as unknown as Scope<never, [K]>);
    },

    render(context, plugin) {
      if (context.data.type === "node") {
        const parent = plugin.parentScope();
        const Component = (node ? node(context.data) : Node) as typeof Node;

        return (
          Component && (
            <Component
              data={context.data.payload}
              emit={(data) => parent.emit(data as any)}
            />
          )
        );
      } else if (context.data.type === "connection") {
        const Component = (
          connection ? connection(context.data) : Connection
        ) as typeof Connection;
        const payload = context.data.payload;
        const { sourceOutput, targetInput, source, target } = payload;

        return (
          Component && (
            <ConnectionWrapper
              start={
                context.data.start ||
                ((change) =>
                  positionWatcher.listen(
                    source,
                    "output",
                    sourceOutput,
                    change,
                  ))
              }
              end={
                context.data.end ||
                ((change) =>
                  positionWatcher.listen(target, "input", targetInput, change))
              }
              path={async (start, end) => {
                type FixImplicitAny =
                  | typeof plugin.__scope.produces
                  | undefined;
                const response: FixImplicitAny = await plugin.emit({
                  type: "connectionpath",
                  data: {
                    payload,
                    points: [start, end],
                  },
                });

                if (!response) return "";

                const { path, points } = response.data;
                const curvature = 0.3;

                if (!path && points.length !== 2)
                  throw new Error(
                    "cannot render connection with a custom number of points",
                  );
                if (!path)
                  return payload.isLoop
                    ? loopConnectionPath(
                        points as [Position, Position],
                        curvature,
                        120,
                      )
                    : classicConnectionPath(
                        points as [Position, Position],
                        curvature,
                      );

                return path;
              }}
            >
              <Component data={context.data.payload} />
            </ConnectionWrapper>
          )
        );
      } else if (context.data.type === "socket") {
        const Component = (
          socket ? socket(context.data) : Socket
        ) as typeof Socket;

        return (
          Component &&
          context.data.payload && <Component data={context.data.payload} />
        );
      } else if (context.data.type === "control") {
        const Component =
          control && context.data.payload
            ? control(context.data)
            : context.data.payload instanceof ClassicPreset.InputControl
              ? Control
              : null;

        return Component && <Component data={context.data.payload as any} />;
      }
    },
  };
}
