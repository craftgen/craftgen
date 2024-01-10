import type { OpenAIChatMessage } from "modelfusion";

import type { ThreadMessage } from "openai/resources/beta/threads/messages/messages.mjs";
import type { Actor, ActorRefFrom, AnyActor, SnapshotFrom } from "xstate";

import type { ThreadMachine } from "../nodes/thread";
import { BaseControl } from "./base";
import type { JSONSocket } from "./socket-generator";

export interface ThreadControlOptions {}

export type MessageContent =
  | OpenAIChatMessage["content"]
  | ThreadMessage["content"];
export type MessageRole = OpenAIChatMessage["role"] | ThreadMessage["role"];
export interface Message {
  id: string;
  role: MessageRole;
  content: MessageContent;
}

export class ThreadControl<T extends AnyActor = AnyActor> extends BaseControl {
  __type = "thread";

  constructor(
    public actor:
      | Actor<typeof ThreadMachine>
      | ActorRefFrom<typeof ThreadMachine>,
    public selector: (snapshot: SnapshotFrom<T>) => Message[],
    public options: ThreadControlOptions,
    public definition: JSONSocket,
  ) {
    super(50, definition, actor);
  }
}
