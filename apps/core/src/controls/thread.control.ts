import type { OpenAIChatMessage } from "modelfusion";

import type { ThreadMessage } from "openai/resources/beta/threads/messages/messages.mjs";
import type { ActorRefFrom } from "xstate";

import { BaseControl } from "./base";
import type { JSONSocket } from "./socket-generator";
import { inputSocketMachine } from "../input-socket";

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

export class ThreadControl<
  T extends ActorRefFrom<typeof inputSocketMachine> = ActorRefFrom<
    typeof inputSocketMachine
  >,
> extends BaseControl {
  __type = "thread";

  constructor(
    public actor: T,
    public definition: JSONSocket,
  ) {
    super(50, definition, actor);
  }
}
