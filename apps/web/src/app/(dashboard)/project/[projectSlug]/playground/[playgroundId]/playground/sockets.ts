import { ClassicPreset } from "rete";

export class ActionSocket extends ClassicPreset.Socket {
  constructor() {
    super("Action");
  }

  __type = "ActionSocket";

  isCompatibleWith(socket: ClassicPreset.Socket) {
    return socket instanceof ActionSocket;
  }
}

export class TextSocket extends ClassicPreset.Socket {
  constructor() {
    super("Text");
  }

  __type = "TextSocket";

  isCompatibleWith(socket: ClassicPreset.Socket) {
    return socket instanceof TextSocket;
  }
}
