import { useCallback } from "react";
import { ClassicPreset } from "rete";
import { match, P } from "ts-pattern";

import { DateControl } from "./controls/date";
import { InputControl } from "./controls/input.control";
import { JsonControl } from "./controls/json";
import { NumberControl } from "./controls/number";
import { JSONSocket } from "./controls/socket-generator";

export class Socket extends ClassicPreset.Socket {
  name: SocketNameType;

  constructor(name: SocketNameType) {
    super(name);
    this.name = name;
  }

  compatible: Socket[] = [];

  combineWith(socket: Socket) {
    this.compatible.push(socket);
  }

  isCompatibleWith(socket: Socket) {
    return this === socket || this.compatible.includes(socket);
  }
}
export class TriggerSocket extends Socket {
  constructor() {
    super("Trigger");
  }
}

export const triggerSocket = new TriggerSocket();

class AnySocket extends Socket {
  constructor() {
    super("Any");
  }
}
export const anySocket = new AnySocket();

export class NumberSocket extends Socket {
  constructor() {
    super("Number");
  }
}
export const numberSocket = new NumberSocket();

class BooleanSocket extends Socket {
  constructor() {
    super("Boolean");
  }
}
export const booleanSocket = new BooleanSocket();

class ArraySocket extends Socket {
  constructor() {
    super("Array");
  }
}
export const arraySocket = new ArraySocket();

export class StringSocket extends Socket {
  constructor() {
    super("String");
  }
}
export const stringSocket = new StringSocket();

class ObjectSocket extends Socket {
  constructor() {
    super("Object");
  }
}
export const objectSocket = new ObjectSocket();

class EventSocket extends Socket {
  constructor() {
    super("Event");
  }
}
export const eventSocket = new EventSocket();

class AudioSocket extends Socket {
  constructor() {
    super("Audio");
  }
}
export const audioSocket = new AudioSocket();

class DocumentSocket extends Socket {
  constructor() {
    super("Document");
  }
}
export const documentSocket = new DocumentSocket();

class EmbeddingSocket extends Socket {
  constructor() {
    super("Embedding");
  }
}
export const embeddingSocket = new EmbeddingSocket();

class TaskSocket extends Socket {
  constructor() {
    super("Task");
  }
}
export const taskSocket = new TaskSocket();

class ImageSocket extends Socket {
  constructor() {
    super("Image");
  }
}
export const imageSocket = new ImageSocket();

class DatabaseIdSocket extends Socket {
  constructor() {
    super("databaseIdSocket");
  }
}
export const databaseIdSocket = new DatabaseIdSocket();

databaseIdSocket.combineWith(stringSocket);

class DateSocket extends Socket {
  constructor() {
    super("Date");
  }
}

export const dateSocket = new DateSocket();

const sockets = [
  numberSocket,
  booleanSocket,
  stringSocket,
  arraySocket,
  objectSocket,
  eventSocket,
  audioSocket,
  documentSocket,
  embeddingSocket,
  taskSocket,
  imageSocket,
  databaseIdSocket,
  dateSocket,
] as const;

export type AllSockets = (typeof sockets)[number];

export type SocketNameType =
  | "Trigger"
  | "Any"
  | "Number"
  | "Boolean"
  | "Array"
  | "String"
  | "Object"
  | "Event"
  | "Audio"
  | "Document"
  | "Embedding"
  | "Task"
  | "Image"
  | "databaseIdSocket"
  | "Date";

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
  | "taskSocket"
  | "documentSocket"
  | "databaseIdSocket"
  | "dateSocket";

export const socketNameMap: Record<SocketNameType, SocketType> = {
  Any: "anySocket",
  Number: "numberSocket",
  Boolean: "booleanSocket",
  Array: "arraySocket",
  String: "stringSocket",
  Object: "objectSocket",
  Trigger: "triggerSocket",
  Event: "eventSocket",
  Audio: "audioSocket",
  Document: "documentSocket",
  Embedding: "embeddingSocket",
  Task: "taskSocket",
  Image: "imageSocket",
  databaseIdSocket: "databaseIdSocket",
  Date: "dateSocket",
};

