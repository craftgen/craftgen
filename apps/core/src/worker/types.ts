/**
 * This file contains the utility function to send and receive messages from the worker.
 * TRequestMessage<TBody> is used to send a request to/from the worker.
 * TResponseMessage<TBody> is used to send a response to/from the worker.
 * TDefaultMessage<TBody> is used to send a message to/from worker. Does not expect a response.
 */

export enum MessageType {
  REQUEST = "REQUEST",
  RESPONSE = "RESPONSE",
  DEFAULT = "DEFAULT",
}

interface TRequestMessage<TBody> {
  body: TBody;
  messageId: string;
  messageType: MessageType.REQUEST;
}

interface TResponseMessage<TBody> {
  body: TBody;
  messageId: string;
  messageType: MessageType.RESPONSE;
}

export interface TDefaultMessage<TBody> {
  messageId?: string;
  body: TBody;
  messageType: MessageType.DEFAULT;
}

export type TMessage<TBody> =
  | TRequestMessage<TBody>
  | TResponseMessage<TBody>
  | TDefaultMessage<TBody>;
export type TransmissionErrorHandler = (
  messageId: string,
  timeTaken: number,
  responseData: unknown,
  e: unknown,
) => void;

export interface WorkerRequest<TData, TActions> {
  method: TActions;
  data: TData;
}

export enum EVAL_WORKER_ACTION {
  EVAL_EXPRESSION = "EVAL_EXPRESSION",
  LOAD_LIBRARIES = "LOAD_LIBRARIES",
  INSTALL_LIBRARY = "INSTALL_LIBRARY",
  UNINSTALL_LIBRARY = "UNINSTALL_LIBRARY",
  RESET_JS_CONTEXT = "RESET_JS_CONTEXT",
}

export type EvalWorkerRequest<T = any> = WorkerRequest<T, EVAL_WORKER_ACTION>;
export type EvalWorkerResponse = EvalTreeResponseData | boolean | unknown;

export interface EvalTreeResponseData {
  errors: EvalError[];
}

export enum EvalErrorTypes {
  EVAL_PROPERTY_ERROR = "EVAL_PROPERTY_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
  PARSE_JS_ERROR = "PARSE_JS_ERROR",
  EXTRACT_DEPENDENCY_ERROR = "EXTRACT_DEPENDENCY_ERROR",
  SERIALIZATION_ERROR = "SERIALIZATION_ERROR",
}

export enum WorkerErrorTypes {
  CLONE_ERROR = "CLONE_ERROR",
}

export interface EvalError {
  type: EvalErrorTypes;
  message: string;
  context?: Record<string, any>;
}
