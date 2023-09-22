import { ControlFlowEngine, DataflowEngine } from "rete-engine";
import { Schemes } from "./types";

export const createControlFlowEngine = () => {
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

export const createDataFlowEngine = () => {
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
