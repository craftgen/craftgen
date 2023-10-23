import {
  ControlFlowEngine,
  ControlFlowEngineScheme,
} from "./control-flow-engine";
import { DataflowEngine, DataflowEngineScheme } from "rete-engine";

export { ControlFlowEngine, DataflowEngine };

export const createControlFlowEngine = <
  Schemes extends ControlFlowEngineScheme
>() => {
  const engine = new ControlFlowEngine<Schemes>(({ inputs, outputs }) => {
    return {
      inputs: () =>
        Object.entries(inputs)
          .filter(([_, input]) => input?.socket?.name === "Trigger")
          .map(([name]) => name),
      outputs: () =>
        Object.entries(outputs)
          .filter(([_, input]) => input?.socket?.name === "Trigger")
          .map(([name]) => name),
    };
  });
  return engine;
};

export const createDataFlowEngine = <
  Schemes extends DataflowEngineScheme
>() => {
  const dataFlow = new DataflowEngine<Schemes>(({ inputs, outputs }) => {
    return {
      inputs: () =>
        Object.entries(inputs)
          .filter(([_, input]) => input?.socket?.name !== "Trigger")
          .map(([name]) => name),
      outputs: () =>
        Object.entries(outputs)
          .filter(([_, input]) => input?.socket?.name !== "Trigger")
          .map(([name]) => name),
    };
  });
  return dataFlow;
};
