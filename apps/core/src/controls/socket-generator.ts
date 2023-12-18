import { JSONSchema, JSONSchemaDefinition } from "openai/lib/jsonschema.mjs";
import { MergeDeep } from "type-fest";
import { AnyActor, AnyActorRef, SnapshotFrom } from "xstate";
import * as z from "zod";

import { JSONSocketTypeKeys, types } from "../sockets";
import { BaseControl } from "./base";

export type SocketGeneratorControlOptions = {
  connectionType: "input" | "output";
  name: string;
  ignored: string[];
  tooltip: string;
  initial: {
    name: string;
    description: string;
  };
  onChange: (data: SocketGeneratorControlData) => void;
};

export type JSONSocket = MergeDeep<JSONSchema, z.infer<typeof socketSchema>>;

export const socketSchema = z
  .object({
    name: z.string().min(1),
    type: z.enum(types),
    required: z.boolean().default(false).optional(),
    isMultiple: z.boolean().default(false).optional(),
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
    "x-showSocket": z.boolean().default(true).optional(),
    "x-key": z.string(),
    "x-event": z.string().optional(),
    "x-actor": z.custom<AnyActor>().optional(),
    "x-actor-ref": z.custom<AnyActorRef>().optional(),
    "x-actor-type": z.string().optional(),
    // "x-connection": z.record(z.string(), z.string()).optional().default({}),
    "x-language": z.string().optional(),
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
  TypeOfSocket extends JSONSocketTypeKeys,
>(
  socket: { "x-key": T; type: TypeOfSocket } & MergeDeep<
    JSONSchema,
    z.infer<typeof socketSchema>
  >,
) => {
  const valid = socketSchema.parse(socket);
  if (!valid) throw new Error("Invalid socket");
  return {
    ...socket,
    ...valid,
    type: socket["type"] as TypeOfSocket,
    "x-key": socket["x-key"] as T,
  };
};

export type SocketGeneratorControlData = z.infer<typeof formOnSubmitSchema>;
export const formOnSubmitSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sockets: z.record(z.string(), socketSchema),
});

export class SocketGeneratorControl<
  T extends AnyActor = AnyActor,
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
