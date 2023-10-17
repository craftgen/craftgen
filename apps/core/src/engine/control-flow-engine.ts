import { GetSchemes, NodeEditor, NodeId, Root, Scope } from "rete";

import { ControlFlow } from "./control-flow";
import { ClassicScheme } from "./types";

export type ControlFlowEngineScheme = GetSchemes<
  ClassicScheme["Node"] & {
    execute(
      input: string,
      forward: (output: string, execId?: string) => void,
      execId?: string
    ): void;
  },
  ClassicScheme["Connection"]
>;

type Configure<Schemes extends ControlFlowEngineScheme> = (
  node: Schemes["Node"]
) => {
  inputs: () => string[];
  outputs: () => string[];
};

/**
 * ControlFlowEngine is a plugin that integrates ControlFlow with NodeEditor making it easy to use
 * @priority 9
 * @listens nodecreated
 * @listens noderemoved
 */
export class ControlFlowEngine<
  Schemes extends ControlFlowEngineScheme
> extends Scope<never, [Root<Schemes>]> {
  editor!: NodeEditor<Schemes>;
  controlflow!: ControlFlow<Schemes>;

  /**
   * @param configure Allows to specify which inputs and outputs are part of the control flow
   */
  constructor(private configure?: Configure<Schemes>) {
    super("control-flow-engine");

    this.addPipe((context) => {
      if (context.type === "nodecreated") {
        this.add(context.data);
      }
      if (context.type === "noderemoved") {
        this.remove(context.data);
      }
      return context;
    });
  }

  setParent(scope: Scope<Root<Schemes>>): void {
    super.setParent(scope);

    this.editor = this.parentScope<NodeEditor<Schemes>>(NodeEditor);
    this.controlflow = new ControlFlow(this.editor);
  }

  private add(node: Schemes["Node"]) {
    const options = this.configure
      ? this.configure(node)
      : {
          inputs: () => Object.keys(node.inputs),
          outputs: () => Object.keys(node.outputs),
        };

    this.controlflow.add(node, {
      inputs: options.inputs,
      outputs: options.outputs,
      execute: (input, forward, execId) => {
        const forwardWithExecId = (output: string) => forward(output, execId);
        node.execute(String(input), forwardWithExecId, execId);
      },
    });
  }

  private remove(node: Schemes["Node"]) {
    this.controlflow.remove(node.id);
  }

  /**
   * Trigger execution starting from the specified node.
   * @param nodeId Node id
   * @param input Input key that will be considered as the initiator of the execution
   */
  public execute(nodeId: NodeId, input?: string, execId?: string) {
    this.controlflow.execute(nodeId, input, execId);
  }
}
