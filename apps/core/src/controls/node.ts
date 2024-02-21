import type { AnyActorRef, AnyStateMachine, SnapshotFrom } from "xstate";

import type { ParsedNode } from "../nodes/base";
import { BaseControl } from "./base";
import type { JSONSocket } from "./socket-generator";

interface NodeControlOptions {}

export class NodeControl<
  T extends AnyActorRef = AnyActorRef,
> extends BaseControl {
  __type = "node";

  constructor(
    public actor: T,
    public selector: (
      snapshot: SnapshotFrom<T>,
    ) => ParsedNode<any, AnyStateMachine>,
    public options: NodeControlOptions,
    public definition: JSONSocket,
  ) {
    super(50, definition, actor);
  }
}
