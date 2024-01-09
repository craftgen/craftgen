import * as React from "react";
import type { ClassicPreset, NodeId } from "rete";

import { RefComponent } from "../../../../ref-component";
import type { ClassicScheme, GetSockets, ReactArea2D, Side } from "../../types";

interface Props<Scheme extends ClassicScheme> {
  name: string;
  emit: (props: ReactArea2D<Scheme>) => void;
  side: Side;
  nodeId: NodeId;
  socketKey: string;
  payload: ClassicPreset.Socket;
}

export function RefSocket<Scheme extends ClassicScheme>({
  name,
  emit,
  nodeId,
  side,
  socketKey,
  payload,
  ...props
}: Props<Scheme>) {
  return (
    <RefComponent
      {...props}
      className={name}
      init={(ref) =>
        emit({
          type: "render",
          data: {
            type: "socket",
            side,
            key: socketKey,
            nodeId,
            element: ref,
            payload: payload as GetSockets<Scheme["Node"]>,
          },
        })
      }
      unmount={(ref) => emit({ type: "unmount", data: { element: ref } })}
    />
  );
}
