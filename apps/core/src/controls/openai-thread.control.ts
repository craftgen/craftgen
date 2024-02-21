import type { AnyActorRef, SnapshotFrom } from "xstate";

import { BaseControl } from "./base";
import type { JSONSocket } from "./socket-generator";

export interface OpenAIThreadControlOptions {}

export class OpenAIThreadControl<
  T extends AnyActorRef = AnyActorRef,
> extends BaseControl {
  __type = "openai-thread";

  constructor(
    public actor: T,
    public selector: (snapshot: SnapshotFrom<T>) => string | null, // Function that returns the observable value
    public options: OpenAIThreadControlOptions,
    public definition: JSONSocket,
  ) {
    super(50);
  }
}
