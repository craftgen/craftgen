import { ClassicPreset } from "rete";
import { DiContainer } from "../editor";
import {
  Actor,
  AnyStateMachine,
  MachineImplementationsFrom,
  StateFrom,
  createActor,
} from "xstate";
import { debounce, isEqual } from "lodash-es";
import {
  getExecutionNode,
  setContext,
  updateExecutionNode,
} from "../../action";
import { AllSockets, Socket } from "../sockets";
import { NodeTypes } from "../types";
import { z } from "zod";
import { selectWorkflowNodeSchema } from "@seocraft/supabase/db";
import { BaseControl } from "../controls/base";

export type NodeData<T extends AnyStateMachine> = z.infer<
  typeof selectWorkflowNodeSchema
> & {
  workflowVersionId?: string;
  context: {
    state?: StateFrom<T>;
  };
};

export class BaseNode<
  Machine extends AnyStateMachine,
  Inputs extends {
    [key in string]?: AllSockets;
  } = {
    [key in string]?: AllSockets;
  },
  Outputs extends {
    [key in string]?: AllSockets;
  } = {
    [key in string]?: AllSockets;
  },
  Controls extends {
    [key in string]?: BaseControl & { name?: string };
  } = {
    [key in string]?: BaseControl & { name?: string };
  }
