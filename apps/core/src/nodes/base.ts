import { cloneDeep, get, isEqual, isNil, merge, pickBy, set } from "lodash-es";
import { action, computed, makeObservable, observable } from "mobx";
import type { ToolCallError } from "modelfusion";
import { ClassicPreset } from "rete";
import { distinctUntilChanged, filter, from, generate, map, share } from "rxjs";
import { match } from "ts-pattern";
import type { MergeDeep } from "type-fest";
import {
  createActor,
  enqueueActions,
  setup,
  waitFor,
  type Actor,
  type ActorRefFrom,
  type AnyActorLogic,
  type AnyActorRef,
  type AnyStateMachine,
  type ContextFrom,
  type InputFrom,
  type MachineImplementationsFrom,
  type ProvidedActor,
  type Snapshot,
  type SnapshotFrom,
  type Spawner,
  type StateMachine,
  type Subscription,
} from "xstate";
import type { GuardArgs } from "xstate/guards";

import { ComputeEventMachine } from "../compute-event";
import type { BaseControl } from "../controls/base";
import { type JSONSocket } from "../controls/socket-generator";
import { Input, Output } from "../input-output";
import { inputSocketMachine, spawnInputSockets } from "../input-socket";
import { slugify } from "../lib/string";
import { outputSocketMachine, spawnOutputSockets } from "../output-socket";
import {
  getSocketByJsonSchemaType,
  type MappedType,
  type Socket,
  type Tool,
} from "../sockets";
import type { DiContainer, Node, NodeTypes } from "../types";
import { createJsonSchema } from "../utils";

export type ParsedNode<
  NodeType extends string,
  Machine extends AnyActorLogic,
> = Node & {
  id: string;
  type: NodeType; // Or a more specific type if possible
  context?: InputFrom<Machine>;
  state?: SnapshotFrom<Machine>;
};

export interface BaseInputType<
  I extends Record<string, any> = {},
  O extends Record<string, any> = {},
> {
  name: string;
  description: string;

  inputs?: Partial<MappedType<I>>;
  inputSockets?: I;
  outputs?: MappedType<O>;
  outputSockets?: O;
}

export interface BaseContextType<
  I extends Record<string, ActorRefFrom<typeof inputSocketMachine>> = Record<
    string,
    ActorRefFrom<typeof inputSocketMachine>
  >,
  O extends Record<string, ActorRefFrom<typeof outputSocketMachine>> = Record<
    string,
    ActorRefFrom<typeof outputSocketMachine>
  >,
> {
  name: string;
  description: string;

  inputs: Record<string, any>;
  outputs: Record<string, any>;

  outputSockets: O;
  inputSockets: I;

  parent?: {
    id: string; // System Id
    port?: string; // Input port // CHILD ACTORS only
  };
  childs: {
    [key: NodeTypes]: ActorRefFrom<AnyStateMachine>;
  };
  computes: {
    [key: string]: ActorRefFrom<typeof ComputeEventMachine>;
  };
  error: {
    name: string;
    message: string;
  } | null;
}

export interface ChangeActionEventType<T> {
  type: "CHANGE_ACTION";
  value: T;
  outputSockets: Record<string, JSONSocket>;
  inputSockets: Record<string, JSONSocket>;
  action: {
    type: T;
  };
}

export type BaseEventTypes =
  | {
      type: "SET_VALUE";
      params: {
        values: Record<string, any>;
      };
      origin: {
        id: string;
        type: string;
      };
    }
  | {
      type: "SET_OUTPUT";
      params: {
        key: string;
        value: any;
      };
    }
  | {
      type: "RUN";
      params?: {
        executionNodeId?: string;
        sender?: AnyActorRef;
        values?: Record<string, any>;
        inputs?: Record<string, any>;
      };
      origin: {
        id: string;
        type: string;
      };
    }
  | {
      type: "ADD_SOCKET";
      params: {
        side: "input" | "output";
        definition: JSONSocket;
      };
    }
  | {
      type: "REMOVE_SOCKET";
      params: {
        side: "input" | "output";
        id: string;
      };
    }
  | {
      type: "SPAWN";
      params: {
        parentId?: string;
        id: string;
        systemId: string;
        machineId: string;
        input: Record<string, any> & {
          parent?: {
            id: string;
            port?: string;
          };
          senders?: {
            id: string;
          }[];
        };
      };
    }
  | {
      type: "COMPUTE";
      params?: {
        inputs?: Record<string, any>;
      };
    }
  | {
      type: "RESULT";
      params: {
        id: string; // Call id
        res: {
          ok: boolean;
          result: any | ToolCallError;
        };
      };
    }
  | {
      type: "RESET";
    }
  | {
      type: "INITIALIZE";
    }
  | {
      type: "ASSIGN_CHILD";
      params: {
        actor: AnyActorRef;
        port: string;
      };
    }
  | {
      type: "ASSIGN_RUN";
      params: {
        actor: AnyActorRef;
      };
    };

