import { ClassicPreset } from "rete";
import { Socket } from "./sockets";

export class Input<S extends Socket> extends ClassicPreset.Input<S> {
  constructor(
    socket: S,
    name: string,
    multiple = false,
    public showSocket = true
  ) {
    super(socket, name, multiple);
  }
}

export class Output<S extends Socket> extends ClassicPreset.Output<S> {
  constructor(
    socket: S,
    name: string,
    multiple = true,
    public showSocket =true 
  ) {
    super(socket, name, multiple);
  }
}
