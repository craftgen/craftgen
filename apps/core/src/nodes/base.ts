import { createId } from "@paralleldrive/cuid2";
import { debounce, has, isEqual, isNil, isUndefined } from "lodash-es";
import { action, computed, makeObservable, observable, reaction } from "mobx";
import { ClassicPreset } from "rete";
import { MergeDeep } from "type-fest";
import {
  ActionArgs,
  Actor,
  AnyActorLogic,
  AnyStateMachine,
  assign,
  createActor,
  enqueueActions,
  InputFrom,
  ProvidedActor,
  Snapshot,
  StateMachine,
  waitFor,
  type ContextFrom,
  type MachineImplementationsFrom,
  type SnapshotFrom,
} from "xstate";

import { BaseControl } from "../controls/base";
import { JSONSocket } from "../controls/socket-generator";
import { Input, Output } from "../input-output";
import {
  getControlBySocket,
  getSocketByJsonSchemaType,
  MappedType,
  Socket,
} from "../sockets";
import { type DiContainer } from "../types";
import type { Node, NodeTypes } from "../types";
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

export type BaseInputType<
  I extends Record<string, any> = {},
  O extends Record<string, any> = {},
> = {
  inputs?: Partial<MappedType<I>>;
  inputSockets?: I;
  outputs?: MappedType<O>;
  outputSockets?: O;
};

export type BaseContextType<
  I extends Record<string, JSONSocket> = {},
  O extends Record<string, JSONSocket> = {},
> = {
  inputs: MappedType<I>;
  outputs: MappedType<O>;
  outputSockets: O;
  inputSockets: I;
  error: {
    name: string;
    message: string;
  } | null;
};

export type ChangeActionEventType<T> = {
  type: "CHANGE_ACTION";
  value: T;
  outputSockets: Record<string, JSONSocket>;
  inputSockets: Record<string, JSONSocket>;
  action: {
    type: T;
  };
};

