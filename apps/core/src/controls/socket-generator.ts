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

export type JSONSocket = z.infer<typeof socketSchema>;
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

export const socketSchema = z.object({
  name: z.string().min(1),
  type: z.enum(types),
  description: z.string().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  required: z.boolean().default(false),
});

export const formSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sockets: z.array(socketSchema),
});
