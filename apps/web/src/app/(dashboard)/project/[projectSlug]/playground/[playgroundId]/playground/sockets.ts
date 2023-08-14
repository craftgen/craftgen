import { ClassicPreset } from "rete";

export class Socket extends ClassicPreset.Socket {
  compatible: Socket[] = [];

  combineWith(socket: Socket) {
    this.compatible.push(socket);
  }

  isCompatibleWith(socket: Socket) {
    return this === socket || this.compatible.includes(socket);
  }
}

export const triggerSocket = new Socket("Trigger");

export const anySocket = new Socket("Any");

export const numberSocket = new Socket("Number");
export const booleanSocket = new Socket("Boolean");
export const arraySocket = new Socket("Array");
export const stringSocket = new Socket("String");
export const objectSocket = new Socket("Object");
export const eventSocket = new Socket("Event");
export const audioSocket = new Socket("Audio");
export const documentSocket = new Socket("Document");
export const embeddingSocket = new Socket("Embedding");
export const taskSocket = new Socket("Task");
export const imageSocket = new Socket("Image");
export const databaseIdSocket = new Socket("databaseIdSocket");

databaseIdSocket.combineWith(stringSocket);

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
] as const;

sockets.forEach((socket) => {
  anySocket.combineWith(socket);
  socket.combineWith(anySocket);
});

export type Sockets = (typeof sockets)[number];