export type BaseActionTypes =
  | {
      type: "setValue";
      params?: {
        values: Record<string, any>;
      };
    }
  | {
      type: "removeError";
    }
  | {
      type: "changeAction";
    }
  | {
      type: "triggerSuccessors";
      params?: {
        port: string;
      };
    }
  | {
      type: "setError";
      params?: {
        name: string;
        message: string;
        stack?: unknown | Error;
      };
    }
  | {
      type: "assignChild";
    }
  | {
      type: "addSocket";
      params: {
        definition: JSONSocket;
      };
    }
  | {
      type: "removeSocket";
      params: {
        id: string;
      };
    }
  | {
      type: "initialize";
    }
  | {
      type: "assignParent";
    }
  | {
      type: "resolveOutputSockets";
    }
  | {
      type: "computeEvent";
      params: {
        event: string;
      };
    }
  | {
      type: "removeComputation";
    }
  | {
      type: "setupInternalActorConnections";
    };

export type BaseActorTypes = ProvidedActor;

/**
 * key: the name of the socket
 * port: the side of the socket
 */
export interface HasConnectionGuardParams {
  key: string;
  port: "input" | "output";
}

export interface BaseGuardTypes {
  type: "hasConnection";
  params: HasConnectionGuardParams;
}

export type None = "None";

type SpecialMerged<T, U> = U extends None ? T : T | U;

export interface BaseMachineTypes<
  T extends {
    input?: any;
    context: any;
    events?: any;
    actions?: any;
    actors?: ProvidedActor | None;
    guards?: any;
  } = {
    input?: BaseInputType;
    context: BaseContextType;
    events?: BaseEventTypes;
    actions?: BaseActionTypes;
    actors?: ProvidedActor;
    guards?: any;
  },
> {
  input: MergeDeep<BaseInputType, T["input"]>;
  context: MergeDeep<BaseContextType, T["context"]>;
  guards: SpecialMerged<BaseGuardTypes, T["guards"]>;
  events: SpecialMerged<BaseEventTypes, T["events"]>;
  actions: SpecialMerged<BaseActionTypes, T["actions"]>;
  actors: SpecialMerged<BaseActorTypes, T["actors"]>;
}

export type BaseMachine = StateMachine<
  BaseContextType,
  BaseEventTypes,
  any,
  BaseActorTypes,
  BaseActionTypes,
  BaseGuardTypes,
  any,
  any,
  any,
  BaseInputType,
  any
>;

const NodeMachine = setup({
  types: {
    context: {} as {
      inputSockets: Record<string, ActorRefFrom<typeof inputSocketMachine>>;
      outputSockets: Record<string, ActorRefFrom<typeof outputSocketMachine>>;
      actors: Record<
        string,
        {
          outputSockets: Record<
            string,
            ActorRefFrom<typeof outputSocketMachine>
          >;
          inputSockets: Record<string, ActorRefFrom<typeof inputSocketMachine>>;
        }
      >;
    },
    events: {} as {
      type: "SET_INPUT_OUTPUT";
      params: {
        actorId: string;
        sockets: {
          inputSockets: Record<string, ActorRefFrom<typeof inputSocketMachine>>;
          outputSockets: Record<
            string,
            ActorRefFrom<typeof outputSocketMachine>
          >;
        };
      };
    },
  },
}).createMachine({
  id: "node",
  context: ({ input }) => ({
    inputSockets: {},
    outputSockets: {},
    actors: {},
  }),
  on: {
    SET_INPUT_OUTPUT: {
      actions: enqueueActions(({ enqueue }) => {
        enqueue.assign({
          actors: ({ event, context }) => {
            const { actorId, sockets } = event.params;
            return {
              ...context.actors,
              [actorId]: sockets,
            };
          },
        });
      }),
    },
  },
});

