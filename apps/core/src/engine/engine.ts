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
