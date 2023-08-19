import { ClassicPreset } from "rete";
import { Control } from "rete/_types/presets/classic";
import { DiContainer } from "../editor";
import {
  AnyStateMachine,
  InterpreterFrom,
  MachineImplementationsFrom,
  StateFrom,
  interpret, // TODO: xstate
} from "xstate";
import { debounce } from "lodash-es";
import { setNodeData } from "../../action";
import { Socket } from "../sockets";

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
    [key in string]?: Control;
  } = {
    [key in string]?: Control;
  }
> extends ClassicPreset.Node<Inputs, Outputs, Controls> {
  public di: DiContainer;

  public actor: InterpreterFrom<AnyStateMachine>;

  width = 200;
  height = 200;

  constructor(
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
    this.actor = interpret(a, {
      id: this.id,
      ...(data?.state !== null && { state: data.state }), // This needs to be stay state.
    });

    const saveDebounced = debounce((state: string) => {
      setNodeData({ nodeId: this.id, state });
    }, 1000);

    this.actor.subscribe((state) => {
      saveDebounced(JSON.stringify(state));
    });

    this.actor.start();
  }
}
