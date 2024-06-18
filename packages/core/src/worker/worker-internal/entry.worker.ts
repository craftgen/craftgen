import { resetJSLibraries } from "../js-library/reset-js-libraries";
import { WorkerMessenger } from "../messenger";
import {
  EVAL_WORKER_ACTION,
  EvalWorkerRequest,
  MessageType,
  TMessage,
  TransmissionErrorHandler,
} from "../types";
import evalExpression from "./handlers/evalExpression";
import {
  installLibrary,
  loadLibraries,
  uninstallLibrary,
} from "./handlers/jsLibrary";

const handlerMap: Record<EVAL_WORKER_ACTION, (req: EvalWorkerRequest) => any> =
  {
    [EVAL_WORKER_ACTION.EVAL_EXPRESSION]: evalExpression,
    [EVAL_WORKER_ACTION.LOAD_LIBRARIES]: loadLibraries,
    [EVAL_WORKER_ACTION.INSTALL_LIBRARY]: installLibrary,
    [EVAL_WORKER_ACTION.UNINSTALL_LIBRARY]: uninstallLibrary,
    [EVAL_WORKER_ACTION.RESET_JS_CONTEXT]: resetJSLibraries,
  };

const transmissionErrorHandlerMap: Partial<
  Record<EVAL_WORKER_ACTION, TransmissionErrorHandler>
> = {
  //
};

async function asyncRequestMessageListener(
  e: MessageEvent<TMessage<EvalWorkerRequest>>,
) {
  const { messageType } = e.data;
  if (messageType !== MessageType.REQUEST) return;

  const start = performance.now();
  const { body, messageId } = e.data;
  const { method } = body;
  if (!method) return;

  const messageHandler = handlerMap[method];
  if (typeof messageHandler !== "function") return;

  const data = await messageHandler(body);
  const end = performance.now();

  const transmissionErrorHandler = transmissionErrorHandlerMap[method];
  WorkerMessenger.respond(
    messageId,
    data,
    end - start,
    transmissionErrorHandler,
  );
}

self.addEventListener("message", asyncRequestMessageListener);
