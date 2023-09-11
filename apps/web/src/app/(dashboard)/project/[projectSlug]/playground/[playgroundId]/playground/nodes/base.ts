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

  width = 200;
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

  log(...args: any[]) {
    console.log(`[${this.di.editor.name}] - [${this.label}]`, ...args);
  }
}
