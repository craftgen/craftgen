import type { BaseNode } from "../nodes/base";

export type EngineNode<T extends BaseNode<any>> = ControlFlowEngineNode<T>;

export interface ControlFlowEngineNode<T extends BaseNode<any>> {
  execute(
    input: keyof T["inputs"],
    forward: (output: keyof T["outputs"]) => void,
    execId?: string,
  ): Promise<void>;
}