> extends ClassicPreset.Node<Inputs, Outputs, Controls> {
  public di: DiContainer;

  public actor: Actor<AnyStateMachine>;

  public state: "idle" | "running" | "error" = "idle";

  public width = 200;
  public height = 200;

  readonly workflowId: string;
  readonly workflowVersionId: string;
  readonly contextId: string;
  readonly projectId: string;

  public count = 0;

  constructor(
    public readonly ID: NodeTypes,
    di: DiContainer,
    public nodeData: NodeData<Machine>,
    public machine: Machine,
    public machineImplements: MachineImplementationsFrom<Machine>
  ) {
    super(nodeData.label);
    if (nodeData.width) this.width = nodeData.width;
    if (nodeData.height) this.height = nodeData.height;
    this.workflowVersionId = nodeData.workflowVersionId;
    this.workflowId = nodeData.workflowId;
    this.contextId = nodeData.contextId;
    this.projectId = nodeData.projectId;

    this.id = nodeData.id;
    this.di = di;
    const a = this.machine.provide(this.machineImplements as any);
    this.actor = createActor(a, {
      id: this.contextId,
      ...(this.nodeData?.context?.state !== null && {
        state: this.nodeData.context?.state,
      }), // This needs to be stay state.
    });

    const saveDebounced = debounce((state: string) => {
      setContext({ contextId: this.contextId, state });
    }, 1000);

    let prev = this.actor.getSnapshot();
    this.actor.subscribe(async (state) => {
      this.state = state.value as any;
      if (!isEqual(prev.context.outputs, state.context.outputs)) {
        this.di.dataFlow?.cache.delete(this.id); // reset cache for this node.
        await this.updateAncestors();
      }
      prev = state;

      if (!this.di.readonly?.enabled) {
        saveDebounced(JSON.stringify(state));
      }
    });

    this.actor.start();
  }

  public async updateAncestors() {
    // console.group("updateAncestors", this.ID, this.id);
    const outgoers = this.di.graph.outgoers(this.id).nodes();
    for (const node of outgoers) {
      // console.log("calling data on", node.ID, node.id);
      const inputs = (await this.di.dataFlow?.fetchInputs(node.id)) as any; // reset cache for this node.
      await node.compute(inputs);
    }

    // console.groupEnd();
  }

  private async getExecutionState({ executionId }: { executionId: string }) {
    const { data: executionState } = await getExecutionNode({
      contextId: this.contextId,
      projectId: this.projectId,
      workflowId: this.workflowId,
      workflowVersionId: this.workflowVersionId,
      workflowExecutionId: executionId,
      workflowNodeId: this.id,
    });
    if (!executionState) throw new Error("Execution state not created");
    return executionState;
  }

  async execute(
    input: any,
    forward: (output: "trigger") => void,
    executionId: string
  ) {
    const executionState = await this.getExecutionState({ executionId });
    // console.log("STATE", { executionState });
    const a = this.machine.provide(this.machineImplements as any);
    this.actor = createActor(a, {
      state: executionState?.state,
      devTools: true,
    });
    const subs = this.actor.subscribe({
      next: async (state) => {
        await updateExecutionNode({
          id: executionState?.id,
          state: JSON.stringify(state),
        });
      },
      complete: async () => {
        console.log("finito");
        forward("trigger");
        const snap = this.actor.getSnapshot();
        await updateExecutionNode({
          id: executionState?.id,
          state: JSON.stringify(snap),
          complete: true,
        });
        subs.unsubscribe();
        const a = this.machine.provide(this.machineImplements as any);
        this.actor = createActor(a, {
          id: this.contextId,
          ...(this.nodeData?.context?.state !== null && {
            // state: this.nodeData.context?.state,
            input: {
              ...snap.context,
            },
          }), // This needs to be stay state.
        });

        const saveDebounced = debounce((state: string) => {
          setContext({ contextId: this.contextId, state });
        }, 1000);

        this.actor.subscribe((state) => {
          this.state = state.value as any;
          if (this.di.readonly?.enabled) return;
          saveDebounced(JSON.stringify(state));
        });

        this.actor.start();
      },
    });
    this.actor.start();
    const inputs = await this.getInputs();
    console.log("INPUTS", inputs);
    this.actor.send({
      type: "RUN",
      inputs,
    });
    console.log("complete", this.ID, this.actor.getSnapshot().context.outputs);
  }

  get identifier() {
    return `${this.ID}-${this.id.substring(5, 10)}`;
  }
  /**
   * This function should be sync
   * @returns The outputs of the current node.
   */
  async data(inputs?: any) {
    const state = this.actor.getSnapshot();
    this.count++;
    return state.context.outputs;
  }

  async compute(inputs: any) {
    // this.debug.log("process", inputs);
  }

  get minHeightForControls(): number {
    let min = 200;
    Object.values(this.controls).forEach((control) => {
      control?.minHeight && (min += control.minHeight);
    });

    return min;
  }

  public setSize(size: { width: number; height: number }) {
    this.width = size.width;
    this.height = size.height;
  }

  get size() {
    return {
      width: this.width,
      height: this.height,
    };
  }

  async setInputs(inputs: Record<string, Socket>) {
    const newInputs = Object.entries(inputs);
    newInputs.forEach(([key, socket]) => {
      if (this.hasInput(key)) {
        if (this.inputs[key]?.socket.name !== socket.name) {
          this.inputs[key]?.socket;
        }
      } else {
        this.addInput(key, new ClassicPreset.Input(socket as any, key, false));
      }
    });

    Object.entries(this.inputs).forEach(async ([key, input]) => {
      if (input?.socket.name === "Trigger") return;
      if (!newInputs.find(([k]) => k === key)) {
        await Promise.all(
          this.di.editor
            .getConnections()
            .filter((c) => c.target === this.id && c.targetInput === key)
            .map(async (c) => {
              await this.di.editor.removeConnection(c.id);
            })
        );
        this.removeInput(key);
      }
    });
  }

  async setOutputs(outputs: Record<string, Socket>) {
    const newOutputs = Object.entries(outputs);
    newOutputs.forEach(([key, socket]) => {
      if (this.hasOutput(key)) {
        if (this.outputs[key]?.socket.name !== socket.name) {
          this.outputs[key]?.socket;
        }
      } else {
        this.addOutput(
          key,
          new ClassicPreset.Output(socket as any, key, false)
        );
      }
    });

    Object.entries(this.outputs).forEach(async ([key, output]) => {
      if (output?.socket.name === "Trigger") return;
      if (!newOutputs.find(([k]) => k === key)) {
        await Promise.all(
          this.di.editor
            .getConnections()
            .filter((c) => c.source === this.id && c.sourceOutput === key)
            .map(async (c) => {
              await this.di.editor.removeConnection(c.id);
            })
        );
        this.removeOutput(key);
      }
    });
  }

  /**
   * This function waits for the actor's state to match a given state value.
   * It subscribes to the actor's state changes and checks if the new state matches the given state value.
   * If the state does not match, it waits for 500ms before checking again.
   * Once the state matches the given value, it unsubscribes from the actor's state changes.
   * If the state does not match the given value within 30 seconds, it throws an error.
   *
   * @param {string} stateValue - The state value to wait for.
   */
  async waitForState(actor: Actor<AnyStateMachine>, stateValue: string) {
    let state = actor.getSnapshot();
    const sub = actor.subscribe((newState) => {
      state = newState;
    });
    const startTime = Date.now();
    while (!state.matches(stateValue)) {
      console.log("waiting for complete", this.ID, state.value);
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (Date.now() - startTime > 30000) {
        sub.unsubscribe();
        throw new Error(
          `State did not match the given value '${stateValue}' within 30 seconds`
        );
      }
    }
    sub.unsubscribe();
  }

  /**
   * This function retrieves the inputs for the current node.
   * It first resets the data flow, then fetches the inputs for the current node id.
   * It then iterates over the inputs and if an input does not exist and has a control, it sets the input to the corresponding value from the actor's state context.
   * After that, it normalizes the inputs based on whether the input accepts multiple connections.
   * If an input does not accept multiple connections and its value is an array, it flattens the value to the first element of the array.
   * Finally, it returns the inputs.
   */
  async getInputs() {
    this.di.dataFlow?.reset();
    const inputs = (await this.di?.dataFlow?.fetchInputs(this.id)) as {
      [x: string]: string;
    };
    const state = this.actor.getSnapshot();
    Object.keys(this.inputs).forEach((key) => {
      if (!inputs[key] && this.inputs[key]?.control) {
        inputs[key] = state.context.inputs[key];
      }
    });

    // Normalize inputs based on if input accepts multipleConnections
    // If not, flatten the value instead of array
    Object.keys(inputs).forEach((key) => {
      if (!this.inputs[key]?.multipleConnections) {
        inputs[key] = Array.isArray(inputs[key]) ? inputs[key][0] : inputs[key];
      }
    });
    return inputs;
  }
}