export type BaseEventTypes =
  | {
      type: "SET_VALUE";
      values: Record<string, any>;
    }
  | {
      type: "RUN";
      values: Record<string, any>;
    }
  | {
      type: "RESET";
    }
  | {
      type: "UPDATE_SOCKET";
      params: {
        name: string;
        side: "input" | "output";
        socket: Partial<JSONSocket>;
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
      type: "updateSocket";
      params?: {
        name: string;
        side: "input" | "output";
        socket: Partial<JSONSocket>;
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
      type: "syncConnection";
      params?: {
        nodeId: string;
        outputKey: string;
        inputKey: string;
      };
    }
  | {
      type: "setError";
      params?: {
        name: string;
        message: string;
      };
    }
  | {
      type: "spawnInputActors";
    }
  | {
      type: "setupInternalActorConnections";
    };

export type BaseActorTypes = ProvidedActor;

export type BaseGuardTypes = {
  type: "NOOP";
};

export type None = "None";

type SpecialMerged<T, U> = U extends None ? T : T | U;

export type BaseMachineTypes<
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
> = {
  // input: MergeDeep<
  //   BaseInputType<T["input"]["inputSockets"], T["input"]["outputSockets"]>,
  //   T["input"] | {}
  // >;
  // context: MergeDeep<
  //   BaseContextType<
  //     T["context"]["inputSockets"],
  //     T["context"]["outputSockets"]
  //   >,
  //   T["context"]
  // >;
  input: MergeDeep<BaseInputType, T["input"]>;
  context: MergeDeep<BaseContextType, T["context"]>;
  guards: SpecialMerged<BaseGuardTypes, T["guards"]>;
  events: SpecialMerged<BaseEventTypes, T["events"]>;
  actions: SpecialMerged<BaseActionTypes, T["actions"]>;
  actors: SpecialMerged<BaseActorTypes, T["actors"]>;
};

type BaseMachine = StateMachine<
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
  public readonly variables: string[] = [];

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

  public isReady: boolean = false;
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

  public inputSockets: Record<string, JSONSocket>;
  public outputSockets: Record<string, JSONSocket>;

  // public output: Record<string, any> = {};

  get inputSchema() {
    return createJsonSchema(this.inputSockets);
  }
  get outputSchema() {
    return createJsonSchema(this.outputSockets);
  }

  get readonly() {
    return !!this.di.executionId || this.di.readonly;
  }

  public executionNodeId?: string;
  unsubscribe: () => void = () => {};

  public baseActions = {
    removeError: assign({
      error: () => null,
    }),
    setError: assign({
      error: ({ event }) => {
        console.error("setError", event);
        return {
          name: event.params?.name || "Error",
          message: event.params?.message || "Something went wrong",
          err: event.data,
        };
      },
    }),
    changeAction: assign({
      inputSockets: ({ event }) => event.inputSockets,
      outputSockets: ({ event }) => event.outputSockets,
      action: ({ event, context }) => ({
        ...context.action,
        type: event.value,
      }),
    }),
    spawnInputActors: enqueueActions(({ enqueue, context }) => {
      for (const [key, value] of Object.entries(context.inputSockets)) {
        console.log("spawnInputActors", key, value);
        if (value["x-actor-type"] && isNil(value["x-actor"])) {
          enqueue.assign({
            inputSockets: ({ context, spawn }) => {
              const actor = spawn(value["x-actor-type"], {
                id: `child_${createId()}`,
                syncSnapshot: true,
              });

              return {
                ...context.inputSockets,
                [key]: {
                  ...context.inputSockets[key],
                  "x-actor": actor,
                  "x-actor-ref": actor,
                },
              };
            },
          });
        }
      }
    }),
    setupInternalActorConnections: async (
      action: ActionArgs<ContextFrom<BaseMachine>, any, any>,
    ) => {
      const { context } = action;
      const { inputSockets } = context;
      for (const socket of Object.values<JSONSocket>(inputSockets)) {
        if (socket["x-actor-config"]) {
          const conf = socket["x-actor-config"][socket["x-actor-type"]!];
          if (!conf) continue;
          for (const [key, value] of Object.entries(conf?.internal)) {
            console.log("$@$@", {
              key,
              value,
            });
            socket["x-actor"]?.send({
              type: "UPDATE_SOCKET",
              params: {
                name: key,
                side: "output",
                socket: {
                  "x-connection": {
                    ...socket["x-connection"],
                    [this.id]: value,
                  },
                },
              },
            });
          }
        }
      }
    },

    syncConnection: async (
      action: ActionArgs<any, any, any>,
      params?: {
        nodeId: string;
        outputKey: string;
        inputKey: string;
      },
    ) => {
      if (!params) {
        throw new Error("Missing params");
      }
      const targetNode = this.di.editor.getNode(params?.nodeId);
      if (targetNode) {
        targetNode.actor.send({
          type: "SET_VALUE",
          values: {
            [params.inputKey]: action.context.outputs[params.outputKey],
          },
        });
      }
    },
    triggerSuccessors: async (
      action: ActionArgs<any, any, any>,
      params?: {
        port: string;
      },
    ) => {
      console.log("triggerSuccessors", action, params);
      if (!params?.port) {
        throw new Error("Missing params");
      }
      const port = action.context.outputSockets[params?.port!];
      await this.triggerSuccessors(port);
    },
    updateSocket: assign({
      inputSockets: ({ context, event }) => {
        if (event.params.side === "input") {
          console.log("updateSocket", event);
          return {
            ...context.inputSockets,
            [event.params.name]: {
              ...context.inputSockets[event.params.name],
              ...event.params.socket,
            },
          };
        }
        return context.inputSockets;
      },
      outputSockets: ({ context, event }) => {
        if (event.params.side === "output") {
          console.log("updateSocket", event);
          return {
            ...context.outputSockets,
            [event.params.name]: {
              ...context.outputSockets[event.params.name],
              ...event.params.socket,
            },
          };
        }
        return context.outputSockets;
      },
    }),
    setValue: assign({
      inputs: ({ context, event }) => {
        Object.keys(context.inputs).forEach((key) => {
          if (!context.inputSockets[key]) {
            delete context.inputs[key];
          }
        });
        Object.keys(event.values).forEach((key) => {
          if (!context.inputSockets[key]) {
            delete event.values[key];
          }
        });
        return {
          ...context.inputs,
          ...event.values,
        };
      },
    }),
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
    this.machineImplements = {
      ...(machineImplements as any),
      actions: {
        ...this.baseActions,
        ...((machineImplements?.actions as any) || {}),
      },
    };

    this.machine = machine.provide({
      ...this.machineImplements,
    }) as Machine;

    this.snap = nodeData.context?.state || {};
    this.inputSockets = nodeData.context?.state?.context?.inputSockets || {};
    this.outputSockets = nodeData.context?.state?.context?.outputSockets || {};
    this.executionNodeId = this.nodeData?.executionNodeId;

    // if (this.nodeData.state) {
    //   // EXECUTION STATE
    //   const actorInput = {
    //     snapshot: this.nodeData.state,
    //   };
    //   this.actor = this.setupActor(actorInput);
    // } else if (this.nodeData.context && this.nodeData.context !== {}) {
    //   // CONTEXT STATE
    //   this.actor = this.setupActor({
    //     snapshot: this.nodeData.context!,
    //   });
    // } else {
    //   this.actor = this.setupActor({
    //     // NEW NODE
    //     input: this.nodeData.context,
    //   });
    // }

    // this.snap = this.actor.getSnapshot();
    // this.inputSockets = this.snapshot.context?.inputSockets || {};
    // this.outputSockets = this.snapshot.context?.outputSockets || {};
    // // this.output = this.snapshot.context?.outputs || {};

    // this.updateInputs(this.inputSockets);
    // this.updateOutputs(this.outputSockets);

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
      executionId: computed,
      setExecutionNodeId: action,
    });

    // this.setup();
  }

  public setup() {
    if (this.nodeData.state) {
      // EXECUTION STATE
      const actorInput = {
        snapshot: this.nodeData.state,
      };
      this.actor = this.setupActor(actorInput);
    } else if (
      this.nodeData.context &&
      has(this.nodeData.context, "context") &&
      has(this.nodeData.context, "value")
    ) {
      // CONTEXT STATE
      this.actor = this.setupActor({
        snapshot: this.nodeData.context!,
      });
    } else {
      this.actor = this.setupActor({
        // NEW NODE
        input: this.nodeData.context,
      });
    }
    this.setSnap(this.actor.getSnapshot() as any);

    console.log("setup", {
      snapshot: this.snapshot,
      raw: this.actor.getSnapshot(),
    });

    this.inputSockets = this.snapshot.context?.inputSockets || {};
    this.outputSockets = this.snapshot.context?.outputSockets || {};

    this.updateInputs(this.inputSockets);
    this.updateOutputs(this.outputSockets);
    const reactForExecutionId = reaction(
      () => this.executionId,
      async (executionId) => {
        if (!executionId) {
          this.setExecutionNodeId(undefined);
        }
      },
    );

    const inputSocketHandlers = reaction(
      () => this.inputSockets,
      async (sockets) => {
        await this.updateInputs(sockets);
      },
    );
    const outputSocketHandlers = reaction(
      () => this.outputSockets,
      async (sockets) => {
        await this.updateOutputs(sockets);
      },
    );
    this.actor.start();
    this.isReady = true;
  }

  public setupActor(
    options:
      | {
          snapshot: SnapshotFrom<Machine>;
        }
      | {
          input: InputFrom<Machine> | ContextFrom<Machine> | undefined;
        },
  ) {
    const saveContextDebounced = debounce(
      async ({ context }: { context: ContextFrom<Machine> }) => {
        // this.di.logger.log(this.identifier, "SAVING CONTEXT STATE");
        this.di.api.setContext({
          contextId: this.contextId,
          context: JSON.stringify(context),
        });
      },
      400,
    );
    const saveStateDebounced = debounce(this.saveState.bind(this), 400);

    const self = this;

    console.log("setupActor", options);
    function withLogging(actorLogic: any) {
      const enhancedLogic = {
        ...actorLogic,
        transition: (state, event, actorCtx) => {
          console.log("State:", state, "Event:", event);

          const persistedState = self.actor.getPersistedSnapshot();
          console.log("SAVE STATE", persistedState);
          saveStateDebounced({ state: persistedState as any });
          if (!self.readonly) {
            saveContextDebounced({ context: persistedState as any });
          }

          return actorLogic.transition(state, event, actorCtx);
        },
      };

      return enhancedLogic;
    }
    const actor = createActor(withLogging(this.machine), {
      id: this.contextId,
      ...options,
    });
    console.log("@@", actor, this.machine, options);
    let prev = actor.getSnapshot() as any;
    const listener = actor.subscribe({
      complete: async () => {
        // this.di.logger.log(this.identifier, "finito main");
      },
      next: async (state: any) => {
        this.state = state.value as any;
        this.setSnap(state);

        if (!isEqual(prev.context?.inputSockets, state.context.inputSockets)) {
          this.setInputSockets(state.context?.inputSockets || {});
        }
        if (
          !isEqual(prev.context?.outputSockets, state.context.outputSockets)
        ) {
          this.setOutputSockets(state.context?.outputSockets || {});
        }

        if (!isEqual(prev.context.outputs, state.context.outputs)) {
          this.di.dataFlow?.cache.delete(this.id); // reset cache for this node.
        }
        prev = state as any;
      },
    });

    this.unsubscribe = listener.unsubscribe;

    return actor;
  }

  public async reset() {
    // TODO: implement this

    this.unsubscribe();
    // const nodeContext = await this.di.api.trpc.craft.node.getContext.query({
    //   contextId: this.contextId,
    // });

    // this.actor = this.setupActor({
    //   snapshot: nodeContext.state as ContextFrom<Machine>,
    // });
    // this.updateInputs(nodeContext.state.context.inputSockets);
    // this.updateOutputs(nodeContext.state.context.outputSockets);

    this.setup();
    this.di.area?.update("node", this.id);

    // this.actor.start();
  }

  async updateOutputs(rawTemplate: Record<string, JSONSocket>) {
    console.log("updateOutputs", rawTemplate);
    for (const item of Object.keys(this.outputs)) {
      console.log("item", item, rawTemplate[item]);
      if (rawTemplate[item]) continue;
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
    let index = 0;
    for (const [key, item] of Object.entries(rawTemplate)) {
      if (this.hasOutput(key)) {
        const output = this.outputs[key];
        if (output) {
          output.socket = getSocketByJsonSchemaType(item)! as any;
        }
        continue;
      }

      const socket = getSocketByJsonSchemaType(item)!;
      const output = new Output(
        socket,
        key,
        item.isMultiple || true,
        this.pactor,
        (snapshot) => snapshot.context.outputSockets[key],
      ) as any;
      output.index = index + 1;
      this.addOutput(key, output);
    }
  }

  async updateInputs(rawTemplate: Record<string, JSONSocket>) {
    console.log("updateInputs", rawTemplate);
    const state = this.actor.getSnapshot() as SnapshotFrom<BaseMachine>;
    // CLEAN up inputs
    for (const item of Object.keys(this.inputs)) {
      if (rawTemplate[item]) continue;
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
          } as any);
        }
      }
      this.removeInput(item);
    }

    const values: Record<string, any> = {
      ...state.context.inputs,
    };

    let index = 0;

    const addController = (
      input: Input,
      item: JSONSocket,
      key: string,
      socket: Socket,
    ) => {
      if (item["x-actor-ref"]) {
        console.log({ socket, item, input, key });
        const controller = getControlBySocket({
          socket: socket,
          actor: item["x-actor-ref"],
          // selector: (snapshot) => snapshot.context.inputs[key],
          selector: (snapshot) => snapshot.context.outputs["config"],
          onChange: (v) => {
            this.pactor.send({
              type: "SET_VALUE",
              values: {
                [key]: v,
              },
            });
          },
          definition: item,
        });
        input.addControl(controller);
      } else {
        const controller = getControlBySocket({
          socket: socket,
          actor: this.pactor,
          selector: (snapshot) => snapshot.context.inputs[key],
          onChange: (v) => {
            this.pactor.send({
              type: "SET_VALUE",
              values: {
                [key]: v,
              },
            });
          },
          definition: item,
        });
        input.addControl(controller);
      }
    };
    for (const [key, item] of Object.entries(rawTemplate)) {
      if (this.hasInput(key)) {
        const input = this.inputs[key];
        if (input) {
          const socket = getSocketByJsonSchemaType(item)! as any;
          if (item["x-compatible"]) {
            for (const compatible of item["x-compatible"]) {
              socket.combineWith(compatible);
            }
          }

          input.socket = socket;
          input.actor = this.actor;
          if (input.control) {
            input.removeControl();
            addController(input, item, key, input.socket);
          }
        }
        continue;
      }

      const socket = getSocketByJsonSchemaType(item)!;
      const input = new Input(
        socket,
        item.name,
        item.isMultiple,
        this.pactor,
        (snapshot) => {
          return snapshot.context.inputSockets[key];
        },
        /**
         * TODO:
         * We need a smarter way of determining if the input should be shown or not.
         * need to track the if value set or not.
         * if value is not set show the input
         */
      );

      if (item["x-order"]) {
        index = item["x-order"];
      }
      input.index = index + 1;
      addController(input, item, key, socket);
      this.addInput(key, input as any);
      if (item.type !== "trigger" && isUndefined(values[key])) {
        console.log(
          "setting default value",
          item.name,
          item.type,
          item.default,
        );
        if (!isUndefined(item.default) && !item["x-actor"]) {
          values[key] = item.default;
        } else {
          // values[key] = item.type === "date" ? undefined : "";
          values[key] = undefined;
        }
      }
    }
    console.log("setting values", values);
    this.pactor.send({
      type: "SET_VALUE",
      values,
    });
  }

  public setOutputSockets(sockets: Record<string, JSONSocket>) {
    this.outputSockets = sockets;
  }

  public setInputSockets(sockets: Record<string, JSONSocket>) {
    this.inputSockets = sockets;
  }

  public setSnap(snap: SnapshotFrom<Machine>) {
    this.snap = snap;
  }

  public setExecutionNodeId(executionNodeId: string | undefined) {
    this.executionNodeId = executionNodeId;
  }

  async saveState({ state }: { state: SnapshotFrom<Machine> }) {
    if (this.executionId) {
      console.log("Execution NodeId:", this.executionNodeId);
      if (!this.executionNodeId) {
        console.log("Setting Execution ID");
        this.setExecutionNodeId(this.di.createId("state"));
      }
      const saved = await this.di.api.setState({
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
    executionId: string,
  ) {
    console.log(this.identifier, "@@@", input, "execute", executionId);

    const allConnections = this.di.editor
      .getConnections()
      .filter((c) => c.target === this.id);
    const isInSYNC = allConnections.every((c) => c.inSync);
    console.log("isInSYNC", isInSYNC);

    if (!isInSYNC) {
      allConnections.forEach((c) => {
        c.sync();
      });
    }

    console.log(this.snapshot.status);
    if (this.snapshot.status === "done") {
      console.log("Running same node In the single execution with new input");
      this.executionNodeId = undefined; // reset execution node id
      this.actor = this.setupActor({
        input: this.snapshot.context as any,
      });
      this.actor.start();
    }
    const canRun = this.snapshot.can({
      type: input,
      values: {},
    });

    console.log("#".repeat(40), {
      input,
      canRun,
    });
    if (canRun) {
      this.pactor.send({
        type: input,
        values: {},
      });
    } else {
      this.pactor.send({
        type: "RUN",
        values: {},
      });
    }

    //   this.di.engine.emit({
    //     type: "execution-step-start",
    //     data: {
    //       payload: this,
    //       executionId: executionId!,
    //     },
    //   });

    //   // EARLY RETURN IF NODE IS COMPLETE
    //   if (this.pactor.getSnapshot().matches("complete")) {
    //     // this.di.logger.log(this.identifier, "finito Execute", this.outputs);
    //     this.di.engine.emit({
    //       type: "execution-step-complete",
    //       data: {
    //         payload: this,
    //         executionId: executionId,
    //       },
    //     });
    //     if (this.outputs.trigger) {
    //       // forward("trigger");
    //       // if (this.di.headless) {
    //       //   await this.triggerSuccesors(executionId);
    //       // } else {
    //       forward("trigger");
    //       // }
    //       return;
    //     }
    //   }

    //   const inputs = await this.getInputs();
    //   this.di.logger.log(this.identifier, "INPUTS", inputs, this.actor);

    //   await waitFor(this.pactor, (state) => state.matches("idle")); // wait for the node to be idle

    //   this.pactor.send({
    //     type: "RUN",
    //     values: inputs,
    //   });

    //   console.log("RUNNED", {
    //     succesors: this.successorNodes,
    //   });

    //   this.pactor.subscribe({
    //     next: (state) => {
    //       this.di.engine.emit({
    //         type: "execution-step-update",
    //         data: {
    //           payload: this,
    //           executionId: executionId,
    //         },
    //       });
    //       console.log(this.identifier, "@@@", "next", state.value, state.context);
    //     },
    //     complete: async () => {
    //       // this.di.logger.log(this.identifier, "finito Execute", this.outputs);
    //       this.di.engine.emit({
    //         type: "execution-step-complete",
    //         data: {
    //           payload: this,
    //           executionId: executionId,
    //         },
    //       });

    //       if (this.successorNodes.length > 0) {
    //         // if (this.di.headless) {
    //         //   await this.triggerSuccesors(executionId);
    //         // } else {
    //         forward("trigger");
    //         // }
    //       } else {
    //         this.di.engine.emit({
    //           type: "execution-completed",
    //           data: {
    //             payload: this,
    //             output: this.pactor.getSnapshot().output,
    //             executionId,
    //           },
    //         });
    //       }
    //     },
    //   });
    //   await waitFor(this.pactor, (state) => state.matches("complete"), {
    //     timeout: 1000 * 60 * 5,
    //   });
  }

  async triggerSuccessors(outputSocket: JSONSocket) {
    console.log("TRIGGERING", outputSocket);
    const connections = outputSocket["x-connection"] || {};
    for (const [nodeId, inputKey] of Object.entries(connections)) {
      const targetNode = this.di.editor.getNode(nodeId);
      const socket = targetNode.snap.context.inputSockets[inputKey];
      console.log("TRIGGERING", targetNode.id, socket["x-event"]);

      await this.di.runSync({
        inputId: targetNode.id,
        event: socket["x-event"],
      });
    }

    // const cons = this.di.editor
    //   .getConnections()
    //   .filter((c) => {
    //     return c.source === this.id;
    //   })
    //   .filter((c) => {
    //     return this.outputs[c.sourceOutput]?.socket.name === "trigger";
    //   })
    //   .filter((c) => {
    //     return !outputKey || c.sourceOutput === outputKey;
    //   });

    // cons.forEach(async (con) => {
    //   console.log("CONNNECTION ======>", con);
    //   const targetNode = this.di.editor.getNode(con.target);
    //   const socket = targetNode.snap.context.inputSockets[con.targetInput];

    //   console.log("TRIGGERING", targetNode.id, socket["x-event"]);

    //   await this.di.runSync({
    //     inputId: targetNode.id,
    //     event: socket["x-event"],
    //   });
    // });
  }

  get successorNodes() {
    return this.di.graph.successors(this.id).nodes();
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
    let state = this.pactor.getSnapshot();
    if (
      state.context.inputs &&
      !isEqual(state.context.inputs, inputs) &&
      this.ID !== "InputNode"
    ) {
      this.di.logger.log(
        this.identifier,
        "inputs are not matching computing",
        inputs,
        state.context.inputs,
      );
      await this.compute(inputs);
    }
    // this.di.logger.log(this.identifier, "actor in data", this.actor);
    if (state.matches("running")) {
      this.di.logger.log(this.identifier, "waiting for complete");
      await waitFor(this.pactor, (state) => state.matches("complete"));
    }
    state = this.actor.getSnapshot();

    return {
      ...state.context.outputs,
    };
  }

  async compute(inputs: ContextFrom<Machine>["inputs"]) {
    const inputRaw = await this.getInputs();
    Object.entries(inputRaw).forEach(([key, value]) => {
      if (this.snapshot.context.inputs[key] !== value) {
        this.pactor.send({
          type: "SET_VALUE",
          values: {
            [key]: value,
          },
        });
      }
    });
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
            }),
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
        this.addOutput(key, new Output(socket as any, key, true));
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
            }),
        );
        this.removeOutput(key);
      }
    });
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

      const inputs = (await this.di?.dataFlow?.fetchInputs(this.id)) as {
        [x: string]: string;
      };
      console.log("GETTING INPUTS", { inputs, inputttt: this.inputs });

      // asign values from context to inputs if input is not connected
      const state = this.pactor.getSnapshot();
      Object.entries(this.inputs)
        .filter(([key, input]) => {
          return !(input.socket instanceof TriggerSocket);
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

  async serialize(): Promise<ParsedNode<NodeTypes, Machine>> {
    const state = this.actor.getPersistedSnapshot() as Snapshot<Machine> as any; //TODO: types
    return {
      ...this.nodeData,
      // state: state,
      context: state,
      width: this.width,
      height: this.height,
    };
  }
}
