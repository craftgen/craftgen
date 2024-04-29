import { useCallback } from "react";
import { ClassicPreset } from "rete";
import { match, P } from "ts-pattern";
import type { ActorRefFrom, AnyActorRef, SnapshotFrom } from "xstate";

import { BooleanControl } from "./controls/boolean";
import { ButtonControl } from "./controls/button";
import { CodeControl } from "./controls/code";
import { ComboboxControl } from "./controls/combobox";
import { DateControl } from "./controls/date";
import { FileControl } from "./controls/file";
import { InputControl } from "./controls/input.control";
import { JsonControl } from "./controls/json";
import { NodeControl } from "./controls/node";
import { NumberControl } from "./controls/number";
import { OpenAIThreadControl } from "./controls/openai-thread.control";
import { SelectControl } from "./controls/select";
import { SliderControl } from "./controls/slider";
import type { JSONSocket, socketSchema } from "./controls/socket-generator";
import { TextareControl } from "./controls/textarea";
import type { Message } from "./controls/thread.control";
import { ThreadControl } from "./controls/thread.control";
import type { NodeTypes } from "./types";
import { nodeTypes } from "./types";
import { JsCdnController } from "./controls/js-cdn";
import { JSONSchema, JSONSchemaDefinition } from "openai/lib/jsonschema.mjs";
import def from "ajv/dist/vocabularies/discriminator";
import { z } from "zod";
import { SecretController } from "./controls/secret";
import { inputSocketMachine } from "./input-socket";
import { outputSocketMachine } from "./output-socket";

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
  return Object.entries(sockets).find(([socketId, socket]) =>
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

interface SocketConfig {
  badge: string;
  color: string;
  connection: string;
}

export const socketConfig: Record<SocketNameType, SocketConfig> = {
  trigger: { badge: "bg-red-600", color: "bg-red-400", connection: "red" },
  any: { badge: "bg-gray-600", color: "bg-gray-400", connection: "gray" },
  number: {
    badge: "bg-indigo-600",
    color: "bg-indigo-400",
    connection: "indigo",
  },
  boolean: {
    badge: "bg-yellow-600",
    color: "bg-yellow-400",
    connection: "yellow",
  },
  array: { badge: "bg-green-600", color: "bg-green-400", connection: "green" },
  string: { badge: "bg-teal-600", color: "bg-teal-400", connection: "teal" },
  object: { badge: "bg-blue-600", color: "bg-blue-400", connection: "blue" },
  audio: {
    badge: "bg-purple-600",
    color: "bg-purple-400",
    connection: "purple",
  },
  document: {
    badge: "bg-violet-600",
    color: "bg-violet-400",
    connection: "violet",
  },
  embedding: { badge: "bg-cyan-600", color: "bg-cyan-400", connection: "cyan" },
  task: {
    badge: "bg-orange-600",
    color: "bg-orange-400",
    connection: "orange",
  },
  image: {
    badge: "bg-emerald-600",
    color: "bg-emerald-400",
    connection: "emerald",
  },
  databaseIdSocket: {
    badge: "bg-stone-600",
    color: "bg-stone-400",
    connection: "stone",
  },
  date: {
    badge: "bg-rose-600",
    color: "bg-rose-400",
    connection: "rose",
  },
  tool: {
    badge: "bg-lime-600",
    color: "bg-lime-400",
    connection: "lime",
  },
  thread: {
    badge: "bg-amber-600",
    color: "bg-amber-400",
    connection: "amber",
  },
};

export const useSocketConfig = (name: SocketNameType) => {
  const getConfig = useCallback((name: SocketNameType) => {
    return socketConfig[name] || socketConfig.any;
  }, []);
  return getConfig(name);
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
      (def) => {
        return new CodeControl(actor, def);
      },
    )
    .with(
      {
        type: "string",
        format: "secret",
      },
      (def) => {
        return new SecretController(actor, def);
      },
    )
    .with(
      {
        type: "string",
        "x-controller": "code",
        "x-language": P.string,
        "x-canChangeFormat": false,
      },
      (def) => {
        return new CodeControl(actor, def);
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
      (def) => {
        return new JsonControl(actor, def);
      },
    )
    .with(
      {
        type: "string",
        "x-controller": "combobox",
        allOf: P.array({ enum: P.array(P.string) }),
      },
      (def) => {
        return new ComboboxControl(actor, def);
      },
    )
    .with(
      {
        "x-controller": "select",
        allOf: P.array({ enum: P.array(P.any) }),
      },
      (def) => {
        return new SelectControl(actor, def);
      },
    )
    .with(
      {
        type: "integer",
      },
      {
        type: "number",
      },
      (definition) => {
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
      (def) => {
        return new ThreadControl(actor, def);
      },
    )
    .with(
      {
        type: "string",
      },
      (def) => {
        return new InputControl(actor, def);
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
      (def) => {
        return new SliderControl(actor, def);
      },
    )
    .otherwise((def) => {
      return new JsonControl(actor, def);
    });
  // return (
  //   match(definition)
  //     .with(
  //       {
  //         "x-actor-ref": P.any,
  //       },
  //       () => {
  //         return new NodeControl(
  //           actor,
  //           selector,
  //           {
  //             change: onChange,
  //           },
  //           definition,
  //         );
  //       },
  //     )
  //     .with(
  //       {
  //         type: "trigger",
  //         "x-event": P.string,
  //       },
  //       () => {
  //         return new ButtonControl(
  //           actor,
  //           selector,
  //           {
  //             onClick: () =>
  //               actor.send({
  //                 type: definition["x-event"]!,
  //               }),
  //           },
  //           definition,
  //         );
  //       },
  //     )
  //     .with(
  //       {
  //         type: "string",
  //         "x-controller": "textarea",
  //       },
  //       () => {
  //         return new TextareControl(
  //           actor,
  //           selector,
  //           {
  //             change: onChange,
  //           },
  //           definition,
  //         );
  //       },
  //     )
  //     .with(
  //       {
  //         "x-controller": "select",
  //       },
  //       () => {
  //         return new SelectControl(
  //           actor,
  //           selector,
  //           {
  //             change: onChange,
  //             placeholder:
  //               definition?.title ?? definition?.description ?? "Select value",
  //             values:
  //               (definition?.allOf?.[0] as any)?.enum?.map((v: any) => {
  //                 return {
  //                   key: v,
  //                   value: v,
  //                 };
  //               }) || [],
  //           },
  //           definition,
  //         );
  //       },
  //     )
  //     .with(
  //       {
  //         type: "string",
  //         "x-controller": "combobox",
  //         allOf: P.array({ enum: P.array(P.string) }),
  //       },
  //       () => {
  //         return new ComboboxControl(
  //           actor,
  //           selector,
  //           {
  //             change: onChange,
  //             values: definition?.allOf?.[0]?.enum?.map((v: any) => {
  //               return {
  //                 key: v,
  //                 value: v,
  //               };
  //             }),
  //           },
  //           definition,
  //         );
  //       },
  //     )
  //     .with(
  //       {
  //         type: "string",
  //         format: "uri",
  //       },
  //       () => {
  //         return new FileControl(
  //           actor,
  //           selector,
  //           {
  //             change: onChange,
  //           },
  //           definition,
  //         );
  //       },
  //     )
  //     .with(
  //       {
  //         "x-controller": "openai-thread-control",
  //       },
  //       () => {
  //         return new OpenAIThreadControl(actor, selector, {}, definition);
  //       },
  //     )
  //     .with(
  //       {
  //         type: "string",
  //         format: "expression",
  //       },
  //       () => {
  //         return new CodeControl(
  //           actor,
  //           selector,
  //           definitionSelector,
  //           {
  //             change: onChange,
  //           },
  //           definition,
  //         );
  //       },
  //     )
  //     .with(
  //       {
  //         type: "string",
  //         format: "secret",
  //       },
  //       () => {
  //         return new InputControl(
  //           actor,
  //           selector,
  //           definitionSelector,
  //           {
  //             change: onChange,
  //           },
  //           definition,
  //         );
  //       },
  //     )
  //     .with(
  //       {
  //         type: "string",
  //       },
  //       () => {
  //         return new InputControl(
  //           actor,
  //           selector,
  //           definitionSelector,
  //           {
  //             change: onChange,
  //           },
  //           definition,
  //         );
  //       },
  //     )
  //     // .with(
  //     //   {
  //     //     type: "integer",
  //     //     maximum: P.number,
  //     //     minimum: P.number,
  //     //   },
  //     //   {
  //     //     type: "number",
  //     //     maximum: P.number,
  //     //     minimum: P.number.gte(0),
  //     //   },
  //     //   (def) => {
  //     //     return new SliderControl(
  //     //       actor,
  //     //       selector,
  //     //       {
  //     //         change: onChange,
  //     //         max: def.maximum,
  //     //         min: def.minimum,
  //     //       },
  //     //       definition,
  //     //     );
  //     //   },
  //     // )
  //     .with(
  //       {
  //         type: "integer",
  //       },
  //       {
  //         type: "number",
  //       },
  //       (definition) => {
  //         return new NumberControl(
  //           actor,
  //           selector,
  //           {
  //             change: onChange,
  //             max: definition?.maximum,
  //             min: definition?.minimum,
  //           },
  //           definition,
  //         );
  //       },
  //     )
  //     .with(
  //       {
  //         type: "boolean",
  //       },
  //       () => {
  //         return new BooleanControl(
  //           actor,
  //           selector,
  //           {
  //             change: onChange,
  //           },
  //           definition,
  //         );
  //       },
  //     )
  //     .with(
  //       {
  //         type: "string",
  //         format: "date",
  //       },
  //       () => {
  //         return new DateControl(
  //           actor,
  //           selector,
  //           {
  //             change: onChange,
  //           },
  //           definition,
  //         );
  //       },
  //     )
  //     .with(
  //       {
  //         type: "array",
  //         "x-controller": "js-cdn",
  //       },
  //       () => {
  //         return new JsCdnController(
  //           actor,
  //           selector,
  //           {
  //             onChange,
  //           },
  //           definition,
  //         );
  //       },
  //     )
  //     .with(
  //       {
  //         type: "array",
  //         "x-controller": "thread",
  //       },
  //       () => {
  //         return new ThreadControl(
  //           actor,
  //           selector,
  //           {
  //             change: onChange,
  //           },
  //           definition,
  //         );
  //       },
  //     )
  //     .with(
  //       {
  //         type: "thread",
  //         "x-controller": "thread",
  //       },
  //       () => {
  //         return new ThreadControl(
  //           actor,
  //           selector,
  //           {
  //             change: onChange,
  //           },
  //           definition,
  //         );
  //       },
  //     )
  //     .otherwise(() => {
  //       return new JsonControl(
  //         actor,
  //         selector,
  //         {
  //           change: onChange,
  //         },
  //         definition,
  //       );
  //     })
  // );
};
