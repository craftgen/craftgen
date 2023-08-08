import { ClassicPreset } from "rete";
import { Control, Socket } from "rete/_types/presets/classic";
import { DiContainer } from "../editor";
import {
  AnyStateMachine,
  InterpreterFrom,
  MachineImplementationsFrom,
  StateFrom,
  interpret,
} from "xstate";
import { debounce } from "lodash-es";
import { setNodeData } from "../actions";

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
      ...(data?.state !== null && data.state),
    });

    const saveDebounced = debounce((state) => {
      console.log("state changed", state);
      setNodeData(this.id, state);
    }, 2000);

    const dataFlowDebounce = debounce(() => {
      di.dataFlow?.reset();
      di.editor.getNodes().forEach((n) => {
        di.dataFlow?.fetch(n.id);
      });
    }, 100);

    this.actor.subscribe((state) => {
      dataFlowDebounce();
      saveDebounced(JSON.stringify(state));
    });

    this.actor.start();
  }
}
