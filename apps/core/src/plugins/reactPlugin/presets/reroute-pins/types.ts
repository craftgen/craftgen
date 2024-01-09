import type { ConnectionId } from "rete";

import type { Position, RenderSignal } from "../../types";

export interface Pin {
  id: string;
  position: Position;
  selected?: boolean;
}
export interface PinData {
  id: ConnectionId;
  pins: Pin[];
}

export type PinsRender = RenderSignal<"reroute-pins", { data: PinData }>;
