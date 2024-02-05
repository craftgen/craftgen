import { init } from "@paralleldrive/cuid2";
import Ajv from "ajv";
import { cloneDeep, debounce, get, isNil } from "lodash-es";
import { action, computed, makeObservable, observable } from "mobx";
import PQueue from "p-queue";
import { NodeEditor } from "rete";
import type { GetSchemes, NodeId } from "rete";
import type { Area2D, AreaExtensions, AreaPlugin } from "rete-area-plugin";
import type { HistoryActions } from "rete-history-plugin";
import { structures } from "rete-structures";
import type { Structures } from "rete-structures/_types/types";
import { P, match } from "ts-pattern";
import type { SetOptional } from "type-fest";
import {
  setup,
  assign,
  type AnyActor,
  type AnyStateMachine,
  type ContextFrom,
  type InputFrom,
  type SnapshotFrom,
  enqueueActions,
  createActor,
  Actor,
  MachineImplementationsFrom,
  ActionArgs,
  assertEvent,
  AnyActorRef,
} from "xstate";
// import { createBrowserInspector } from "@statelyai/inspect";

import { useMagneticConnection } from "./connection";
import { Connection } from "./connection/connection";
import { createControlFlowEngine, createDataFlowEngine } from "./engine";
import type { Input, Output } from "./input-output";
import type { InputNode } from "./nodes";
import type {
  BaseMachine,
  BaseNode,
  HasConnectionGuardParams,
  ParsedNode,
} from "./nodes/base";
import type { CustomArrange } from "./plugins/arrage/custom-arrange";
import type { setupPanningBoundary } from "./plugins/panningBoundary";
import type {
  ClassicScheme,
  ReactArea2D,
  ReactPlugin,
} from "./plugins/reactPlugin";
import type { Socket } from "./sockets";
import type { Node, NodeClass, Position, Schemes, WorkflowAPI } from "./types";
import {
  ActorConfig,
  ConnectionConfigRecord,
  JSONSocket,
} from "./controls/socket-generator";
import { GuardArgs } from "xstate/guards";
import {
  Subject,
  catchError,
  debounceTime,
  from,
  groupBy,
  map,
  mergeMap,
  of,
  switchMap,
  tap,
} from "rxjs";

export type AreaExtra<Schemes extends ClassicScheme> = ReactArea2D<Schemes>;

type NodeRegistry = Record<string, NodeClass>;
type MachineRegistry = Record<string, AnyStateMachine>;

export type NodeWithState<
  T extends NodeRegistry,
  K extends keyof T = keyof T,
> = Node & {
  type: keyof T;
  context: SnapshotFrom<InstanceType<T[K]>["machine"]>;
  state?: SnapshotFrom<InstanceType<T[K]>["machine"]>;
};

// Define a utility type to convert ParsedNode to NodeWithState
type ConvertToNodeWithState<
  T extends NodeRegistry,
  P extends ParsedNode<any, any>,
> = {
  [K in keyof P]: K extends "type" ? keyof T : P[K];
};

export interface EditorHandlers {
  incompatibleConnection?: (data: { source: Socket; target: Socket }) => void;
}

export interface EditorProps<
  NodeProps extends BaseNode<any, any, any>,
  ConnProps extends Connection<NodeProps, NodeProps>,
  Scheme extends GetSchemes<NodeProps, ConnProps>,
  Registry extends NodeRegistry,
> {
  config: {
    nodes: Registry;
    api: WorkflowAPI;
    logger?: typeof console;
    readonly?: boolean; // default false
    meta: {
      workflowId: string;
      workflowVersionId: string;
      projectId: string;
      executionId?: string;
    };
    on?: EditorHandlers;
  };
  content?: {
    nodes: ConvertToNodeWithState<Registry, ParsedNode<any, any>>[];
    edges: SetOptional<ConnProps, "id">[];
    contexts: SnapshotFrom<AnyStateMachine>[];
  };
}

// const { inspect } = createBrowserInspector();

