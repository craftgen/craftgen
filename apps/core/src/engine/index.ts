import type { DataflowEngineScheme } from "rete-engine";
import { DataflowEngine } from "rete-engine";

import type {
  ControlFlowEngineScheme} from "./control-flow-engine";
import {
  ControlFlowEngine
} from "./control-flow-engine";

export { ControlFlowEngine, DataflowEngine };

export const createControlFlowEngine = <
  Schemes extends ControlFlowEngineScheme,
>() => {
  const engine = new ControlFlowEngine<Schemes>(({ inputs, outputs }) => {
    return {
      inputs: () =>
        Object.entries(inputs)
          .filter(([_, input]) => input?.socket?.name === "trigger")
          .map(([name]) => name),
      outputs: () =>
        Object.entries(outputs)
          .filter(([_, input]) => input?.socket?.name === "trigger")
          .map(([name]) => name),
    };
  });
  return engine;
};

export const createDataFlowEngine = <
  Schemes extends DataflowEngineScheme,
>() => {
  const dataFlow = new DataflowEngine<Schemes>(({ inputs, outputs }) => {
    return {
      inputs: () =>
        Object.entries(inputs)
          .filter(([_, input]) => input?.socket?.name !== "trigger")
          .map(([name]) => name),
      outputs: () =>
        Object.entries(outputs)
          .filter(([_, input]) => input?.socket?.name !== "trigger")
          .map(([name]) => name),
    };
  });
  return dataFlow;
};
