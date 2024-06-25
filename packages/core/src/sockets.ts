import { JSONSchemaDefinition } from "openai/lib/jsonschema.mjs";
import { ClassicPreset } from "rete";
import { match, P } from "ts-pattern";
import type { ActorRefFrom, AnyActorRef } from "xstate";
import { z } from "zod";

import { BooleanControl } from "./controls/boolean";
import { ButtonControl } from "./controls/button";
import { CodeControl } from "./controls/code";
import { ComboboxControl } from "./controls/combobox";
// import { DateControl } from "./controls/date";
// import { FileControl } from "./controls/file";
import { InputControl } from "./controls/input.control";
import { JsCdnController } from "./controls/js-cdn";
import { JsonControl } from "./controls/json";
// import { NodeControl } from "./controls/node";
import { NumberControl } from "./controls/number";
// import { OpenAIThreadControl } from "./controls/openai-thread.control";
import { SecretController } from "./controls/secret";
import { SelectControl } from "./controls/select";
import { SliderControl } from "./controls/slider";
import { socketSchema, type JSONSocket } from "./controls/socket-generator";
// import { TextareControl } from "./controls/textarea";
import { ThreadControl, type Message } from "./controls/thread.control";
import { inputSocketMachine } from "./input-socket";
import { outputSocketMachine } from "./output-socket";
import { nodeTypes, type NodeTypes } from "./types";

export const getSocket = ({
  sockets,
  key,
}: {
  sockets: Record<
    string,
    ActorRefFrom<typeof inputSocketMachine | typeof outputSocketMachine>
  >;
  key: string;
}): ActorRefFrom<typeof inputSocketMachine | typeof outputSocketMachine> => {
  return Object.entries(sockets).find(([socketId]) =>
    socketId.endsWith(key),
  )?.[1] as ActorRefFrom<
    typeof inputSocketMachine | typeof outputSocketMachine
  >;
};

export class Socket extends ClassicPreset.Socket {
  name: SocketNameType;

  constructor(name: SocketNameType) {
    super(name);
    this.name = name;
  }

  compatible: string[] = [];

  combineWith(socket: string) {
    this.compatible.push(socket);
  }

  isCompatibleWith(socket: string) {
    return (
      this.name === socket ||
      this.compatible.includes(socket) ||
      this.compatible.includes("any")
    );
  }
}

export type SocketNameType = JSONSocketPrimitiveTypeKeys | NodeTypes;

export type SocketType =
  | "anySocket"
  | "numberSocket"
  | "booleanSocket"
  | "arraySocket"
  | "stringSocket"
  | "objectSocket"
  | "triggerSocket"
  | "eventSocket"
  | "taskSocket"
  | "audioSocket"
  | "imageSocket"
  | "embeddingSocket"
  | "documentSocket"
  | "databaseIdSocket"
  | "dateSocket"
  | "toolSocket"
  | "threadSocket";

export const types = [
  "string",
  "number",
  "integer",
  "boolean",
  "any",
  "array",
  "object",
  "date",
  "tool",
  "trigger",
  "thread",
] as const;

export type EVENT_TYPE = string;
export type NODE_LABEL = string;
export type NODE_ID = string;
export type TOOL_NAME = `${NODE_LABEL}-${EVENT_TYPE}`;

export interface Tool<NAME extends TOOL_NAME = string> {
  name: NAME;
  description: string;
  parameters: JSONSchemaDefinition;
}

export interface SocketTypeMap {
  string: string;
  number: number;
  integer: number;
  boolean: boolean;
  any: any;
  array: any[]; // Replace 'any' with a more specific type if needed
  object: object; // Replace 'object' with a more specific type if needed
  date: Date; // Assuming you want to map "date" to JavaScript Date object
  tool: Record<`${NODE_ID}/${EVENT_TYPE}`, Tool<TOOL_NAME>>;
  // trigger: (params: any[]) => void | undefined;
  trigger: undefined;
  thread: Message[];
}

export type JSONSocketPrimitiveTypeKeys = (typeof types)[number];

export type MappedType<T extends Record<string, JSONSocket>> = {
  [K in keyof T]: SocketTypeMap[T[K]["type"]] | null;
};

export const getSocketByJsonSchemaType = (schema: JSONSocket) => {
  const socket = new Socket(schema.type);
  socket.combineWith(socket.name); // comine with itself

  if (schema["x-compatible"]) {
    // combine with compatible
    schema["x-compatible"].forEach((compatible: string) => {
      socket.combineWith(compatible);
    });
  }
  if (schema.type === "tool") {
    nodeTypes.forEach((key) => {
      socket.combineWith(key);
    });
  }
  return socket;
};

export const getControlBySocket = <T extends AnyActorRef = AnyActorRef>({
  actor,
  definition,
}: {
  actor: T;
  definition: JSONSocket;
}) => {
  return match(definition as z.infer<typeof socketSchema>)
    .with(
      {
        type: "string",
        format: "expression",
      },
      () => {
        return new CodeControl(actor, definition);
      },
    )
    .with(
      {
        type: "string",
        format: "secret",
      },
      () => {
        return new SecretController(actor, definition);
      },
    )
    .with(
      {
        type: "string",
        "x-controller": "code",
        "x-language": P.string,
        "x-canChangeFormat": false,
      },
      () => {
        return new CodeControl(actor, definition);
      },
    )
    .with(
      {
        type: "array",
        "x-controller": "js-cdn",
      },
      () => {
        return new JsCdnController(actor, definition);
      },
    )
    .with(
      {
        type: "object",
      },
      () => {
        return new JsonControl(actor, definition);
      },
    )
    .with(
      {
        type: "string",
        "x-controller": "combobox",
        allOf: P.array({ enum: P.array(P.string) }),
      },
      () => {
        return new ComboboxControl(actor, definition);
      },
    )
    .with(
      {
        "x-controller": "select",
        allOf: P.array({ enum: P.array(P.any) }),
      },
      () => {
        return new SelectControl(actor, definition);
      },
    )
    .with(
      {
        type: "integer",
      },
      {
        type: "number",
      },
      () => {
        return new NumberControl(actor, definition);
      },
    )
    .with(
      {
        type: "boolean",
      },
      () => {
        return new BooleanControl(actor, definition);
      },
    )
    .with(
      {
        type: "array",
        "x-controller": "thread",
      },
      () => {
        return new ThreadControl(actor, definition);
      },
    )
    .with(
      {
        type: "string",
      },
      () => {
        return new InputControl(actor, definition);
      },
    )
    .with(
      {
        type: "trigger",
        "x-event": P.string,
      },
      () => {
        return new ButtonControl(actor, definition);
      },
    )
    .with(
      {
        type: "integer",
        maximum: P.number,
        minimum: P.number,
      },
      {
        type: "number",
        maximum: P.number,
        minimum: P.number.gte(0),
      },
      () => {
        return new SliderControl(actor, definition);
      },
    )
    .otherwise(() => {
      return new JsonControl(actor, definition);
    });
};