const EditorMachine = setup({
  types: {
    context: {} as {
      actors: Record<string, AnyActorRef>;
    },
    input: {} as {
      actors: Record<string, AnyActorRef>;
    },
    events: {} as
      | {
          type: "SPAWN";
          params: {
            parentId?: string;
            id: string;
            systemId: string;
            machineId: string;
            input: Record<string, any> & {
              parent?: string;
            };
          };
        }
      | {
          type: "DESTROY";
          params: {
            id: string;
          };
        },
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QFEIEsAuB7ATgOjQgBswBiAEWQGUAVAJQHkBNAbQAYBdRUABy1kxosAO24gAHogDMAJgCMeKQE4A7AA4ZbJVJUqZUgDQgAntI2K5UtXIBsAViUAWHTLt2Avu6OpMuAsTIqAAUAQQB1ADl2LiQQPgEMIVFYyQQAWjktCztMqTYZG1dHG0MTREsZPHtnORU7Rzs2OUcWzy8QYSwIODEfbBwxeMERMVSMuxVs3PzC+pKjUwQFNialGzla-WKlGUdPb3R+-xJB-mHk0FS5NUm1KXurNQdZGRkFxEc2KSqlO1lHPROZwFNruIA */
  id: "Editor",
  description:
    "Editor machine responsible of spawning and destroying node actors.",
  context: ({ input }) => {
    return {
      ...input,
    };
  },

  initial: "idle",
  states: {
    idle: {
      on: {
        DESTROY: {
          description: "Destroy a node actor",
          actions: enqueueActions(({ enqueue, system, event }) => {
            const actor: AnyActor = system.get(event.params.id);
            if (!actor) {
              throw new Error(`Actor with id ${event.params.id} not found`);
            }

            // If actor has child actors, destroy them as well.
            const childs = actor.getSnapshot().context.inputSockets as Record<
              string,
              JSONSocket
            >;
            Object.entries(childs)
              .filter(([key, value]) => {
                return value["x-actor-id"];
              })
              .map(([key, value]) => value["x-actor-id"]!)
              .forEach((childActorId: string) => {
                const childActor = system.get(childActorId);

                if (childActor) {
                  enqueue.raise({
                    type: "DESTROY",
                    params: {
                      id: childActorId,
                    },
                  });
                }
              });

            enqueue.stopChild(({ system, event }) =>
              system.get(event.params.id),
            );
            enqueue.assign({
              actors: ({ context, event }) => {
                const actors = { ...context.actors };
                delete actors[event.params.id];
                return actors;
              },
            });
          }),
        },
        SPAWN: {
          description:
            "Spawn a node actor and inline actors. (a.k.a nested actors)",
          actions: enqueueActions(
            ({ enqueue, event, context, check, system }) => {
              console.log("REQUEST FOR SPAWN", event);
              enqueue.assign({
                actors: ({ spawn, context }) => {
                  const actor = spawn(event.params.machineId, {
                    input: event.params.input,
                    id: event.params.id,
                    syncSnapshot: true,
                    systemId: event.params.systemId,
                  });
                  return {
                    ...context.actors,
                    [event.params.id]: actor,
                  };
                },
              });
            },
          ),
        },
      },
    },
  },
});

function withLogging(actorLogic: any) {
  const enhancedLogic = {
    ...actorLogic,
    transition: (state, event, actorCtx) => {
      console.log("🕷️ State:", state, "Event:", event);
      // Transition state only contains the pre transition state.
      // event getting persisted snapshot will endup with the pre transition state.
      // better persist state in actor subscribe.next listener.

      return actorLogic.transition(state, event, actorCtx);
    },
  };

  return enhancedLogic;
}

export class Editor<
  NodeProps extends BaseNode<any, any, any, any> = BaseNode<any, any, any, any>,
  ConnProps extends Connection<NodeProps, NodeProps> = Connection<
    NodeProps,
    NodeProps
  >,
  Scheme extends GetSchemes<NodeProps, ConnProps> & Schemes = GetSchemes<
    NodeProps,
    ConnProps
  > &
    Schemes,
  Registry extends NodeRegistry = NodeRegistry,
  NodeTypes extends keyof Registry = keyof Registry,
> {
  public editor = new NodeEditor<Scheme>();
  public engine = createControlFlowEngine<Scheme>();
  public dataFlow = createDataFlowEngine<Scheme>();
  public graph: Structures<NodeProps, ConnProps> = structures(this.editor);
  public api: WorkflowAPI;

  // UI related
  public area?: AreaPlugin<Scheme, AreaExtra<Scheme>>;
  public areaControl?: {
    zoomAtNodes: (nodeIds: string[]) => Promise<void>;
  };
  public selector?: ReturnType<typeof AreaExtensions.selector>;
  public nodeSelector?: ReturnType<typeof AreaExtensions.selectableNodes>;
  public panningBoundary?: ReturnType<typeof setupPanningBoundary>;
  public arrange?: CustomArrange<Scheme>;
  public cursorPosition: Position = { x: 0, y: 0 };
  public selectedNodeId: NodeId | null = null;

  public nodeMeta = new Map<
    keyof Registry,
    {
      nodeType: keyof Registry;
      label: string;
      description: string;
      icon: string;
      class: NodeClass;
      section?: string;
    }
  >();

  public stateEvents = new Subject<{
    executionId: string | undefined;
    nodeExecutionId: string | undefined;
    state: SnapshotFrom<AnyStateMachine>;
    readonly: boolean;
  }>();

  public variables = new Map<string, string>();

  public content = {
    contexts: [] as SnapshotFrom<AnyStateMachine>[],
    nodes: [] as NodeWithState<Registry>[],
    edges: [] as SetOptional<ConnProps, "id">[],
  };

  public setContent(content: {
    contexts: SnapshotFrom<AnyStateMachine>[];
    nodes: NodeWithState<Registry>[];
    edges: SetOptional<ConnProps, "id">[];
  }) {
    this.content = content;
  }

  public selectedInputId: string | null = null;
  public readonly: boolean;
  public render: ReactPlugin<Scheme, AreaExtra<Scheme>> | undefined;
  public registry: NodeRegistry = {} as NodeRegistry;
  public machines: MachineRegistry = {} as MachineRegistry;

  get selectedInput(): InputNode | null {
    if (this.inputs.length === 1) {
      this.selectedInputId = this.inputs[0]?.id || null;
    }
    if (!this.selectedInputId) return null;
    return this.editor.getNode(this.selectedInputId);
  }

  get rootNodes() {
    return this.graph.roots().nodes();
  }

  get leaves() {
    return this.graph.leaves().nodes();
  }

  get selectedOutputs() {
    if (!this.selectedInput) return null;
    const successors = this.graph.successors(this.selectedInput?.id);
    if (successors.nodes().length > 0) {
      return successors.leaves().nodes();
    }
    return [this.selectedInput];
  }

  public get inputs() {
    return this.rootNodes;
  }

  public setInput(id: string) {
    this.selectedInputId = id;
  }

  public logger = console;
  public readonly workflowId: string;
  public readonly workflowVersionId: string;
  public readonly projectId: string;

  public executionId?: string;
  public executionStatus:
    | "running"
    | "stopped"
    | "failed"
    | "completed"
    | null = null;

  public handlers: EditorHandlers;

  public machine: typeof EditorMachine;
  public actor: Actor<typeof EditorMachine> | undefined;

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

  public baseActions: MachineImplementationsFrom<BaseMachine>["actions"] = {
    removeError: assign({
      error: () => null,
    }),
    setError: assign({
      error: ({ event }, params) => {
        console.error("setError", event);
        return {
          name: params?.name || event?.params?.name || "Error",
          message:
            params?.message || event?.params?.message || "Something went wrong",
          err: params?.stack || event.error,
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
    assignParent: enqueueActions(({ enqueue, event, context, check }) => {
      console.log("#".repeat(20), "ASSIGNING PARENT");
      if (check(({ context }) => !isNil(context.parent))) {
        console.log("SENDING TO PARENT", context.parent?.id);
        enqueue.sendTo(
          ({ context, system }) => system.get(context.parent?.id!),
          ({ context, self }) => ({
            type: "ASSIGN_CHILD",
            params: {
              actor: self,
              port: context.parent?.port!,
            },
          }),
        );
      }
    }),
    assignChild: enqueueActions(({ enqueue, event, context, check }) => {
      assertEvent(event, "ASSIGN_CHILD");
      enqueue.assign({
        inputSockets: ({ context, system, event }) => {
          assertEvent(event, "ASSIGN_CHILD");
          const port = event.params.port;
          const socket = context.inputSockets[port];
          const actorType = event.params.actor.src as string;
          console.log("ASSIGN_CHILD", event);

          return {
            ...context.inputSockets,
            [port]: {
              ...socket,
              // "x-actor": event.params.actor,
              // "x-actor-id": event.params.actor.id,
              "x-actor-type": actorType,
              "x-actor-ref": event.params.actor,
              "x-actor-ref-id": event.params.actor.id,
              "x-actor-ref-type": actorType,
              "x-actor-config": {
                ...socket["x-actor-config"],
                [actorType]: {
                  ...socket["x-actor-config"][actorType],
                  actor: event.params.actor,
                  actorId: event.params.actor.id,
                },
              },
            } as Partial<JSONSocket>,
          };
        },
      });

      const socket = context.inputSockets[event.params.port] as JSONSocket;
      const conf = get(socket, [
        "x-actor-config",
        event.params.actor.src as string,
      ]);
      if (!conf) {
        console.error("Missing config for", event.params.actor.src);
      }

      for (const [key, value] of Object.entries(conf?.internal)) {
        enqueue.sendTo(event.params.actor, ({ context, self }) => {
          return {
            type: "UPDATE_SOCKET",
            params: {
              name: key,
              side: "output",
              socket: {
                "x-connection": {
                  ...socket["x-connection"],
                  [self.id]: {
                    key: value,
                    actorRef: self,
                  },
                } as ConnectionConfigRecord,
              },
            },
          };
        });
      }
    }),
    spawnInputActors: enqueueActions(({ enqueue, context, system }) => {
      console.group("SPAWN INPUT ACTORS");
      for (const [key, value] of Object.entries<JSONSocket>(
        context.inputSockets,
      )) {
        if (isNil(value["x-actor-type"])) {
          // skip if no actor type.
          continue;
        }

        if (isNil(value["x-actor-ref"])) {
          // actor not spawned yet.
          console.log("ACTOR NOT ASSIGNED YET");

          if (
            value["x-actor-ref-id"] &&
            value["x-actor-ref-type"] === value["x-actor-type"]
          ) {
            console.log("ACTOR REF ID EXISTS and matching");
            // actor id exists but not the actor. link it.
            const actorRef = system.get(value["x-actor-ref-id"]!);
            if (!actorRef) {
              console.error("ACTOR NOT FOUND", value["x-actor-ref-id"]);
            }
            enqueue.assign({
              inputSockets: ({ context }) => {
                return {
                  ...context.inputSockets,
                  [key]: {
                    ...context.inputSockets[key],
                    "x-actor-ref": actorRef,
                  },
                };
              },
            });
          } else {
            console.log("SPAWNING ACTOR", value["x-actor-type"]);
            const actorId = this.createId("context");
            enqueue.sendTo(this.actor?.ref, ({ self }) => ({
              type: "SPAWN",
              params: {
                parent: self.id,
                id: actorId,
                machineId: value["x-actor-type"]!,
                systemId: actorId,
                input: {
                  inputs: {
                    ...(value.default as any),
                  },
                  parent: {
                    id: self.id,
                    port: key,
                  },
                } as any,
              },
            }));
          }
        } else {
          console.log("THERES ALREADY ACTOR");
          if (value["x-actor-type"] !== value["x-actor-ref-type"]) {
            // actor type changed;
            console.log("ACTOR TYPE CHANGED", {
              before: value["x-actor-ref-type"],
              after: value["x-actor-type"],
            });

            const actorConf = get(value, [
              "x-actor-config",
              value["x-actor-type"],
            ]) as ActorConfig;
            console.log("ACTOR CONF", actorConf);
            if (!actorConf) {
              throw new Error("Missing actor conf");
            }

            if (actorConf.actor) {
              console.log("EXISTING ACTOR REF", actorConf.actor);
              // actor already spawned;
              enqueue.assign({
                inputSockets: ({ context }) => {
                  return {
                    ...context.inputSockets,
                    [key]: {
                      ...context.inputSockets[key],
                      "x-actor-ref": actorConf.actor,
                      "x-actor-ref-id": actorConf.actor?.id,
                      "x-actor-ref-type": actorConf.actor?.src,
                    },
                  };
                },
              });
            } else {
              console.log("ACTOR DIDN'T SPAWNED YET");
              const actorId = this.createId("context");
              enqueue.sendTo(this.actor?.ref, ({ self }) => ({
                type: "SPAWN",
                params: {
                  parent: self.id,
                  id: actorId,
                  machineId: value["x-actor-type"]!,
                  systemId: actorId,
                  input: {
                    inputs: {
                      ...(value.default as any),
                    },
                    parent: {
                      id: self.id,
                      port: key,
                    },
                  } as any,
                },
              }));
            }
          }
        }
      }
      console.groupEnd();
    }),

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
      const targetNode = this.editor.getNode(params?.nodeId);
      console.group("syncConnection");
      console.log("NODES", this.editor.getNodes());
      console.log("targetNode", targetNode);
      console.groupEnd();
      if (targetNode) {
        targetNode.actor.send({
          type: "SET_VALUE",
          params: {
            values: {
              [params.inputKey]: action.context.outputs[params.outputKey],
            },
          },
        });
      }
    },
    triggerNode: async (
      action: ActionArgs<any, any, any>,
      params: {
        nodeId: string;
        event: {
          type: string;
          params: {
            executionNodeId?: string;
            values?: Record<string, any>;
            sender?: AnyActorRef;
          };
        };
      },
    ) => {
      throw new Error("Not Implemented yet.");
      // if (!params) {
      //   throw new Error("Missing params");
      // }
      // const targetNode = this.editor.getNode(params?.nodeId);
      // if (!targetNode) {
      //   throw new Error("Missing targetNode");
      // }

      // params.event.params.sender = this.pactor.ref;
      // targetNode.actor.send(params.event);
    },
    setExecutionNodeId: async (
      action: ActionArgs<any, any, any>,
      params?: {
        executionNodeId?: string;
      },
    ) => {
      throw new Error("Not Implemented yet.");
      if (params?.executionNodeId) {
        this.setExecutionNodeId(params?.executionNodeId);
      } else {
        this.setExecutionNodeId(this.di.createId("state"));
      }
      this.setup();
    },
    triggerSuccessors: async (
      action: ActionArgs<any, any, any>,
      params?: {
        port: string;
      },
    ) => {
      // throw new Error("Not Implemented yet.");
      console.log("triggerSuccessors", action, params);
      if (!params?.port) {
        throw new Error("Missing params");
      }
      const port = action.context.outputSockets[params?.port];

      // await this.triggerSuccessors(port);
      const connections = port["x-connection"] || {};
      for (const [nodeId, conn] of Object.entries(connections)) {
        const targetNode = this.editor.getNode(nodeId);
        const socket = targetNode.snap.context.inputSockets[conn.key];
        console.log("TRIGGERING", targetNode.id, socket["x-event"]);
        // TODO: we might able to send events directly in here.
        await this.runSync({
          inputId: targetNode.id,
          event: socket["x-event"],
        });
      }
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
      inputs: ({ context, event }, params: { values: Record<string, any> }) => {
        const values = event.params?.values || params?.values;
        Object.keys(context.inputs).forEach((key) => {
          if (!context.inputSockets[key]) {
            delete context.inputs[key];
          }
        });
        Object.keys(values).forEach((key) => {
          if (!context.inputSockets[key]) {
            delete values[key];
          }
        });

        return {
          ...context.inputs,
          ...values,
        };
      },
    }),
  };

  constructor(props: EditorProps<NodeProps, ConnProps, Scheme, Registry>) {
    this.workflowId = props.config.meta.workflowId;
    this.workflowVersionId = props.config.meta.workflowVersionId;
    this.projectId = props.config.meta.projectId;
    this.executionId = props.config.meta?.executionId;
    this.readonly = props.config.readonly || false;
    this.registry = props.config.nodes;
    this.machines = Object.entries(props.config.nodes).reduce(
      (acc, [key, value]) => {
        Object.entries(value.machines).forEach(([machineId, value]) => {
          if (acc[machineId as string]) {
            throw new Error(`Machine with id ${machineId} already exists`);
          }
          acc[machineId as string] = value;
        });
        return acc;
      },
      {} as MachineRegistry,
    );

    this.machine = EditorMachine.provide({
      // actions: {
      //   ...this.baseActions,
      // },
      actors: {
        ...Object.keys(this.machines).reduce(
          (acc, k) => {
            if (acc[k]) {
              throw new Error(`Actor ${k} already exists`);
            }
            const machine = this.machines[k];

            acc[k] = machine.provide({
              actions: {
                ...this.baseActions,
              },
              guards: {
                ...this.baseGuards,
              },
            });
            return acc;
          },
          {} as Record<string, AnyStateMachine>,
        ),
      },
    });
    // this.actor.start();

    makeObservable(this, {
      cursorPosition: observable,
      setCursorPosition: action,

      selectedNodeId: observable,
      setSelectedNodeId: action,
      selectedNode: computed,

      selectedInputId: observable,
      selectedInput: computed,
      setInput: action,

      executionId: observable,
      setExecutionId: action,
    });

    Object.entries(props.config.nodes).forEach(([key, value]) => {
      this.nodeMeta.set(key, {
        nodeType: key,
        label: value.label,
        description: value.description,
        icon: value.icon,
        section: value.section,
        class: value,
      });
    });

    this.api = props.config.api;
    console.log("DATA IN ======>", props.content);
    this.content = {
      nodes: (props.content?.nodes as NodeWithState<Registry>[]) || [],
      edges: props.content?.edges || [],
      contexts: props.content?.contexts || [],
    };
    this.validateNodes(this.content);

    // handlers for events which might require user attention.
    this.handlers = props.config.on || {};
  }

  public createId(prefix: "node" | "conn" | "context" | "state") {
    const createId = init({
      length: 10,
      fingerprint: this.workflowId,
    });
    return `${prefix}_${createId()}`;
  }

  public async createNodeInstance(
    node: ConvertToNodeWithState<Registry, ParsedNode<any, any>>,
  ) {
    const nodeMeta = this.nodeMeta.get(node.type);
    if (!nodeMeta) {
      throw new Error(`Node type ${String(node.type)} not registered`);
    }
    const nodeClass = nodeMeta.class;
    const nodeActor = this.actor.system.get(node.contextId);
    if (!nodeActor) {
      console.log(
        "ACTOR NOT FOUND | SPAWNING",
        node.id,
        node.contextId,
        node.type,
        node.state,
      );
      this.actor.send({
        type: "SPAWN",
        params: {
          id: node.contextId,
          machineId: node.type as string,
          input: node.state,
          systemId: node.contextId, // context
        },
      });
    }
    console.log("EDITOR STATE", this.actor.getPersistedSnapshot());

    return new nodeClass(this, node);
  }

  public async duplicateNode(node_Id: string) {
    const { state, executionNodeId, ...node } = await this.editor
      .getNode(node_Id)
      .serialize();
    const newNode = this.createNodeInstance({
      ...node,
      id: this.createId("node"),
      contextId: this.createId("context"),
    });
    return newNode;
  }

  public async addNode(
    node: NodeTypes,
    context?: Partial<InputFrom<AnyStateMachine>>,
    meta?: {
      label?: string;
    },
  ) {
    const nodeMeta = this.nodeMeta.get(node);
    if (!nodeMeta) {
      throw new Error(`Node type ${String(node)} not registered`);
    }
    if (nodeMeta.nodeType === "ModuleNode") {
      const isSameModule = context?.moduleId === this.workflowVersionId;
      if (isSameModule) {
        throw new Error("Can not add self module");
      }
    }
    const newNode = await this.createNodeInstance({
      type: node,
      label: meta?.label ?? nodeMeta?.label,
      id: this.createId("node"),
      contextId: this.createId("context"),
      context,
    });

    await this.editor.addNode(newNode);
    await this?.area?.translate(newNode.id, {
      x: this.cursorPosition.x,
      y: this.cursorPosition.y,
    });
    return newNode;
  }

  public async createEditor(workflowVersionId: string) {
    const workflow = await this.api.trpc.craft.module.getById.query({
      versionId: workflowVersionId,
    });
    const di = new Editor({
      config: {
        api: this.api,
        readonly: true,
        meta: {
          projectId: this.projectId,
          workflowId: this.workflowId,
          workflowVersionId: workflowVersionId,
          executionId: this.executionId,
        },
        nodes: Array.from(this.nodeMeta.entries()).reduce(
          (acc, [key, value]) => {
            acc[key as string] = value.class;
            return acc;
          },
          {} as NodeRegistry,
        ),
      },
      content: {
        edges: workflow.edges,
        nodes: workflow.nodes,
      },
    });
    await di.setup();

    console.log("Editor created", di);
    return di;
  }

  public async setupEnv() {
    const creds = this.api.trpc.credentials.list.query({
      projectId: this.projectId,
    });
    console.log("CREDS", creds);
    // const openai = await this.api.getAPIKey({
    //   key: "OPENAI_API_KEY",
    //   projectId: this.projectId,
    // });
    // this.variables.set("OPENAI_API_KEY", openai);
  }

  public async setup() {
    this.editor.use(this.engine);
    this.editor.use(this.dataFlow);

    await this.setupEnv();
    const children: Record<string, SnapshotFrom<AnyStateMachine>> = {};
    this.content.contexts.forEach((n: any) => {
      children[n.id] = n.state;
    });

    const snapshot = {
      value: "idle",
      status: "active",
      children,
      context: {
        actors: {},
      },
      error: undefined,
      output: undefined,
    } as any;

    function withPersistance(actorLogic: any) {
      const enhancedLogic = {
        ...actorLogic,
        // transition: (state, event, actorCtx) => {
        //   if (event.type.startsWith("xstate.snapshot")) {
        //     self.stateEvents.next({
        //       executionId: self.executionId,
        //       nodeExecutionId: undefined,
        //       state: event.snapshot,
        //       readonly: false,
        //     });
        //   }
        //   return actorLogic.transition(state, event, actorCtx);
        // },
      };

      return enhancedLogic;
    }

    this.actor = createActor(withLogging(withPersistance(this.machine)), {
      // inspect,
      snapshot: cloneDeep(snapshot),
    });

    console.log("IN SETUP 3", this.content, snapshot, this.actor);
    // return;

    this.actor.subscribe({
      next: (state) => {
        console.log("EDITOR STATE", state);
        this.stateEvents.next({
          executionId: this.executionId,
          nodeExecutionId: undefined,
          state:
            this.actor?.getPersistedSnapshot() as SnapshotFrom<AnyStateMachine>,
          readonly: false,
        });
      },
      error: (error) => {
        console.error("EDITOR ERROR", error);
      },
      complete: () => {
        console.log("EDITOR COMPLETE");
      },
    });
    this.setupEventHandling();
    await this.import(this.content);

    this.actor.start();
    for (const [key, value] of Object.entries(children)) {
      const actor = this.actor.system.get(key);
      actor.send({
        type: "UPDATE_CHILD_ACTORS",
      });
    }

    this.handleNodeEvents();

    await this.setUI();
  }

  setupEventHandling() {
    this.stateEvents
      .pipe(
        // Group by executionNodeId
        tap((event) => console.log("$@$@", event)),
        map((event) => Object.values(event.state.children)),

        switchMap((children) =>
          from(children).pipe(
            groupBy((child: SnapshotFrom<AnyActor>) => child.systemId),
            mergeMap((group) =>
              group.pipe(
                debounceTime(1000), // Adjust time as needed
                map(async (child) => {
                  console.log("CHILD", child.systemId, child.src, child);
                  return await this.api.trpc.craft.node.setContext.mutate({
                    contextId: child.systemId,
                    workflowId: this.workflowId,
                    workflowVersionId: this.workflowVersionId,
                    projectId: this.projectId,
                    context: JSON.stringify(child),
                  });
                }),
              ),
            ),
          ),
        ),
        // groupBy((event) => event.),
        // // Handle each group separately
        // mergeMap((group) =>
        //   group.pipe(
        //     debounceTime(1000), // Adjust time as needed
        //     // You can add more operators here as needed
        //     map((event) => Object.entries(event.state.children)), // Map each entry of the children object
        //   ),
        // ),
        // tap((event) => console.log("$@$@", event)),
        mergeMap(async (event) => {
          console.log("EVENT", event);
          // this.api.trpc.craft.node.setContext.mutate({
          //   versionId: this.workflowVersionId,
          //   context: JSON.stringify(event.state),
          // });
          // })
          // await this.api.setContext({
          //   contextId: this.contextId,
          //   context: JSON.stringify(event.state),
          // });

          // await match(event)
          //   .with(
          //     {
          //       nodeExecutionId: P.string,
          //       executionId: P.nullish,
          //     },
          //     async (event) => {
          //       let executionId = this.executionId;
          //       if (!executionId) {
          //         console.log("#".repeat(40), "CREATING EXECUTION");
          //         executionId = await this.di.createExecution(this.id);
          //       }
          //       const saved = await this.di.api.setState({
          //         id: event.nodeExecutionId,
          //         contextId: this.contextId,
          //         projectId: this.projectId,
          //         state: JSON.stringify(event.state),
          //         type: this.ID,
          //         workflowExecutionId: executionId,
          //         workflowId: this.workflowId,
          //         workflowNodeId: this.id,
          //         workflowVersionId: this.workflowVersionId,
          //       });
          //       console.log({ saved });
          //     },
          //   )
          //   .with(
          //     {
          //       nodeExecutionId: P.nullish,
          //       executionId: P.string,
          //     },
          //     async (event) => {
          //       const nodeExecutionId = this.di.createId("state");
          //       this.setExecutionNodeId(nodeExecutionId);
          //       const saved = await this.di.api.setState({
          //         id: nodeExecutionId,
          //         contextId: this.contextId,
          //         projectId: this.projectId,
          //         state: JSON.stringify(event.state),
          //         type: this.ID,
          //         workflowExecutionId: event.executionId,
          //         workflowId: this.workflowId,
          //         workflowNodeId: this.id,
          //         workflowVersionId: this.workflowVersionId,
          //       });
          //       console.log({ saved });
          //     },
          //   )
          //   .with(
          //     {
          //       nodeExecutionId: P.string,
          //       executionId: P.string,
          //     },
          //     async (event) => {
          //       const saved = await this.di.api.setState({
          //         id: event.nodeExecutionId,
          //         contextId: this.contextId,
          //         projectId: this.projectId,
          //         state: JSON.stringify(event.state),
          //         type: this.ID,
          //         workflowExecutionId: event.executionId,
          //         workflowId: this.workflowId,
          //         workflowNodeId: this.id,
          //         workflowVersionId: this.workflowVersionId,
          //       });
          //       console.log({ saved });
          //     },
          //   )
          //   .with(
          //     {
          //       executionId: P.nullish,
          //       nodeExecutionId: P.nullish,
          //       readonly: false,
          //     },
          //     async (event) => {
          //       await this.di.api.setContext({
          //         contextId: this.contextId,
          //         context: JSON.stringify(event.state),
          //       });
          //     },
          //   )
          //   .run();
        }),
        catchError((error) => {
          // Handle or log the error
          return of(error); // or use a more suitable error handling strategy
        }),
      )
      .subscribe({
        next: async (event) => {
          console.log("RXJS EVENT", event);
        },
        error: (error) => {
          console.log("RXJS ERROR", error);
        },
      });
  }

  public async mount(params: {
    container: HTMLElement;
    render: ReactPlugin<Scheme, AreaExtra<Scheme>>;
  }) {
    const { AreaExtensions, AreaPlugin, Zoom } = await import(
      "rete-area-plugin"
    );
    const render = params.render;
    this.render = render;
    this.area = new AreaPlugin(params.container);
    this.selector = AreaExtensions.selector();
    function accumulateOnCtrl() {
      let pressed = false;

      function keydown(e: KeyboardEvent) {
        if (e.key === "Shift") pressed = true;
      }
      function keyup(e: KeyboardEvent) {
        if (e.key === "Shift") pressed = false;
      }

      document.addEventListener("keydown", keydown);
      document.addEventListener("keyup", keyup);

      return {
        active() {
          return pressed;
        },
        destroy() {
          document.removeEventListener("keydown", keydown);
          document.removeEventListener("keyup", keyup);
        },
      };
    }
    this.nodeSelector = AreaExtensions.selectableNodes(
      this?.area,
      this?.selector,
      {
        accumulating: accumulateOnCtrl(),
      },
    );
    AreaExtensions.restrictor(this.area, {
      scaling: () => ({ min: 0.2, max: 1 }),
    });
    this.area.area.setZoomHandler(new Zoom(0.03));
    AreaExtensions.snapGrid(this.area, {
      dynamic: false,
      size: 20,
    });
    AreaExtensions.simpleNodesOrder(this.area);
    AreaExtensions.showInputControl(this.area);

    const { ConnectionPathPlugin } = await import(
      "rete-connection-path-plugin"
    );
    const { curveMonotoneX } = await import("d3-shape");
    const pathPlugin = new ConnectionPathPlugin<Scheme, Area2D<Scheme>>({
      // curve: (c) => c.curve || curveMonotoneX,
      // curve: (c) => c.curve,
    });

    // @ts-ignore
    render.use(pathPlugin);

    const {
      ConnectionPlugin,
      Presets: ConnectionPresets,
      ClassicFlow,
      getSourceTarget,
    } = await import("rete-connection-plugin");
    const self = this;
    const connection = new ConnectionPlugin<Scheme, AreaExtra<Scheme>>();
    // connection.addPreset(ConnectionPresets.classic.setup());
    connection.addPreset(
      () =>
        new ClassicFlow({
          makeConnection(from, to, context) {
            const [source, target] = getSourceTarget(from, to) || [null, null];
            const { editor } = context;
            if (source && target) {
              editor.addConnection(
                new Connection(
                  editor.getNode(source.nodeId),
                  source.key as never,
                  editor.getNode(target.nodeId),
                  target.key as never,
                  self,
                ) as any,
              );
              return true; // ensure that the connection has been successfully added
            }
          },
        }),
    );

    this.editor.use(this.area);
    this.area.use(connection);
    this.area.use(render);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useMagneticConnection(connection, {
      async createConnection(from, to) {
        if (from.side === to.side) return;
        const [source, target] =
          from.side === "output" ? [from, to] : [to, from];
        const sourceNode = self.editor.getNode(source.nodeId);
        const targetNode = self.editor.getNode(target.nodeId);

        console.log("MAGNETIC createConnection", {
          source,
          target,
          sourceNode,
          targetNode,
        });
        await self.editor.addConnection(
          new Connection(
            sourceNode,
            source.key as never,
            targetNode,
            target.key as never,
            self,
          ) as any,
        );
      },
      display(from, to) {
        return from.side !== to.side;
      },
      offset(socket, position) {
        const socketRadius = 10;
        return {
          x:
            position.x +
            (socket.side === "input" ? -socketRadius : socketRadius),
          y: position.y,
        };
      },
    });

    this.areaControl = {
      async zoomAtNodes(nodeIds) {
        if (!self.area) return;
        await AreaExtensions.zoomAt(
          self.area,
          self.editor
            .getNodes()
            .filter((n) =>
              nodeIds.length > 0 ? nodeIds.includes(n.id) : true,
            ),
        );
      },
    };

    const { setupPanningBoundary } = await import("./plugins/panningBoundary");
    this.panningBoundary = setupPanningBoundary({
      area: this.area,
      selector: this.selector,
      padding: 30,
      intensity: 3,
    });

    const { CustomArrange, ArrangePresets } = await import(
      "./plugins/arrage/custom-arrange"
    );
    this.arrange = new CustomArrange<Scheme>();
    this.arrange.addPreset(
      ArrangePresets.classic.setup({
        spacing: 40,
        top: 100,
        bottom: 100,
      }),
    );
    this.area.use(this.arrange);

    // const { ScopesPlugin, Presets: ScopesPresets } = await import(
    //   "rete-scopes-plugin"
    // );
    // const scopes = new ScopesPlugin<Scheme>();
    // scopes.addPreset(ScopesPresets.classic.setup());
    // this.area.use(scopes);
    // scopes.addPipe((context) => {
    //   if (context.type === "scopepicked") {
    //     console.log("Scope picked", context.data);
    //   }
    //   if (context.type === "scopereleased") {
    //     console.log("Scope released", context.data);
    //   }
    //   return context;
    // });

    const {
      HistoryPlugin,
      HistoryExtensions,
      Presets: HistoryPresets,
    } = await import("rete-history-plugin");
    const history = new HistoryPlugin<Scheme, HistoryActions<Scheme>>();
    history.addPreset(HistoryPresets.classic.setup());
    HistoryExtensions.keyboard(history);

    this.area.use(history);

    this.handleAreaEvents();
  }

  public async layout() {
    await this.arrange?.layout({
      options: {
        "elk.spacing.nodeNode": 100,
        "spacing.nodeNodeBetweenLayers": 100,
      } as any,
    });
  }

  public async setUI() {
    await this.layout();
    await this.areaControl?.zoomAtNodes(
      this.editor.getNodes().map((n) => n.id),
    );
  }

  public destroy() {
    this.area?.destroy();
    this.panningBoundary?.destroy();
  }

  public async import({
    nodes,
    edges,
  }: {
    nodes: NodeWithState<Registry>[];
    edges: SetOptional<ConnProps, "id">[];
  }) {
    for (const n of nodes) {
      if (this.editor.getNode(n.id)) continue;
      const node = await this.createNodeInstance(n);
      console.log({ node });
      await this.editor.addNode(node);
    }

    for (const c of edges) {
      const source = this.editor.getNode(c.source);
      const target = this.editor.getNode(c.target);

      if (
        source &&
        target &&
        source.outputs[c.sourceOutput] &&
        target.inputs[c.targetInput]
      ) {
        const conn = new Connection<NodeProps, NodeProps>(
          source,
          c.sourceOutput,
          target,
          c.targetInput,
          this,
        );
        conn.sync();

        await this.editor.addConnection(conn as Scheme["Connection"]);
      }
    }
  }

  public validateNodes({
    nodes,
    edges,
  }: {
    nodes: NodeWithState<Registry>[];
    edges: SetOptional<ConnProps, "id">[];
  }) {
    return;
    const nodesMap = new Map<NodeId, NodeProps>();
    for (const n of nodes) {
      if (!this.nodeMeta.has(n.type)) {
        throw new Error(`Node type ${String(n.type)} not registered`);
      }
      nodesMap.set(n.id, this.createNodeInstance(n));
    }
    for (const c of edges) {
      const source = nodesMap.get(c.source);
      if (!source)
        throw new Error(
          `Invalid connection:
          (${c.source})[${String(c.sourceOutput)}]  => (${c.target})[${String(
            c.targetInput,
          )}]
          Source with id:${c.source} not found`,
        );
      const target = nodesMap.get(c.target);
      if (!target) {
        throw new Error(
          `Invalid connection:
          (${c.source})[${String(c.sourceOutput)}]  => (${c.target})[${String(
            c.targetInput,
          )}]
          Target with id:${c.target} not found`,
        );
      }
      if (!source.outputs[c.sourceOutput]) {
        throw new Error(
          `Invalid connection:
           (${c.source})[${String(c.sourceOutput)}]  => (${c.target})[${String(
             c.targetInput,
           )}]
          Source Output [${String(c.sourceOutput)}] not found`,
        );
      }
      if (!target.inputs[c.targetInput]) {
        throw new Error(
          `Invalid connection:
          (${c.source})[${String(c.sourceOutput)}]  => (${c.target})[${String(
            c.targetInput,
          )}]
          Target Input [${String(c.targetInput)}] not found`,
        );
      }

      if (
        source &&
        target &&
        source.outputs[c.sourceOutput] &&
        target.inputs[c.targetInput]
      ) {
        // everything is ok
      } else {
        throw new Error(`Invalid connection ${JSON.stringify(c)}`);
      }
    }
  }

  public getConnectionSockets(connection: ConnProps) {
    const source = this.editor.getNode(connection.source);
    const target = this.editor.getNode(connection.target);

    const output =
      source &&
      (source.outputs as Record<string, Input<AnyActor, Socket>>)[
        connection.sourceOutput
      ];
    const input =
      target &&
      (target.inputs as Record<string, Output<AnyActor, Socket>>)[
        connection.targetInput
      ];
    if (!output || !input) {
      throw new Error(`Invalid connection ${JSON.stringify(connection)}`);
    }

    return {
      source: output.socket,
      target: input.socket,
    };
  }

  private handleNodeEvents() {
    const queue = new PQueue({ concurrency: 4 });

    this.editor.addPipe((context) => {
      return match(context)
        .with({ type: "connectioncreate" }, async ({ data }) => {
          console.log("CONNECTIONCREATE", { data });
          const { source, target } = this.getConnectionSockets(data);
          if (target && !target.isCompatibleWith(source.name)) {
            this.handlers.incompatibleConnection?.({
              source,
              target,
            });
            await data.destroy();
            return undefined;
          }
          return context;
        })
        .with({ type: "nodecreated" }, async ({ data }) => {
          console.log("nodecreated", { data });
          const size = data.size;
          await queue.add(() =>
            this.api.trpc.craft.node.upsert.mutate({
              workflowId: this.workflowId,
              workflowVersionId: this.workflowVersionId,
              projectId: this.projectId,
              data: {
                id: data.id,
                type: data.ID,
                color: "default",
                label: data.label,
                contextId: data.contextId,
                // context: JSON.stringify(data.actor.getSnapshot().context),
                position: { x: 0, y: 0 }, // When node is created it's position is 0,0 and it's moved later on.
                ...size,
              },
            }),
          );
          return context;
        })
        .with({ type: "noderemove" }, async ({ data }) => {
          console.log("noderemove", { data });
          if (data.id === this.selectedNodeId) {
            this.setSelectedNodeId(null);
          }
          this.actor?.send({
            type: "DESTROY",
            params: {
              id: data.contextId,
            },
          });
          await queue.add(() =>
            this.api.trpc.craft.node.delete.mutate({
              workflowId: this.workflowId,
              workflowVersionId: this.workflowVersionId,
              data: {
                id: data.id,
              },
            }),
          );
          return context;
        })
        .with({ type: "connectioncreated" }, async ({ data }) => {
          console.log("connectioncreated", { data });
          await queue.add(() =>
            this.api.trpc.craft.edge.create.mutate({
              workflowId: this.workflowId,
              workflowVersionId: this.workflowVersionId,
              data: JSON.parse(JSON.stringify(data.toJSON())),
            }),
          );
          if (this.selectedNodeId && data.target === this.selectedNodeId) {
            this.setSelectedNodeId(null);
            this.setSelectedNodeId(data.target);
          }
          if (this.selectedNodeId && data.source === this.selectedNodeId) {
            this.setSelectedNodeId(null);
            this.setSelectedNodeId(data.source);
          }
          return context;
        })
        .with({ type: "connectionremoved" }, async ({ data }) => {
          console.log("connectionremoved", { data });
          await data.destroy();
          await queue.add(() =>
            this.api.trpc.craft.edge.delete.mutate({
              workflowId: this.workflowId,
              workflowVersionId: this.workflowVersionId,
              data: JSON.parse(JSON.stringify(data.toJSON())),
            }),
          );
          if (this.selectedNodeId && data.target === this.selectedNodeId) {
            this.setSelectedNodeId(null);
            this.setSelectedNodeId(data.target);
          }
          if (this.selectedNodeId && data.source === this.selectedNodeId) {
            this.setSelectedNodeId(null);
            this.setSelectedNodeId(data.source);
          }
          return context;
        })
        .otherwise(() => context);
    });
  }

  setCursorPosition(position: Position) {
    this.cursorPosition = position;
  }

  setSelectedNodeId(nodeId: NodeId | null) {
    this.selectedNodeId = nodeId;
  }

  setExecutionId(executionId: string | undefined) {
    this.executionId = executionId;
  }

  get selectedNode() {
    if (!this.selectedNodeId) return null;
    return this.editor.getNode(this.selectedNodeId);
  }

  public async createExecution(entryNodeId?: string) {
    if (!this.executionId) {
      const input = entryNodeId || this.rootNodes[0]?.id;
      const { id } = await this.api.trpc.craft.execution.create.mutate({
        workflowId: this.workflowId,
        workflowVersionId: this.workflowVersionId,
        input: {
          id: input,
          values: {},
        },
        headless: false,
      });
      this.setExecutionId(id);
      return id;
    }
    return this.executionId;
  }

  public async runSync(params: { inputId: string; event?: string }) {
    console.log("runSync", params);
    await this.createExecution(params.inputId);
    this.engine.execute(params.inputId, params.event, this.executionId);
  }

  public async run(params: { inputId: string; inputs: Record<string, any> }) {
    const inputNode = this.editor.getNode(params.inputId);
    if (!inputNode) {
      throw new Error(`Input node with id ${params.inputId} not found`);
    }
    const ajv = new Ajv();
    const validator = ajv.compile(inputNode.inputSchema);

    const valid = validator(params.inputs);
    if (!valid) {
      throw new Error(
        `Input data is not valid: ${JSON.stringify(validator.errors)}`,
      );
    }
    await this.createExecution(params.inputId);

    inputNode.actor.send({
      type: "SET_VALUE",
      params: {
        values: params.inputs,
      },
    });

    this.engine.execute(inputNode.id, undefined, this.executionId);

    const res = await new Promise((resolve, reject) => {
      this.engine.addPipe((context) => {
        console.log("@@@ Engine context", context);
        if (context.type === "execution-completed") {
          resolve(context.data.output);
        }
        if (context.type === "execution-failed") {
          reject(context);
        }
        return context;
      });
    });
    console.log("Execution completed", res);
    return res;
  }

  public reset() {
    this.setExecutionId(undefined);
    this.setSelectedNodeId(null);
    this.editor.getNodes().forEach((n) => {
      n.reset();
    });
  }

  private handleAreaEvents() {
    const updateMeta = debounce(
      this.api.trpc.craft.node.updateMetadata.mutate,
      500,
    );
    const positionUpdate = debounce((position: Position) => {
      this.setCursorPosition(position);
    }, 10);
    this.area?.addPipe((context) => {
      match(context)
        .with({ type: "pointermove" }, ({ data: { position } }) => {
          positionUpdate(position);
        })
        .with({ type: "nodepicked" }, ({ data }) => {
          requestAnimationFrame(() => {
            this.setSelectedNodeId(data.id);
          });
        })
        .with({ type: "pointerdown" }, ({ data }) => {
          if (
            (data?.event.target as HTMLElement).classList.contains(
              "background",
            ) &&
            this.selectedNodeId
          ) {
            requestAnimationFrame(() => {
              this.setSelectedNodeId(null);
            });
            return context;
          }
        })
        .with({ type: "noderesized" }, ({ data }) => {
          const size = {
            width: Math.round(data.size.width),
            height: Math.round(data.size.height),
          };
          const node = this.editor.getNode(data.id);
          if (node.size !== size) {
            node.setSize(size);
            updateMeta({ id: data.id, size });
          }
        })
        .with({ type: "nodetranslated" }, ({ data }) => {
          if (
            data.position.x !== data.previous.y ||
            data.position.y !== data.previous.y
          ) {
            updateMeta(data);
          }
        })
        .otherwise(() => {
          // console.log(context.type, { context });
        });
      return context;
    });
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