export const NodeContextFactory = <
  C extends {
    spawn: Spawner<any>;
    input: any;
    self: AnyActorRef;
  },
>(
  ctx: C,
  {
    name,
    description,
    inputSockets: originalInputSockets,
    outputSockets: originalOutputSockets,
  }: {
    name: string;
    description: string;
    inputSockets: Record<string, JSONSocket>;
    outputSockets: Record<string, JSONSocket>;
  },
) => {
  console.log("CONTEXT FACTORY:", { INPUT: ctx.input });
  const initialValueForTheNode = get(ctx.input, "inputs", {});
  const inputSockets = cloneDeep(originalInputSockets);
  const outputSockets = cloneDeep(originalOutputSockets);

  const defaultInputs = { ...initialValueForTheNode };
  for (const [key, socket] of Object.entries(inputSockets)) {
    if (initialValueForTheNode[key]) {
      socket.default = initialValueForTheNode[key];
    }
    const inputKey = key as keyof typeof inputSockets;
    if (socket.default && defaultInputs[inputKey] === undefined) {
      defaultInputs[inputKey] = socket.default as any;
    } else {
      defaultInputs[inputKey] = undefined;
    }
  }

  const config = merge(
    {},
    {
      name,
      description,
      computes: {},
      inputs: {
        ...defaultInputs,
      },
      outputs: {
        ...Object.values(outputSockets).reduce((prev, socket) => {
          return {
            ...prev,
            [socket["x-key"]]: undefined,
          };
        }, {}),
      },
      inputSockets,
      outputSockets,
    },
    ctx.input,
  );

  const hasParentActor = get(ctx, "input.parent.port");
  if (hasParentActor) {
    Object.keys(config.inputSockets).forEach((key) => {
      set(config, ["inputSockets", key, "x-showSocket"], false);
    });
    Object.keys(config.outputSockets).forEach((key) => {
      set(config, ["outputSockets", key, "x-showSocket"], false);
    });
  }

  const spawnedInputSockets = spawnInputSockets({
    spawn: ctx.spawn,
    self: ctx.self,
    inputSockets: config.inputSockets as any,
  });

  const spawnedOutputSockets = spawnOutputSockets({
    spawn: ctx.spawn,
    self: ctx.self,
    outputSockets: config.outputSockets as any,
  });

  set(config, "inputSockets", spawnedInputSockets);
  set(config, "outputSockets", spawnedOutputSockets);

  return config as any;
};

export abstract class BaseNode<
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
    [key in string]?: BaseControl & { name?: string };
  } = {
    [key in string]?: BaseControl & { name?: string };
  },
