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

export const anySocket = new Socket("Any");
export const numberSocket = new Socket("Number");
export const booleanSocket = new Socket("Boolean");
export const arraySocket = new Socket("Array");
export const stringSocket = new Socket("String");
export const objectSocket = new Socket("Object");
export const triggerSocket = new Socket("Trigger");
export const eventSocket = new Socket("Event");
export const audioSocket = new Socket("Audio");
export const documentSocket = new Socket("Document");
export const embeddingSocket = new Socket("Embedding");
export const taskSocket = new Socket("Task");
export const imageSocket = new Socket("Image");
export const DatabaseIdSocket = new Socket("databaseIdSocket");

export type DatabaseIdSocket = typeof DatabaseIdSocket;

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
] as const;

export type Sockets = (typeof sockets)[number];

sockets.forEach((socket) => {
  anySocket.combineWith(socket);
  socket.combineWith(anySocket);
});
