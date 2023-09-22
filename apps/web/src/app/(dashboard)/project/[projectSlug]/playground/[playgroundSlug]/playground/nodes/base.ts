import { ClassicPreset } from "rete";
import { Control } from "rete/_types/presets/classic";
import { DiContainer } from "../editor";
import {
  Actor,
  AnyStateMachine,
  MachineImplementationsFrom,
  StateFrom,
  createActor,
} from "xstate";
import { debounce } from "lodash-es";
import { setNodeData } from "../../action";
import { Socket } from "../sockets";
import { NodeTypes } from "../types";

export type NodeData<T extends AnyStateMachine> = {
  id: string;
  project_id: string;
  name: string;
  type: string;
  state?: StateFrom<T>;
};

export class BaseNode<
  Machine extends AnyStateMachine,
  Inputs extends {
    [key in string]?: Socket;
  } = {
    [key in string]?: Socket;
  },
  Outputs extends {
    [key in string]?: Socket;
  } = {
    [key in string]?: Socket;
  },
  Controls extends {
    [key in string]?: Control & { name?: string };
  } = {
    [key in string]?: Control & { name?: string };
  }
> extends ClassicPreset.Node<Inputs, Outputs, Controls> {
  public di: DiContainer;

  public actor: Actor<AnyStateMachine>;

  width = 240;
  height = 200;

  state: "idle" | "running" | "error" = "idle";

  constructor(
    public readonly ID: NodeTypes,
    label: string,
    di: DiContainer,
    data: NodeData<Machine>,
    machine: Machine,
    machineImplements: MachineImplementationsFrom<Machine>
  ) {
    super(label);
    this.id = data.id;
    this.di = di;
    const a = machine.provide(machineImplements as any);
    this.actor = createActor(a, {
      id: this.id,
      ...(data?.state !== null && { state: data.state }), // This needs to be stay state.
    });

    const saveDebounced = debounce((state: string) => {
      setNodeData({ nodeId: this.id, state });
    }, 1000);

    this.actor.subscribe((state) => {
      this.state = state.value as any;
      saveDebounced(JSON.stringify(state));
    });

    this.actor.start();
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
   *
   * @param {string} stateValue - The state value to wait for.
   */
  async waitForState(stateValue: string) {
    let state = this.actor.getSnapshot()
    const sub = this.actor.subscribe((newState) => {
      state = newState;
      console.log("state", newState);
    });
    while (!state.matches(stateValue)) {
      console.log("waiting for complete");
      await new Promise((resolve) => setTimeout(resolve, 500));
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

  log(...args: any[]) {
    console.log(`[${this.di.editor.name}] - [${this.label}]`, ...args);
  }
}