export const types = [
  "string",
  "number",
  "boolean",
  "any",
  "array",
  "object",
  "date",
] as const;

export type SocketTypeMap = {
  string: string;
  number: number;
  boolean: boolean;
  any: any;
  array: any[]; // Replace 'any' with a more specific type if needed
  object: object; // Replace 'object' with a more specific type if needed
  date: Date; // Assuming you want to map "date" to JavaScript Date object
};

export type JSONSocketTypeKeys = (typeof types)[number];

type KeyNames<T extends JSONSocket[]> = T[number]["name"];
export type MappedType<T extends JSONSocket[]> = {
  [K in KeyNames<T>]: SocketTypeMap[Extract<T[number], { name: K }>["type"]];
};

export const getSocketByJsonSchemaType = (type: (typeof types)[number]) => {
  switch (type) {
    case "string":
      return stringSocket;
    case "number":
      return numberSocket;
    case "boolean":
      return booleanSocket;
    case "array":
      return arraySocket;
    case "object":
      return objectSocket;
    case "date":
      return dateSocket;
    default:
      return anySocket;
  }
};

type SocketConfig = {
  badge: string;
  color: string;
  connection: string;
};

export const socketConfig: Record<SocketNameType, SocketConfig> = {
  Trigger: { badge: "bg-red-600", color: "bg-red-400", connection: "red" },
  Any: { badge: "bg-gray-600", color: "bg-gray-400", connection: "gray" },
  Number: {
    badge: "bg-indigo-600",
    color: "bg-indigo-400",
    connection: "indigo",
  },
  Boolean: {
    badge: "bg-yellow-600",
    color: "bg-yellow-400",
    connection: "yellow",
  },
  Array: { badge: "bg-green-600", color: "bg-green-400", connection: "green" },
  String: { badge: "bg-teal-600", color: "bg-teal-400", connection: "teal" },
  Object: { badge: "bg-blue-600", color: "bg-blue-400", connection: "blue" },
  Event: { badge: "bg-pink-600", color: "bg-pink-400", connection: "pink" },
  Audio: {
    badge: "bg-purple-600",
    color: "bg-purple-400",
    connection: "purple",
  },
  Document: {
    badge: "bg-violet-600",
    color: "bg-violet-400",
    connection: "violet",
  },
  Embedding: { badge: "bg-cyan-600", color: "bg-cyan-400", connection: "cyan" },
  Task: {
    badge: "bg-orange-600",
    color: "bg-orange-400",
    connection: "orange",
  },
  Image: {
    badge: "bg-emerald-600",
    color: "bg-emerald-400",
    connection: "emerald",
  },
  databaseIdSocket: {
    badge: "bg-stone-600",
    color: "bg-stone-400",
    connection: "stone",
  },
  Date: {
    badge: "bg-rose-600",
    color: "bg-rose-400",
    connection: "rose",
  },
};

export const useSocketConfig = (name: SocketNameType) => {
  const getConfig = useCallback((name: SocketNameType) => {
    return socketConfig[name];
  }, []);
  return getConfig(name);
};

sockets.forEach((socket) => {
  if (socket.name === "Trigger") return;
  anySocket.combineWith(socket);
  socket.combineWith(anySocket);
});

export type Sockets = (typeof sockets)[number];

export const getControlBySocket = (
  socket: AllSockets,
  value: () => any,
  onChange: (v: any) => void,
) => {
  return match(socket)
    .with(P.instanceOf(StringSocket), () => {
      return new InputControl(value, {
        change: onChange,
      });
    })
    .with(P.instanceOf(NumberSocket), () => {
      return new NumberControl(value, {
        change: onChange,
      });
    })
    .with(P.instanceOf(DateSocket), () => {
      return new DateControl(value, {
        change: onChange,
      });
    })
    .otherwise(() => {
      return new JsonControl(value, {
        change: onChange,
      });
    });
};
