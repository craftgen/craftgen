import { JSONSchema, JSONSchemaDefinition } from "openai/lib/jsonschema.mjs";
import { MergeDeep } from "type-fest";
import * as z from "zod";

import { types } from "../sockets";
import { BaseControl } from "./base";

export type SocketGeneratorControlOptions = {
  connectionType: "input" | "output";
  name: string;
  ignored: string[];
  tooltip: string;
  initial: {
    name: string;
    description: string;
    sockets: JSONSocket[];
  };
  onChange: (data: SocketGeneratorControlData) => void;
};

export type JSONSocket = MergeDeep<JSONSchema, z.infer<typeof socketSchema>>;

const sc = z.custom<JSONSchema>();

export const socketSchema = z.object({
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
  "x-showInput": z.boolean().default(true).optional(),
  "x-key": z.string(),
  "x-language": z.string().optional(),
});

export const generateSocket = (
  socket: MergeDeep<JSONSchema, z.infer<typeof socketSchema>>,
): JSONSocket => {
  const valid = socketSchema.parse(socket);
  if (!valid) throw new Error("Invalid socket");
  return {
    ...socket,
    ...valid,
  } as JSONSocket;
};

export type SocketGeneratorControlData = z.infer<typeof formSchema>;

export class SocketGeneratorControl extends BaseControl {
  __type = "socket-generator";
  name: string;
  description?: string;
  sockets: JSONSocket[] = [];
  constructor(public params: SocketGeneratorControlOptions) {
    super(300);
    this.sockets = params.initial.sockets;
    this.name = params.initial.name;
    this.description = params.initial.description;
  }

  setValue(val: { sockets: JSONSocket[]; name: string; description?: string }) {
    this.sockets = val.sockets;
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
