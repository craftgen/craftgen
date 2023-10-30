import { ClassicPreset } from "rete";
import { type DiContainer } from "../types";
import {
  Actor,
  type AnyStateMachine,
  type ContextFrom,
  type MachineImplementationsFrom,
  type SnapshotFrom,
  createActor,
  waitFor,
  PersistedStateFrom,
  AnyActorLogic,
  InputFrom,
} from "xstate";
import { debounce, isEqual, isUndefined, set } from "lodash-es";
import {
  type AllSockets,
  Socket,
  getSocketByJsonSchemaType,
  getControlBySocket,
} from "../sockets";
import type { NodeTypes, Node } from "../types";
import { BaseControl } from "../controls/base";
import { Input, Output } from "../input-output";
import { action, computed, makeObservable, observable, reaction } from "mobx";
import { JSONSocket } from "../controls/socket-generator";
import { createJsonSchema } from "../utils";

export type ParsedNode<
  NodeType extends string,
  Machine extends AnyActorLogic
> = Node & {
  id: string;
  type: NodeType; // Or a more specific type if possible
  context?: InputFrom<Machine> | ContextFrom<Machine>;
  state?: PersistedStateFrom<Machine>;
};

export abstract class BaseNode<
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
  static nodeType: string;

  public actor: Actor<AnyStateMachine>;

  public state: "idle" | "running" | "error" = "idle";

  public width: number;
  public height: number;

  readonly contextId: string;

  public count = 0;

  public inputs: {
    [key in keyof Inputs]?: Input<Exclude<Inputs[key], undefined>>;
  } = {};

  public outputs: {
    [key in keyof Outputs]?: Output<Exclude<Outputs[key], undefined>>;
  } = {};

  public isExecution: boolean;
  public isReady: boolean = false;
  // executionNode: Node["nodeExectutions"][number] | undefined;

  get workflowId() {
    return this.di.workflowId;
  }
  get workflowVersionId() {
    return this.di.workflowVersionId;
  }
  get projectId() {
    return this.di.projectId;
  }

  get executionId() {
    return this.di.executionId;
  }

  public snap: SnapshotFrom<AnyStateMachine>;

  public inputSockets: JSONSocket[];
  public outputSockets: JSONSocket[];

  get inputSchema() {
    return createJsonSchema(this.inputSockets);
  }
  get outputSchema() {
    return createJsonSchema(this.outputSockets);
  }

  public executionNodeId?: string;

  constructor(
    public readonly ID: NodeTypes,
    public di: DiContainer,
    public nodeData: ParsedNode<NodeTypes, Machine>,
    public machine: Machine,
    public machineImplements: MachineImplementationsFrom<Machine>
  ) {
    super(nodeData.label);

    this.width = nodeData?.width || 200;
    this.height = nodeData?.height || 200;
    this.contextId = nodeData.contextId;
    this.id = nodeData.id;

    this.isExecution = !isUndefined(this.executionId);

    const saveContextDebounced = debounce(
      async ({ context }: { context: ContextFrom<Machine> }) => {
        // this.di.logger.log(this.identifier, "SAVING CONTEXT STATE");
        this.di.api.setContext({
          contextId: this.contextId,
          context: JSON.stringify(context),
        });
      },
      1000
    );

    if (this.isExecution) {
      set(this.machine.config.states!, "complete.type", "final"); // inject complete "final" in the execution instance.
    }

    if (this.nodeData.state) {
      const actorInput = {
        state: this.nodeData.state,
      };
      // this.di.logger.log(this.identifier, "CREATING EXECTION ACTOR WITH STATE");
      const a = this.machine.provide(this.machineImplements as any);
      this.actor = createActor(a, {
        id: this.id,
        ...actorInput,
      });
    } else {
      const a = this.machine.provide(this.machineImplements as any);
      this.actor = createActor(a, {
        id: this.contextId,
        ...(this.nodeData?.context && {
          input: {
            ...this.nodeData.context,
          },
        }),
      });
    }

    // Initial state for the execution node.
    // if (this.nodeData.executionId && this.nodeData.state === null) {
    //   this.saveState({ state: this.actor.getSnapshot() });
    // }

    let prev = this.actor.getSnapshot();
    this.actor.subscribe({
      complete: async () => {
        // this.di.logger.log(this.identifier, "finito main");
      },
      next: async (state) => {
        this.state = state.value as any;
        this.setSnap(state);
        if (!isEqual(prev.context.inputSockets, state.context.inputSockets)) {
          this.setInputSockets(state.context?.inputSockets || []);
        }
        if (!isEqual(prev.context.outputSockets, state.context.outputSockets)) {
          this.setOutputSockets(state.context?.outputSockets || []);
        }

        if (
          !isEqual(prev.context.outputs, state.context.outputs) &&
          state.matches("complete")
        ) {
          this.di.dataFlow?.cache.delete(this.id); // reset cache for this node.
          if (!this.isExecution) {
            // Only update ancestors if this is not an execution node
            await this.updateAncestors();
          }
        }

        if (this.isExecution) {
          this.saveState({ state });
        } else {
          // if (!this.di.readonly?.enabled) {
          saveContextDebounced({ context: state.context });
          // }
        }
        prev = state;
      },
    });
    this.snap = this.actor.getSnapshot();
    this.inputSockets = this.snap.context?.inputSockets || [];
    this.outputSockets = this.snap.context?.outputSockets || [];

    this.updateInputs(this.inputSockets);
    this.updateOutputs(this.outputSockets);

    this.executionNodeId = this.nodeData.executionNodeId;

    this.actor.start();
    makeObservable(this, {
      inputs: observable,
      snap: observable,
      inputSockets: observable,
      inputSchema: computed,
      outputSockets: observable,
      outputSchema: computed,

      setInputSockets: action,
      setOutputSockets: action,
      setSnap: action,

      executionNodeId: observable,
      setExecutionNodeId: action,
    });

    const inputHandlers = reaction(
      () => this.inputSockets,
      async (sockets) => {
        await this.updateInputs(sockets);
      }
    );
    const outputHandlers = reaction(
      () => this.outputSockets,
      async (sockets) => {
        await this.updateOutputs(sockets);
      }
    );

    this.isReady = true;
  }

  async updateOutputs(rawTemplate: JSONSocket[]) {
    for (const item of Object.keys(this.outputs)) {
      if (item === "trigger") continue; // don't remove the trigger socket
      if (rawTemplate.find((i: JSONSocket) => i.name === item)) continue;
      const connections = this.di.editor
        .getConnections()
        .filter((c) => c.source === this.id && c.sourceOutput === item);
      // if (connections.length >= 1) continue; // if there's an input that's not in the template keep it.
      if (connections.length >= 1) {
        for (const c of connections) {
          await this.di.editor.removeConnection(c.id);
          this.di.editor.addConnection({
            ...c,
            source: this.id,
            sourceOutput: item,
          });
        }
      }
      this.removeOutput(item);
    }

    for (const [index, item] of rawTemplate.entries()) {
      if (this.hasOutput(item.name)) {
        const output = this.outputs[item.name];
        if (output) {
          output.socket = getSocketByJsonSchemaType(item.type)! as any;
        }
        continue;
      }

      const socket = getSocketByJsonSchemaType(item.type)!;
      const output = new Output(socket, item.name, false) as any;
      output.index = index + 1;
      this.addOutput(item.name, output);
    }
  }

  async updateInputs(rawTemplate: JSONSocket[]) {
    const state = this.actor.getSnapshot();
    for (const item of Object.keys(this.inputs)) {
      if (item === "trigger") continue; // don't remove the trigger socket
      if (rawTemplate.find((i: JSONSocket) => i.name === item)) continue;
      const connections = this.di.editor
        .getConnections()
        .filter((c) => c.target === this.id && c.targetInput === item);
      // if (connections.length >= 1) continue; // if there's an input that's not in the template keep it.
      if (connections.length >= 1) {
        for (const c of connections) {
          await this.di.editor.removeConnection(c.id);
          this.di.editor.addConnection({
            ...c,
            target: this.id,
            targetInput: item,
          });
        }
      }
      this.removeInput(item);
    }

    for (const [index, item] of rawTemplate.entries()) {
      if (this.hasInput(item.name)) {
        const input = this.inputs[item.name];
        if (input) {
          input.socket = getSocketByJsonSchemaType(item.type)! as any;
        }
        continue;
      }

      const socket = getSocketByJsonSchemaType(item.type)!;
      const input = new Input(socket, item.name, true);
      input.index = index + 1;
      const controller = getControlBySocket(
        socket,
        state.context.inputs[item.name],
        (v) => {
          this.actor.send({
            type: "SET_VALUE",
            values: {
              [item.name]: v,
            },
          });
        }
      );
      input.addControl(controller);
      this.addInput(item.name, input as any);
      if (!state.context.inputs[item.name]) {
        this.actor.send({
          type: "SET_VALUE",
          values: {
            [item.name]: "",
          },
        });
      }
    }
  }

  public setOutputSockets(sockets: JSONSocket[]) {
    this.outputSockets = sockets;
  }

  public setInputSockets(sockets: JSONSocket[]) {
    this.inputSockets = sockets;
  }

  public setSnap(snap: SnapshotFrom<AnyStateMachine>) {
    this.snap = snap;
  }

  public async updateAncestors() {
    await waitFor(this.actor, (state) => state.matches("complete")); //wait for the node to complete

    const outgoers = this.di.graph.outgoers(this.id).nodes();
    // this.di.logger.log(this.identifier, "updateAncestors", outgoers);
    for (const node of outgoers) {
      // this.di.logger.log("calling data on", node.ID, node.id);
      const inputs = (await this.di.dataFlow?.fetchInputs(node.id)) as any; // reset cache for this node.
      await node.compute(inputs);
    }
  }

  public setExecutionNodeId(executionNodeId: string) {
    this.executionNodeId = executionNodeId;
  }

  async saveState({ state }: { state: SnapshotFrom<AnyStateMachine> }) {
    if (this.executionId) {
      console.log("Execution NodeId:", this.executionNodeId);
      if (!this.executionNodeId) {
        console.log("Setting Execution ID");
        this.setExecutionNodeId(this.di.createId("state"));
      }
      const saved = await this.di.api.updateExecutionNode({
        id: this.executionNodeId!,
        contextId: this.contextId,
        projectId: this.projectId,
        state: JSON.stringify(state),
        type: this.ID,
        workflowExecutionId: this.executionId,
        workflowId: this.workflowId,
        workflowNodeId: this.id,
        workflowVersionId: this.workflowVersionId,
      });
      console.log({ saved });
    }
  }

  async execute(
    input: any,
    forward: (output: "trigger") => void,
    executionId: string
  ) {
    console.log(this.identifier, "@@@", "execute", executionId);
    this.di.engine.emit({
      type: "execution-step-start",
      data: {
        payload: this,
        executionId: executionId!,
      },
    });

    // EARLY RETURN IF NODE IS COMPLETE
    if (this.actor.getSnapshot().matches("complete")) {
      // this.di.logger.log(this.identifier, "finito Execute", this.outputs);
      this.di.engine.emit({
        type: "execution-completed",
        data: {
          payload: this,
          executionId: executionId,
        },
      });
      if (this.outputs.trigger) {
        // forward("trigger");
        if (this.di.headless) {
          await this.triggerSuccesors(executionId);
        } else {
          forward("trigger");
        }
        return;
      }
    }

    const inputs = await this.getInputs();
    // this.di.logger.log(this.identifier, "INPUTS", inputs);
    this.actor.send({
      type: "RUN",
      inputs,
    });
    this.actor.subscribe({
      next: (state) => {
        this.di.engine.emit({
          type: "execution-step-update",
          data: {
            payload: this,
            executionId: executionId,
          },
        });
        // console.log(this.identifier, "@@@", "next", state.value, state.context);
      },
      complete: async () => {
        // this.di.logger.log(this.identifier, "finito Execute", this.outputs);
        this.di.engine.emit({
          type: "execution-step-complete",
          data: {
            payload: this,
            executionId: executionId,
          },
        });
        if (this.outputs.trigger) {
          // forward("trigger");
          if (this.di.headless) {
            await this.triggerSuccesors(executionId);
          } else {
            forward("trigger");
            // console.log(this.identifier, "@@@", "forward");
          }
        } else {
          this.di.engine.emit({
            type: "execution-completed",
            data: {
              payload: this,
              executionId,
            },
          });
        }
      },
    });
    await waitFor(this.actor, (state) => state.matches("complete"), {
      timeout: 1000 * 60 * 5,
    });
  }

  async triggerSuccesors(executionId: string) {
    const cons = this.di.editor.getConnections().filter((c) => {
      return c.source === this.id && c.sourceOutput === "trigger";
    });

    cons.forEach(async (con) => {
      const node = this.di.editor.getNode(con.target);
      if (!node) return;
      await this.di.api.triggerWorkflowExecutionStep({
        executionId,
        workflowNodeId: node.id,
        // projectSlug: this.nodeData.project.slug,
        // workflowSlug: this.nodeData.workflow.slug,
        // version: this.nodeData.workflowVersion.version,
      });
    });
  }

  get identifier() {
    return `${this.ID}-${this.id.substring(-5)}`;
  }
  /**
   * @returns The outputs of the current node.
   */
  async data(inputs?: any) {
    this.count++;
    // this.di.logger.log(this.identifier, "Calling DATA", "original", inputs);
    // inputs = await this.getInputs();
    let state = this.actor.getSnapshot();
    if (
      state.context.inputs &&
      !isEqual(state.context.inputs, inputs) &&
      this.ID !== "InputNode"
    ) {
      this.di.logger.log(
        this.identifier,
        "inputs are not matching computing",
        inputs,
        state.context.inputs
      );
      await this.compute(inputs);
    }
    // this.di.logger.log(this.identifier, "actor in data", this.actor);
    if (state.matches("running")) {
      this.di.logger.log(this.identifier, "waiting for complete");
      await waitFor(this.actor, (state) => state.matches("complete"));
    }
    state = this.actor.getSnapshot();
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
        this.addInput(key, new Input(socket as any, key, false));
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
        this.addOutput(key, new Output(socket as any, key, false));
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

  async setLabel(label: string) {
    this.label = label;
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
      this.di.logger.log("waiting for complete", this.ID, state.value);
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
    try {
      this.di.dataFlow?.reset();
      if (this.ID === "InputNode") {
        return this.actor.getSnapshot().context.inputs;
      }

      // const ancestors = this.di.graph
      //   .ancestors((n) => n.id === this.id)
      //   .nodes();
      // for (const node of ancestors) {
      //   this.di.logger.log(this.identifier, "calling data on", node.ID, node.id);
      //   const inputs = (await this.di.dataFlow?.fetchInputs(node.id)) as any; // reset cache for this node.
      //   await node.compute(inputs);
      // }

      const inputs = (await this.di?.dataFlow?.fetchInputs(this.id)) as {
        [x: string]: string;
      };
      // this.di.logger.log(this.identifier, "inputs from data flow", inputs);
      const state = this.actor.getSnapshot();
      Object.keys(this.inputs).forEach((key) => {
        if (!inputs[key] && this.inputs[key]?.control) {
          inputs[key] = state.context.inputs[key];
        }
      });

      // Normalize inputs based on if input accepts multipleConnections
      // If not, flatten the value instead of array
      // Object.keys(inputs).forEach((key) => {
      //   if (!this.inputs[key]?.multipleConnections) {
      //     inputs[key] = Array.isArray(inputs[key])
      //       ? inputs[key][0]
      //       : inputs[key];
      //   }
      // });
      return inputs;
    } catch (e) {
      this.di.logger.error(e);
    }
  }

  async serialize(): Promise<ParsedNode<NodeTypes, Machine>> {
    const state = this.actor.getPersistedState() as PersistedStateFrom<Machine>;
    return {
      ...this.nodeData,
      state: state,
      context: state?.context,
      width: this.width,
      height: this.height,
    };
  }
}
