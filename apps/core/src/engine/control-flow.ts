import type { NodeEditor, NodeId } from "rete";

import type { ClassicScheme } from "./types";

/**
 * ControlFlowNodeSetup is a set of functions that define how to execute a node.
 */
export interface ControlFlowNodeSetup<
  T extends ClassicScheme["Node"],
  I extends (keyof T["inputs"])[] = string[],
  O extends (keyof T["outputs"])[] = string[],
> {
  /** Specifies the inputs which are part of the control flow */
  inputs: () => I;
  /** Specifies the outputs which are part of the control flow */
  outputs: () => O;
  /** Called when the node received control from the previous node */
  execute(
    input: I[number],
    forward: (output: O[number], execId?: string) => any,
    execId?: string,
  ): any;
}

/**
 * ControlFlow is a class that allows to execute nodes in a graph using Control flow approach.
 * @priority 7
 */
export class ControlFlow<Schemes extends ClassicScheme> {
  setups = new Map<NodeId, ControlFlowNodeSetup<any, any, any>>();

  /**
   * @param editor NodeEditor instance
   */
  constructor(private editor: NodeEditor<Schemes>) {}

  /**
   * Adds the node to the control flow.
   * @param node Node instance
   * @param setup Set of functions that define how to execute the node
   */
  public add<T extends Schemes["Node"]>(
    node: T,
    setup: ControlFlowNodeSetup<
      T,
      (keyof T["inputs"])[],
      (keyof T["outputs"])[]
    >,
  ) {
    const affected = this.setups.get(node.id);

    if (affected) {
      throw new Error("already processed");
    }
    this.setups.set(node.id, setup);
  }

  /**
   * Removes the node from the control flow.
   * @param nodeId Node id
   */
  public remove(nodeId: NodeId) {
    this.setups.delete(nodeId);
  }

  /**
   * Execute the node and its successors (in case `forward` is called for some output).
   * @param nodeId Node id
   * @param input Input key that will be considered as the initiator of the execution
   */
  public execute(nodeId: NodeId, input?: string, execId?: string) {
    const setup = this.setups.get(nodeId);

    if (!setup) throw new Error("node is not initialized");
    const inputKeys = setup.inputs();

    console.log("EXECUTER", {
      nodeId,
      input,
      inputKeys,
    });

    if (input && !inputKeys.includes(input))
      throw new Error("inputs don't have a key");

    setup.execute(
      input,
      (output) => {
        const outputKeys = setup.outputs();

        if (!outputKeys.includes(output))
          throw new Error("outputs don't have a key");

        const cons = this.editor.getConnections().filter((c) => {
          return c.source === nodeId && c.sourceOutput === output;
        });

        cons.forEach((con) => {
          this.execute(con.target, con.targetInput, execId);
        });
      },
      execId,
    );
  }
}