> extends ClassicPreset.Node<Inputs, Outputs, Controls> {
  static nodeType: string;

  public actor: Actor<Machine>;

  public nodeActor: Actor<typeof NodeMachine>;

  public readonly variables: string[] = [];
  description: any;

  private get pactor() {
    return this.actor as Actor<BaseMachine>;
  }

  public state: "idle" | "running" | "error" | "complete" = "idle";

  public width: number;
  public height: number;

  readonly contextId: string;

  public count = 0;

  public inputs: {
    [key in keyof Inputs]?: Input<
      Actor<Machine>,
      Exclude<Inputs[key], undefined>
    >;
  } = {};

  public outputs: {
    [key in keyof Outputs]?: Output<
      Actor<Machine>,
      Exclude<Outputs[key], undefined>
    >;
  } = {};

  public parent?: string;

  public isReady = false;
  public machine: Machine;
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

  public snap: SnapshotFrom<Machine>;

  private get snapshot() {
    return this.snap as SnapshotFrom<BaseMachine>;
  }

  get inputSchema() {
    throw new Error("Not implemented");
    // return createJsonSchema(this.inputSockets);
  }
  get outputSchema() {
    throw new Error("Not implemented");
    // return createJsonSchema(this.outputSockets);
  }

  get readonly() {
    return !isNil(this.di.executionId) || this.di.readonly;
  }

  public executionNodeId?: string;
  // public unsubscribe: () => void | undefined;

  actors = new Map<string, Actor<Machine>>();
  actorListeners = new Map<string, Subscription>();
  actorSockets = new Map<
    string,
    {
      inputSockets: Record<string, Actor<typeof inputSocketMachine>>;
      outputSocket: Record<string, Actor<typeof outputSocketMachine>>;
    }
  >();

  get inputSockets() {
    let combined = {} as Record<string, Actor<typeof inputSocketMachine>>;
    for (let actorSocket of this.actorSockets.values()) {
      combined = {
        ...combined,
        ...actorSocket.inputSockets,
      };
    }
    return combined;
  }

  get outputSockets() {
    let combined = {} as Record<string, Actor<typeof outputSocketMachine>>;

    for (let actorSocket of this.actorSockets.values()) {
      // Combine outputSocket
      combined = {
        ...combined,
        ...actorSocket.outputSocket,
      };
    }

    return combined;
  }

  public baseGuards: MachineImplementationsFrom<BaseMachine>["guards"] = {
    hasConnection: (
      { context }: GuardArgs<ContextFrom<BaseMachine>, any>,
      params: HasConnectionGuardParams,
    ) => {
      return match(params)
        .with(
          {
            port: "input",
          },
          () => {
            const connections = get(
              context.inputSockets,
              [params.key, "x-connection"],
              {},
            );
            return Object.values(connections).length > 0;
          },
        )
        .with(
          {
            port: "output",
          },
          () => {
            const connections = get(
              context.outputSockets,
              [params.key, "x-connection"],
              {},
            );
            return Object.values(connections).length > 0;
          },
        )
        .exhaustive();
    },
  };

  public baseImplentations: MachineImplementationsFrom<Machine> = {
    guards: this.baseGuards,
    // actions: this.baseActions,
  };

  public machineImplements: MachineImplementationsFrom<Machine>;

  public extendMachine(implementations: MachineImplementationsFrom<Machine>) {
    this.machine = this.machine.provide(implementations);
    this.machineImplements = this.machine.implementations;
  }

  constructor(
    public readonly ID: NodeTypes,
    public di: DiContainer,
    public nodeData: ParsedNode<NodeTypes, Machine>,
    machine: Machine,
    machineImplements?: MachineImplementationsFrom<Machine>,
  ) {
    super(nodeData.label);

    this.width = nodeData?.width || 240;
    this.height = nodeData?.height || 200;
    this.contextId = nodeData.contextId;
    this.id = nodeData.id;
    this.description = nodeData.description;
    this.machineImplements = {
      ...this.baseImplentations,
      ...(machineImplements as any),
      actions: {
        ...this.baseImplentations.actions,
        ...((machineImplements?.actions as any) || {}),
      },
      actors: {
        ...Object.keys(this.di.machines).reduce(
          (acc, k) => {
            if (acc[k]) {
              throw new Error(`Actor ${k} already exists`);
            }
            // acc[k] = this.getMachineActor(k);
            return acc;
          },
          {} as Record<string, AnyStateMachine>,
        ),
      },
    };

    this.machine = machine.provide({
      ...this.machineImplements,
    }) as Machine;

    this.snap = nodeData.context?.state || {};
    // this.inputSockets = nodeData.context?.state?.context?.inputSockets || {};
    // this.outputSockets = nodeData.context?.state?.context?.outputSockets || {};
    this.executionNodeId = this.nodeData?.executionNodeId;

    makeObservable(this, {
      inputs: observable,
      outputs: observable,

      snap: observable,
      inputSockets: computed,
      inputSchema: computed,
      outputSockets: computed,
      outputSchema: computed,

      setSnap: action,

      executionNodeId: observable,
      executionId: computed,
    });
    this.nodeActor = createActor(NodeMachine, {
      id: this.id,
    });
    this.nodeActor.start();
  }

  public async setup() {
    this.actor = this.setupActor(this.di?.actor?.system.get(this.contextId));
    const snap = this.nodeActor.getSnapshot();

    const process = async (state: any) => {
      let inputSockets = {};
      let outputSockets = {};
      for (const [key, value] of Object.entries(state.context.actors)) {
        inputSockets = {
          ...inputSockets,
          ...value.inputSockets,
        };
        outputSockets = {
          ...outputSockets,
          ...value.outputSockets,
        };
      }
      await this.updateInputs(inputSockets);
      await this.updateOutputs(outputSockets);
    };
    await process(snap);

    this.nodeActor.subscribe((state) => {
      let inputSockets = {};
      let outputSockets = {};
      for (const [key, value] of Object.entries(state.context.actors)) {
        inputSockets = {
          ...inputSockets,
          ...value.inputSockets,
        };
        outputSockets = {
          ...outputSockets,
          ...value.outputSockets,
        };
      }
      this.updateInputs(inputSockets);
      this.updateOutputs(outputSockets);
    });
    this.isReady = true;
  }

  public setupActor(actor: Actor<BaseMachine>) {
    if (!actor) {
      return;
    }
    let prev = actor.getSnapshot();
    const childActors = Object.values(
      get(prev, "context.childs", {}),
    ) as Actor<Machine>[];

    for (const childActor of childActors) {
      if (childActor) {
        if (this.actors.has(childActor.id)) continue;
        this.setupActor(childActor);
      }
    }
    this.nodeActor.send({
      type: "SET_INPUT_OUTPUT",
      params: {
        actorId: actor.id,
        sockets: {
          inputSockets: prev?.context?.inputSockets,
          outputSockets: prev?.context?.outputSockets,
        },
      },
    });

    const actorEvents = from(actor).pipe(share());
    actorEvents
      .pipe(
        map((state) => get(state, "context.childs", {})),
        filter((childs) => Object.keys(childs).length > 0),
        map((childs) => {
          // Convert `childs` to an array, filtering out undefined values
          return Object.values(childs).filter(
            (child) => child !== undefined,
          ) as Actor<Machine>[];
        }),
        distinctUntilChanged(),
      )
      .subscribe((childs) => {
        for (const child of childs) {
          if (this.actors.has(child.id)) continue;
          this.setupActor(child);
        }
      });

    const listener = actorEvents
      .pipe(
        map((state) => {
          return {
            event: {
              actorId: actor.id,
              sockets: {
                inputSockets: state.context.inputSockets,
                outputSockets: state.context.outputSockets,
              },
            },
            socketKeys: {
              inputSockets: Object.keys(state.context.inputSockets),
              outputSockets: Object.keys(state.context.outputSockets),
            },
          };
        }),
        distinctUntilChanged((prev, curr) =>
          isEqual(prev.socketKeys, curr.socketKeys),
        ),
        map((state) => state.event),
      )
      .subscribe((state) => {
        this.nodeActor.send({
          type: "SET_INPUT_OUTPUT",
          params: state,
        });
      });

    this.actors.set(actor.id, actor);
    this.actorSockets.set(actor.id, {
      inputSockets: prev.context?.inputSockets || {},
      outputSocket: prev.context?.outputSockets || {},
    });
    this.actorListeners.set(actor.id, listener);
    return actor;
  }

  public async reset() {
    // this.actorListeners.forEach((listener) => {
    //   listener.unsubscribe();
    //   this.actorListeners.delete(listener.id);
    // });
    // this.actors.forEach((actor) => {
    //   actor.stop();
    //   this.actors.delete(actor.id);
    // });
    // await this.setup();
    // this.di.area?.update("node", this.id);
  }

  async updateOutputs(
    outputSockets: Record<string, Actor<typeof outputSocketMachine>>,
  ) {
    for (const item of Object.keys(this.outputs)) {
      if (outputSockets[item]) continue;
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
          } as any);
        }
      }
      this.removeOutput(item);
    }

    const index = 0;
    for (const [key, socketActor] of Object.entries(outputSockets)) {
      const definition = socketActor.getSnapshot().context.definition;
      if (this.hasOutput(key)) {
        const output = this.outputs[key];
        if (output) {
          output.socket = getSocketByJsonSchemaType(definition)! as any;
        }
        continue;
      }

      const socket = getSocketByJsonSchemaType(definition)!;
      const output = new Output(
        socket,
        key,
        definition.isMultiple || true,
        socketActor,
      ) as any;
      output.index = index + 1;
      this.addOutput(key, output);
    }
  }

  async updateInputs(
    inputSockets: Record<string, Actor<typeof inputSocketMachine>>,
  ) {
    /**
     * CLEAN up inputs
     */
    for (const item of Object.keys(this.inputs)) {
      if (inputSockets[item]) continue;
      const connections = this.di.editor
        .getConnections()
        .filter((c) => c.target === this.id && c.targetInput === item);
      if (connections.length >= 1) {
        for (const c of connections) {
          await this.di.editor.removeConnection(c.id);
          this.di.editor.addConnection({
            ...c,
            target: this.id,
            targetInput: item,
          } as any);
        }
      }
      this.removeInput(item);
    }

    for (const [key, socketActor] of Object.entries(inputSockets)) {
      const definition = socketActor.getSnapshot().context.definition;
      if (this.hasInput(key)) {
        const input = this.inputs[key];
        if (input) {
          input.socket = getSocketByJsonSchemaType(definition)! as any;
        }
        continue;
      }

      if (definition["x-actor-type"]) {
        const actor = socketActor.system.get(
          socketActor.getSnapshot().context.parent.id,
        );

        if (actor) {
          actor.send({
            type: "INITIALIZE",
          });
        }
      }

      const socket = getSocketByJsonSchemaType(definition)!;
      const input = new Input(socket, key, definition.isMultiple, socketActor);
      this.addInput(key, input as any);
    }
  }

  public setSnap(snap: SnapshotFrom<Machine>) {
    this.snap = snap;
  }

  get successorNodes() {
    return this.di.graph.successors(this.id).nodes();
  }

  get identifier() {
    return `${this.ID}-${this.id.substring(-5)}`;
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

  async setLabel(label: string) {
    this.label = label;
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
      this.di.dataFlow?.reset(this.id);
      if (this.ID === "InputNode") {
        return this.pactor.getSnapshot().context.inputs;
      }

      // const ancestors = this.di.graph
      //   .ancestors((n) => n.id === this.id)
      //   .nodes();
      // for (const node of ancestors) {
      //   this.di.logger.log(this.identifier, "calling data on", node.ID, node.id);
      //   const inputs = (await this.di.dataFlow?.fetchInputs(node.id)) as any; // reset cache for this node.
      //   await node.compute(inputs);
      // }

      const inputs = (await this.di?.dataFlow?.fetchInputs(this.id)) as Record<
        string,
        string
      >;
      console.log("GETTING INPUTS", { inputs, inputttt: this.inputs });

      // asign values from context to inputs if input is not connected
      const state = this.pactor.getSnapshot();
      Object.entries(this.inputs)
        .filter(([key, input]) => {
          return !(input.socket.name === "trigger");
        })
        .map(([key, input]) => {
          return key;
        })
        .forEach((key) => {
          if (!inputs[key] && this.inputs[key]?.control) {
            inputs[key] = state.context.inputs[key];
          }
        });

      // Normalize inputs based on if input accepts multipleConnections
      // If not, flatten the value instead of array
      Object.keys(inputs).forEach((key) => {
        if (!this.inputs[key]?.multipleConnections) {
          inputs[key] = Array.isArray(inputs[key])
            ? inputs[key][0]
            : inputs[key];
        }
      });

      return inputs;
    } catch (e) {
      this.di.logger.error(e);
      return {};
    }
  }

  get toolDefination(): Record<string, Tool> {
    // TODO: if the node has multiple triggers create a array of tools.
    const triggers = pickBy(this.inputSockets, (s) => s.type === "trigger");
    if (Object.keys(triggers).length > 0) {
      const tools: Record<string, Tool> = {};
      for (const [key, value] of Object.entries(triggers)) {
        if (
          !this.snapshot.can({
            type: value["x-event"] as any,
          })
        ) {
          continue;
        }

        const parameters = createJsonSchema(
          pickBy(
            this.inputSockets,
            (s) => s.type !== "trigger" && s["x-showSocket"],
          ),
        );
        const humanReadableFunctionName = `${slugify(
          `${this.id.replace("node_", "")}_${this.label}`,
          "_",
        )}-${key}`;
        const tool = {
          name: humanReadableFunctionName,
          description: this.description,
          parameters,
        };
        tools[humanReadableFunctionName] = tool;
      }
      return tools;
    }
    return {};
  }

  async serialize(): Promise<ParsedNode<NodeTypes, Machine>> {
    const state =
      this.nodeActor.getPersistedSnapshot() as Snapshot<Machine> as any; //TODO: types
    return {
      ...this.nodeData,
      // state: state,
      context: state,
      width: this.width,
      height: this.height,
    };
  }
}
