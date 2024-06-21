/* eslint-disable no-console */
import { uniqueId } from "lodash-es";

import {
  EVAL_WORKER_ACTION,
  MessageType,
  TMessage,
  WorkerErrorTypes,
} from "./types";
import { getErrorMessage } from "./worker-internal/error";

type TPromiseResponse =
  | {
      data: any;
      error: null;
    }
  | {
      error: { message: string; errorBody: unknown };
      data: null;
    };

/**
 * This function should be used to send messages to the worker and back.
 * Purpose: To have some standardization in the messages that are transferred.
 * TODO: Add support for window postMessage options
 * TODO: Add support for transferable objects.
 */
function sendMessage(
  this: Worker | typeof globalThis,
  message: TMessage<unknown>,
) {
  this.postMessage(message);
}

async function responseHandler(
  worker: Worker,
  requestId: string,
): Promise<TPromiseResponse> {
  return new Promise((resolve) => {
    const listener = (event: MessageEvent) => {
      const { body, messageId, messageType } = event.data;
      if (messageId === requestId && messageType === MessageType.RESPONSE) {
        resolve(body.data);
        worker.removeEventListener("message", listener);
      }
    };

    worker.addEventListener("message", listener);
  });
}

export type TransmissionErrorHandler = (
  messageId: string,
  timeTaken: number,
  responseData: unknown,
  e: unknown,
) => void;
const defaultErrorHandler: TransmissionErrorHandler = (
  messageId: string,
  timeTaken: number,
  responseData: unknown,
  e: unknown,
) => {
  console.error(e);
  sendMessage.call(self, {
    messageId,
    messageType: MessageType.RESPONSE,
    body: {
      timeTaken: timeTaken.toFixed(2),
      data: {
        errors: [
          {
            type: WorkerErrorTypes.CLONE_ERROR,
            message: (e as Error)?.message,
            errorMessage: getErrorMessage(
              e as Error,
              WorkerErrorTypes.CLONE_ERROR,
            ),
            context: JSON.stringify(responseData),
          },
        ],
      },
    },
  });
};

class Postoffice {
  private readonly messenger: WorkerMessenger;

  constructor(messenger: WorkerMessenger) {
    this.messenger = messenger;
  }

  async sendScript(value: string, ...args: any[]) {
    return await this.messenger.request(EVAL_WORKER_ACTION.EVAL_EXPRESSION, {
      expression: value,
      evalArguments: args,
    });
  }

  async loadLibraries() {
    return await this.messenger.request(EVAL_WORKER_ACTION.LOAD_LIBRARIES, []);
  }

  async resetJSContext() {
    return await this.messenger.request(
      EVAL_WORKER_ACTION.RESET_JS_CONTEXT,
      {},
    );
  }

  async installLibrary(library: string) {
    const data = await this.messenger.request(
      EVAL_WORKER_ACTION.INSTALL_LIBRARY,
      {
        url: library,
        takenAccessors: [],
        takenNamesMap: {},
      },
    );

    if (!data.defs["!name"]) {
      return null;
    }

    return data;
  }

  async uninstallLibrary(libraryDef: { accessor: string }) {
    await this.messenger.request(EVAL_WORKER_ACTION.UNINSTALL_LIBRARY, [
      libraryDef.accessor,
    ]);
  }
}

export class WorkerMessenger {
  private _ready = false;
  private readonly _worker: Worker;
  readonly postoffice: Postoffice;

  constructor(worker: Worker) {
    this._worker = worker;
    this.start = this.start.bind(this);
    this._broker = this._broker.bind(this);
    this.request = this.request.bind(this);
    this.postoffice = new Postoffice(this);
  }

  /**
   * Start a new worker and registers our broker.
   * Note: If the worker is already running, this is a no-op
   */
  start() {
    if (this._ready) return;
    this._worker.addEventListener("message", this._broker);
    this._ready = true;
  }

  destroy() {
    this._worker.terminate();
  }

  async request(method: string, data = {}): Promise<any> {
    const messageId = uniqueId(`request-${method}-`);
    console.log("REQUEST ==>", {
      messageId,
      messageType: MessageType.REQUEST,
      body: { method, data },
    });
    sendMessage.call(this._worker, {
      messageId,
      messageType: MessageType.REQUEST,
      body: { method, data },
    });

    const response = await responseHandler(this._worker, messageId);
    console.log("RESPONSE ==>", response);
    return response;
  }

  /**
   * Worker api to respond to a request.
   */
  static respond(
    messageId: string,
    data: unknown,
    timeTaken: number,
    onErrorHandler?: TransmissionErrorHandler,
  ) {
    try {
      sendMessage.call(self, {
        messageId,
        messageType: MessageType.RESPONSE,
        body: { data, timeTaken },
      });
    } catch (e) {
      const errorHandler = onErrorHandler || defaultErrorHandler;
      try {
        errorHandler(messageId, timeTaken, data, e);
      } catch {
        defaultErrorHandler(messageId, timeTaken, data, e);
      }
    }
  }

  private _broker(event: MessageEvent<TMessage<any>>) {
    if (!event || !event.data) return;
    const { messageType } = event.data;

    if (messageType === MessageType.REQUEST) {
      // this.listenerChannel.put(event.data);
    }

    if (messageType === MessageType.RESPONSE) {
      const { messageId } = event.data;
      if (!messageId) return;

      // const ch = this._channels.get(messageId);
      // if (ch) {
      //     ch.put(body);
      //     this._channels.delete(messageId);
      // }
    }
  }
}
