import { Schemes } from "../types";
import { ControlFlowEngine } from "./control-flow-engine";
import { BaseNode } from "../nodes/base";

export interface EngineNode<T extends BaseNode<any>>
  extends ControlFlowEngineNode<T> {}

export interface ControlFlowEngineNode<T extends BaseNode<any>> {
  execute(
    input: keyof T["inputs"],
    forward: (output: keyof T["outputs"]) => void,
    execId?: string
  ): Promise<void>;
}

// export interface DataFlowEngineNode<T extends BaseNode<any>> {
//   data(inputs: Record<keyof T["inputs"], any[]>): any;
//   serialize(): any;
// }

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
