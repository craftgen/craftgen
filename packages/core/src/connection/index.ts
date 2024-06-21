import { NodeEditor, type ClassicPreset } from "rete";
import { AreaPlugin, type Area2D } from "rete-area-plugin";
import {
  createPseudoconnection,
  type ConnectionPlugin,
  type SocketData,
} from "rete-connection-plugin";
import { getElementCenter } from "rete-render-utils";

import type { Socket, Sockets } from "../sockets";
import type { Position, Schemes } from "../types";
import { findNearestPoint, isInsideRect } from "./math";
import { getNodeRect } from "./utils";

type SocketWithPayload = SocketData & {
  payload?: {
    socket: Socket;
    input?: ClassicPreset.Input<Sockets>;
    output?: ClassicPreset.Output<Sockets>;
  };
};

interface Props {
  createConnection: (from: SocketData, to: SocketData) => Promise<void>;
  display: (from: SocketData, to: SocketData) => boolean;
  offset: (socket: SocketData, position: Position) => Position;
  margin?: number;
  distance?: number;
}

export function useMagneticConnection<S extends Schemes, K = never>(
  connection: ConnectionPlugin<S, K>,
  props: Props,
) {
  const area = connection.parentScope<AreaPlugin<S, Area2D<S>>>(AreaPlugin);
  const editor = area.parentScope<NodeEditor<S>>(NodeEditor);
  const sockets = new Map<HTMLElement, SocketWithPayload>();
  const magneticConnection = createPseudoconnection<Schemes, Area2D<S>>({
    isMagnetic: true,
  });
  const margin = typeof props.margin !== "undefined" ? props.margin : 50;
  const distance = typeof props.distance !== "undefined" ? props.distance : 50;

  let picked: null | SocketWithPayload = null;
  let nearestSocket: null | (SocketData & Position) = null;

  connection.addPipe(async (context) => {
    if (!context || typeof context !== "object" || !("type" in context))
      return context;
    if (context.type === "connectionpick") {
      picked = context.data.socket;
    } else if (context.type === "connectiondrop") {
      if (nearestSocket && !context.data.created) {
        await props.createConnection(context.data.initial, nearestSocket);
      }

      picked = null;
      magneticConnection.unmount(area);
    } else if (context.type === "pointermove") {
      if (!picked) return context;
      const point = context.data.position;
      const nodes = Array.from(area.nodeViews.entries());
      const socketsList = Array.from(sockets.values());

      const rects = nodes.map(([id, view]) => ({
        id,
        ...getNodeRect(editor.getNode(id), view),
      }));
      const nearestRects = rects.filter((rect) =>
        isInsideRect(rect, point, margin),
      );
      const nearestNodes = nearestRects.map(({ id }) => id);
      // console.log(picked?.payload?.socket!);
      const nearestSockets = socketsList
        .filter((item) => nearestNodes.includes(item.nodeId))
        .filter((item) =>
          item.payload?.socket.isCompatibleWith(picked?.payload?.socket.name!),
        );

      const socketsPositions = await Promise.all(
        nearestSockets.map(async (socket) => {
          const nodeView = area.nodeViews.get(socket.nodeId);

          if (!nodeView) throw new Error("node view");

          const { x, y } = await getElementCenter(
            socket.element,
            nodeView.element,
          );

          return {
            ...socket,
            x: x + nodeView.position.x,
            y: y + nodeView.position.y,
          };
        }),
      );
      nearestSocket =
        findNearestPoint(socketsPositions, point, distance) || null;

      if (nearestSocket && props.display(picked, nearestSocket)) {
        if (!magneticConnection.isMounted()) magneticConnection.mount(area);
        const { x, y } = nearestSocket;

        magneticConnection.render(
          area,
          props.offset(nearestSocket, { x, y }),
          picked,
        );
      } else if (magneticConnection.isMounted()) {
        magneticConnection.unmount(area);
      }
    } else if (context.type === "render" && context.data.type === "socket") {
      const { element } = context.data;

      sockets.set(element, context.data);
    } else if (context.type === "unmount") {
      sockets.delete(context.data.element);
    }
    return context;
  });
}
