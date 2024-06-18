import type { JSONSchema } from "openai/lib/jsonschema.mjs";
import type { MergeDeep } from "type-fest";
import type { AnyActorRef, SnapshotFrom } from "xstate";
import * as z from "zod";

import type { JSONSocketPrimitiveTypeKeys, SocketNameType } from "../sockets";
import type { NodeTypes } from "../types";
import { BaseControl } from "./base";

export interface SocketGeneratorControlOptions {
  connectionType: "input" | "output";
  name: string;
  ignored: string[];
  tooltip: string;
  initial: {
    name: string;
    description: string;
  };
  onChange: (data: SocketGeneratorControlData) => void;
}
export type JSONSocket = z.infer<typeof socketSchema> & JSONSchema;
export type JSONSocketTypes = JSONSocketPrimitiveTypeKeys | NodeTypes;

export const actorConfigSchema = z.object({
  actorId: z.string().optional(),
  actor: z
    .custom<AnyActorRef>()
    .describe("The spawned actor reference.")
    .optional(),
  connections: z
    .record(z.string().describe("source"), z.string().describe("target"))
    .default({}),
  internal: z
    .record(z.string().describe("source"), z.string().describe("target"))
    .default({}),
});

export const actorConfigRecordSchema = z
  .record(
    z.custom<NodeTypes>().describe("Actor Name"),
    actorConfigSchema.optional(),
  )
  .default({})
  .optional();

export type ActorConfig = z.infer<typeof actorConfigSchema>;

export const connectionSchema = z.object({
  key: z
    .string()
    .describe(
      'The "x-key" of the socket relative to side its either inputKey or outputKey',
    ),
  actorRef: z
    .custom<AnyActorRef>()
    .describe("The actor reference from the Other side of the connection."),
});

export type ConnectionConfig = z.infer<typeof connectionSchema>;

export const connectionConfigRecordSchema = z
  .record(z.string().describe("nodeId"), connectionSchema)
  .default({})
  .optional();

export type ConnectionConfigRecord = z.infer<
  typeof connectionConfigRecordSchema
>;

export const socketSchema = z
  .object({
    name: z.string().min(1),
    type: z.custom<JSONSocketTypes>(),
    description: z.string().optional(),
    required: z.boolean().default(false).optional(),
    isMultiple: z.boolean().default(false).optional(),
    format: z.string().optional(),
    default: z
      .union([
        z.string().array(),
        z.number().array(),
        z.boolean().array(),
        z.string(),
        z.number(),
        z.boolean(),
        z.date(),
        z.date().array(),
        z.object({}).array(),
        z.object({}),
        z.null(),
        z.null().array(),
      ])
      .optional(),
    "x-order": z.number().optional(),

    "x-controller": z.string().optional(),

    "x-showSocket": z.boolean().default(true),
    "x-showController": z.boolean().default(true),
    "x-userDefined": z.boolean().default(false),

    "x-isAdvanced": z.boolean().default(false),
    "x-key": z.string().nonempty(),
    "x-event": z.string().optional(),
    "x-event-param-socket-keys": z.array(z.string()).optional(),

    // belongs to parent.
    // "x-actor": z.custom<AnyActor>().optional(),
    "x-actor-id": z.string().optional(),

    "x-actor-type": z.custom<NodeTypes>().optional(),

    // can be used to connect to other nodes actor.
    "x-actor-ref": z.custom<AnyActorRef>().optional(),
    "x-actor-ref-id": z.string().optional(),
    "x-actor-ref-type": z.custom<NodeTypes>().optional(),

    "x-actor-config": actorConfigRecordSchema,
    "x-connection": connectionConfigRecordSchema,
    "x-compatible": z.array(z.custom<JSONSocketTypes>()).default([]).optional(),

    // code editor related:
    "x-libraries": z.array(z.string()).optional(),
    "x-language": z.string().optional(),
    "x-canChangeFormat": z.boolean().default(true).optional(),

    allOf: z.array(z.custom<JSONSchema>()).optional(),
  })
  .superRefine((params, ctx) => {
    if (params.type === "trigger" && params["x-event"] === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Trigger socket must have an event",
        path: ["type"],
      });
    }
  });

export const generateSocket = <
  T extends string,
  TypeOfSocket extends SocketNameType,
>(
  socket: { "x-key": T; type: TypeOfSocket } & Partial<
    MergeDeep<JSONSchema, z.infer<typeof socketSchema>>
  >,
) => {
  const valid = socketSchema.parse(socket);
  if (!valid) throw new Error("Invalid socket");

  // Set the x-compatible field base on the x-actor-config
  if (socket["x-actor-config"]) {
    valid["x-compatible"] = Object.keys(
      socket["x-actor-config"],
    ) as NodeTypes[];
  }

  const res = {
    ...socket,
    ...valid,
    default: socket.default, // #TODO figure out why zod.parse eats the Object defaults.
    type: socket.type as TypeOfSocket,
    "x-key": socket["x-key"] as T,
  };
  return res as JSONSocket;
};

export type SocketGeneratorControlData = z.infer<typeof formOnSubmitSchema>;
export const formOnSubmitSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sockets: z.record(z.string(), socketSchema),
});

export class SocketGeneratorControl<
  T extends AnyActorRef = AnyActorRef,
> extends BaseControl {
  __type = "socket-generator";
  name: string;
  description?: string;
  constructor(
    public actor: T,
    public selector: (snapshot: SnapshotFrom<T>) => Record<string, JSONSocket>, // Function that returns the observable value
    public params: SocketGeneratorControlOptions,
    public definition?: JSONSocket,
  ) {
    super(300, definition, actor);
    this.name = params.initial.name;
    this.description = params.initial.description;
  }

  setValue(val: {
    sockets: Record<string, JSONSocket>;
    name: string;
    description?: string;
  }) {
    this.name = val.name;
    this.description = val.description;
    this.params.onChange(val);
  }
}

export const formSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sockets: z.array(socketSchema),
});
