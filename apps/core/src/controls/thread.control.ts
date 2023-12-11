import { OpenAIChatMessage } from "modelfusion";
import { ThreadMessage } from "openai/resources/beta/threads/messages/messages.mjs";
import { Actor, AnyActor, SnapshotFrom } from "xstate";

import { ThreadMachine } from "../nodes/thread";
import { BaseControl } from "./base";
import { JSONSocket } from "./socket-generator";

export type ThreadControlOptions = {};
export type MessageContent = OpenAIChatMessage["content"] | ThreadMessage["content"];
export type MessageRole = OpenAIChatMessage['role'] | ThreadMessage['role']
export interface Message {
  id: string;
  role: MessageRole
  content: MessageContent
}

export class ThreadControl<T extends AnyActor = AnyActor> extends BaseControl {
  __type = "thread";

  constructor(
    public actor: Actor<typeof ThreadMachine>,
    public selector: (snapshot: SnapshotFrom<T>) => Message[],
    public options: ThreadControlOptions,
    public definition: JSONSocket,
  ) {
    super(50, definition, actor);
  }
}
