import { AnyActor, SnapshotFrom } from "xstate";

import { BaseControl } from "./base";
import { JSONSocket } from "./socket-generator";

export type OpenAIThreadControlOptions = {};

export class OpenAIThreadControl<
  T extends AnyActor = AnyActor,
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
