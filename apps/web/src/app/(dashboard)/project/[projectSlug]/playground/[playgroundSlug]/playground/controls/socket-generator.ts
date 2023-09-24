import { ClassicPreset } from "rete";

import * as z from "zod";
import { types } from "../sockets";

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

export class SocketGeneratorControl extends ClassicPreset.Control {
  __type = "socket-generator";
  name: string;
  description?: string;
  sockets: JSONSocket[] = [];
  constructor(public params: SocketGeneratorControlOptions) {
    super();
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
  name: z.string().min(1).max(4),
  type: z.enum(types),
  description: z.string().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  required: z.boolean().default(false).optional(),
});

export const formSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sockets: z.array(socketSchema),
});
