import { init } from "@paralleldrive/cuid2";
import Ajv from "ajv";
import {
  cloneDeep,
  difference,
  get,
  isEqual,
  isNil,
  isNull,
  merge,
  set,
} from "lodash-es";
import { action, computed, makeObservable, observable } from "mobx";
import PQueue from "p-queue";
import { NodeEditor } from "rete";
import type { GetSchemes, NodeId } from "rete";
import type { Area2D, AreaExtensions, AreaPlugin } from "rete-area-plugin";
import type { HistoryActions } from "rete-history-plugin";
import { structures } from "rete-structures";
import type { Structures } from "rete-structures/_types/types";
import { match } from "ts-pattern";
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
  assertEvent,
  AnyActorRef,
  ActorRefFrom,
  fromPromise,
} from "xstate";
import { createBrowserInspector } from "@statelyai/inspect";

import { useMagneticConnection } from "./connection";
import { Connection } from "./connection/connection";
import { createControlFlowEngine, createDataFlowEngine } from "./engine";
import type { Input, Output } from "./input-output";
import type {
  BaseMachine,
  BaseNode,
  HasConnectionGuardParams,
  ParsedNode,
} from "./nodes/base";
import type { CustomArrange } from "./plugins/arrage/custom-arrange";
import type { setupPanningBoundary } from "./plugins/panningBoundary";
import type {
  Registry as DOMRegistry,
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
  BehaviorSubject,
  Subject,
  bufferTime,
  catchError,
  concatMap,
  debounceTime,
  filter,
  of,
  groupBy,
  mergeMap,
  scan,
} from "rxjs";
import { socketWatcher } from "./socket-watcher";
import { RouterInputs } from "@seocraft/api";
import { inputSocketMachine } from "./input-socket";
import { outputSocketMachine } from "./output-socket";
import { valueActorMachine } from "./value-actor";

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

export const EditorMachine = setup({
  types: {
    context: {} as {
      inputSockets: Record<string, JSONSocket>;
      outputSockets: Record<string, JSONSocket>;
      inputs: Record<string, any>;
      outputs: Record<string, any>;

      actors: Record<string, AnyActorRef>;
    },
    input: {} as {
      inputSockets: Record<string, JSONSocket>;
      outputSockets: Record<string, JSONSocket>;
      inputs: Record<string, any>;
      outputs: Record<string, any>;

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
        }
      | {
          type: "SET_INPUT_OUTPUT";
          params: {
            id: string;
            inputs: JSONSocket[];
            outputs: JSONSocket[];
          };
        },
    actions: {} as {
      type: "setInputOutput";
      params: {
        id: string;
        inputs: JSONSocket[];
        outputs: JSONSocket[];
      };
    },
  },
  actions: {
    setInputOutput: enqueueActions(
      ({ enqueue, event, check, context, system, self }) => {
        assertEvent(event, "SET_INPUT_OUTPUT");
        console.log("SET_INPUT_OUTPUT", event);
        const actor = system.get(event.params.id);

        const inputKeys = event.params.inputs.map((input) => {
          const key = `${event.params.id}-${input["x-key"]}`;
          const socket = {
            ...input,
            "x-actor-ref-id": event.params.id,
            "x-actor-type": actor.src,
            "x-actor-ref-type": actor.src,
          };
          if (check(({ context }) => !context.inputSockets[key])) {
            enqueue.assign({
              inputSockets: ({ context }) => {
                return {
                  ...context.inputSockets,
                  [key]: socket,
                };
              },
            });
          } else if (
            check(({ context }) => !isEqual(context.inputSockets[key], socket))
          ) {
            enqueue.assign({
              inputSockets: ({ context }) => {
                return {
                  ...context.inputSockets,
                  [key]: socket,
                };
              },
            });
          }

          return key;
        });

        /**
         * DROP INPUT SOCKETS NO LONGER EXISTS.
         */
        if (
          check(
            ({ context }) =>
              difference(
                Object.keys(context.inputSockets).filter((k) =>
                  k.startsWith(event.params.id),
                ),
                inputKeys,
              ).length > 0,
          )
        ) {
          enqueue.assign({
            inputSockets: ({ context, event }) => {
              const sockets = { ...context.inputSockets };
              for (const key of difference(
                Object.keys(context.inputSockets).filter((k) =>
                  k.startsWith(event.params.id),
                ),
                inputKeys,
              )) {
                delete sockets[key];
              }
              return sockets;
            },
          });
        }
        const outputKeys = event.params.outputs.map((output) => {
          const key = `${event.params.id}-${output["x-key"]}`;
          const socket = {
            ...output,
            "x-actor-ref-id": event.params.id,
            "x-actor-type": actor.src,
            "x-actor-ref-type": actor.src,
            // "x-connection": {
            //   [event.params.id]: {
            //     key: context.inputs[output["x-key"]],
            //   },
            // },
          };
          if (check(({ context }) => !context.outputSockets[key])) {
            enqueue.assign({
              outputSockets: ({ context }) => {
                return {
                  ...context.outputSockets,
                  [key]: socket,
                };
              },
            });
          } else if (
            check(({ context }) => !isEqual(context.outputSockets[key], socket))
          ) {
            enqueue.assign({
              outputSockets: ({ context }) => {
                return {
                  ...context.outputSockets,
                  [key]: socket,
                };
              },
            });
          }
          // enqueue.sendTo(actor, ({ self }) => ({
          //   type: "UPDATE_SOCKET",
          //   params: {
          //     side: "output",
          //     name: output["x-key"],
          //     socket: {
          //       "x-connection": {
          //         ...socket["x-connection"],
          //         [self.id]: {
          //           key: key,
          //         },
          //       } as ConnectionConfigRecord,
          //     },
          //   },
          // }));

          return key;
        });

        /**
         * DROP OUTPUT SOCKETS NO LONGER EXISTS.
         */
        if (
          check(
            ({ context }) =>
              difference(
                Object.keys(context.outputSockets).filter((k) =>
                  k.startsWith(event.params.id),
                ),
                outputKeys,
              ).length > 0,
          )
        ) {
          enqueue.assign({
            outputSockets: ({ context, event }) => {
              const sockets = { ...context.outputSockets };
              for (const key of difference(
                Object.keys(context.outputSockets).filter((k) =>
                  k.startsWith(event.params.id),
                ),
                outputKeys,
              )) {
                delete sockets[key];
              }
              return sockets;
            },
          });
        }
      },
    ),
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QFEIEsAuB7ATgOjQgBswBiAEWQGUAVAJQHkBNAbQAYBdRUABy1kxosAO24gAHogDMAJgCMeKQE4A7AA4ZbJVJUqZUgDQgAntI2K5UtXIBsAViUAWHTLt2Avu6OpMuAsTIqAAUAQQB1ADl2LiQQPgEMIVFYyQQAWjktCztMqTYZG1dHG0MTREsZPHtnORU7Rzs2OUcWzy8QYSwIODEfbBwxeMERMVSMuxVs3PzC+pKjUwQFNialGzla-WKlGUdPb3R+-xJB-mHk0FS5NUm1KXurNQdZGRkFxEc2KSqlO1lHPROZwFNruIA */
  id: "Editor",
  description:
    "Editor machine responsible of spawning and destroying node actors.",
  context: ({ input }) => {
    return merge(
      {
        inputSockets: {},
        outputSockets: {},
        inputs: {},
        outputs: {},
        actors: [],
      },
      input,
    );
  },
  initial: "idle",
  entry: enqueueActions(({ enqueue, event }) => {
    enqueue("initialize");
  }),
  on: {
    SET_INPUT_OUTPUT: {
      actions: ["setInputOutput"],
    },
    UPDATE_SOCKET: {
      actions: ["updateSocket"],
    },
    INITIALIZE: {
      actions: ["initialize"],
    },
    SET_VALUE: {
      actions: ["setValue"],
    },
  },
  states: {
    error: {},
    idle: {
      on: {
        DESTROY: {
          description: "Destroy a node actor",
          actions: enqueueActions(({ enqueue, system, event }) => {
            const actor: AnyActor = system.get(event.params.id);
            if (!actor) {
              console.log("CAN NOT FIND THE ACTOR", event.params.id);
              return;
              // throw new Error(`Actor with id ${event.params.id} not found`);
            }

            // If actor has child actors, destroy them as well.
            const childs =
              (actor.getSnapshot().context.childs as Record<
                string,
                AnyActorRef
              >) || {};
            Object.entries(childs).forEach(([key, childActor]) => {
              enqueue.raise({
                type: "DESTROY",
                params: {
                  id: childActor.id,
                },
              });
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
          actions: enqueueActions(({ enqueue, event }) => {
            console.log("SPANWING", event);
            enqueue.assign({
              actors: ({ spawn, context, system }) => {
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
          }),
        },
      },
    },
  },
});

function withLogging(actorLogic: any) {
  const enhancedLogic = {
    ...actorLogic,
    transition: (state, event, actorCtx) => {
      // console.log("🕷️ State:", state, "Event:", event);

      // Transition state only contains the pre transition state.
      // event getting persisted snapshot will endup with the pre transition state.
      // better persist state in actor subscribe.next listener.

      return actorLogic.transition(state, event, actorCtx);
    },
  };

  return enhancedLogic;
}

export interface EditorMachineContext {
  id: string;
  state: SnapshotFrom<typeof EditorMachine> | null;
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
    context: EditorMachineContext;
    nodes: ConvertToNodeWithState<Registry, ParsedNode<any, any>>[];
    edges: SetOptional<ConnProps, "id">[];
    contexts: SnapshotFrom<AnyStateMachine>[];
  };
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
    timestamp: number;
    state: {
      snapshot: SnapshotFrom<AnyStateMachine>;
      syncSnapshot: boolean;
      src: string;
      systemId: string;
    };
    readonly: boolean;
  }>();

  public variables = new Map<string, string>();

  public content = {
    context: {} as EditorMachineContext,
    contexts: [] as SnapshotFrom<AnyStateMachine>[],
    nodes: [] as NodeWithState<Registry>[],
    edges: [] as SetOptional<ConnProps, "id">[],
  };

  public inspector: ReturnType<typeof createBrowserInspector> | undefined;

  public readonly: boolean;
  public render: ReactPlugin<Scheme, AreaExtra<Scheme>> | undefined;
  public domRegistry:
    | DOMRegistry<
        HTMLElement,
        {
          element: HTMLElement;
          component: any;
        }
      >
    | undefined;
  public registry: NodeRegistry = {} as NodeRegistry;
  public machines: MachineRegistry = {} as MachineRegistry;

  get rootNodes() {
    return this.graph.roots().nodes();
  }

  get leaves() {
    return this.graph.leaves().nodes();
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
    assignParent: enqueueActions(({ enqueue, check, self, system }) => {
      if (check(({ context }) => !isNil(context.parent))) {
        if (self.id.startsWith("call")) {
          enqueue.sendTo(
            ({ context, system }) => system.get(context.parent?.id!),
            ({ self }) => ({
              type: "ASSIGN_RUN",
              params: {
                actor: self,
              },
            }),
          );
        } else if (
          // skip the root actor
          check(({ context }) => context.parent?.id !== system.get("editor").id)
        ) {
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
      }
    }),

    assignChild: enqueueActions(({ enqueue, event, context, check }) => {
      assertEvent(event, "ASSIGN_CHILD");
      console.log("ASSIGN CHILD", event);
      enqueue.sendTo(
        ({ system }) =>
          system.get(event.params.port) as ActorRefFrom<
            typeof inputSocketMachine
          >,
        ({ self }) => ({
          type: "SET_VALUE",
          params: {
            value: event.params.actor,
          },
        }),
      );

      enqueue.assign({
        childs: ({ context, event }) => ({
          ...context.childs,
          [event.params.actor.src]: event.params.actor,
        }),
      });

      // const childSnap = event.params.actor.getSnapshot();
      // enqueue.assign({
      //   inputSockets: ({ context, system, event }) => ({
      //     ...context.inputSockets,
      //     ...childSnap.context.inputSockets,
      //   }),
      // });

      return;
      enqueue.assign({
        inputSockets: ({ context, system, event }) => {
          assertEvent(event, "ASSIGN_CHILD");
          console.log("ASSIGN CHILD", event);
          const port = event.params.port;
          const socket = context.inputSockets[port];
          const actorType = event.params.actor.src as string;
          const isChildActorSelected =
            context.inputSockets[port]["x-actor-ref-id"] ===
              event.params.actor.id ||
            isNil(context.inputSockets[port]["x-actor-ref-id"]);

          const childSnap = event.params.actor.getSnapshot();
          const childSockets = Object.entries(childSnap.context.inputSockets)
            .map(([key, value]) => {
              return {
                [`${event.params.actor.id}-${key}`]: {
                  "x-actor-ref": event.params.actor,
                  "x-actor-ref-id": event.params.actor.id,
                  "x-actor-ref-type": actorType,
                  "x-actor-type": actorType,
                  ...value,
                },
              };
            })
            .reduce((acc, value) => {
              return { ...acc, ...value };
            });

          return {
            ...context.inputSockets,
            // [port]: {
            //   ...socket,
            //   ...(isChildActorSelected && {
            //     "x-actor-type": actorType,
            //     "x-actor-ref": event.params.actor,
            //     "x-actor-ref-id": event.params.actor.id,
            //     "x-actor-ref-type": actorType,
            //   }),
            //   "x-actor-config": {
            //     ...socket["x-actor-config"],
            //     [actorType]: {
            //       ...socket["x-actor-config"][actorType],
            //       actor: event.params.actor,
            //       actorId: event.params.actor.id,
            //     },
            //   },
            // } as Partial<JSONSocket>,
            ...childSockets,
          } as Record<string, JSONSocket>;
        },
      });

      const socket = context.inputSockets[event.params.port] as JSONSocket;
      const conf = get(socket, [
        "x-actor-config",
        event.params.actor.src as string,
      ]);
      if (!conf) {
        console.error("Missing config for", {
          socket,
          src: event.params.actor.src,
          context,
          event,
        });
        return;
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
                    // actorRef: self,
                  },
                } as ConnectionConfigRecord,
              },
            },
          };
        });
      }
    }),
    spawnRun: enqueueActions(({ enqueue }) => {
      enqueue.assign(({ context }, params) => {
        console.log("LOGOOG", params);
        return {
          ...context,
        };
      });
      // enqueue.sendTo(this.actor?.ref!, ({ context,  }, params) => {
      //   console.log("SPAWN RUN", context, params);
      //   return {
      //     type: "SPAWN",
      //     params: {
      //       parent: self.id,
      //       id: this.createId("context"),
      //       machineId: "run",
      //       systemId: this.createId("context"),
      //       input: {
      //         inputs: {
      //           ...context.inputs,
      //         },
      //         parent: {
      //           id: self.id,
      //           port: "run",
      //         },
      //       },
      //     },
      //   };
      // });
    }),
    initialize: enqueueActions(({ enqueue, check, system, self }) => {
      enqueue("assignParent");
      // enqueue("spawnInputActors");
      // if (check(() => !system.get(`${self.id}-socketWatcher`))) {
      //   enqueue.spawnChild("socketWatcher", {
      //     id: `${self.id}-socketWatcher`,
      //     input: {
      //       self,
      //     },
      //     syncSnapshot: false,
      //   });
      // }
    }),
    spawnInputActors: enqueueActions(({ enqueue, context, system, self }) => {
      for (const [key, value] of Object.entries<
        ActorRefFrom<typeof inputSocketMachine>
      >(context.inputSockets)) {
        if (isNil(value["x-actor-type"])) {
          // skip if no actor type.
          continue;
        }
        console.log("@@@@", "SPAWNING INPUT ACTORS", value["x-actor-type"]);

        if (isNil(value["x-actor-ref"])) {
          // actor not spawned yet.

          if (
            value["x-actor-ref-id"] &&
            value["x-actor-ref-type"] === value["x-actor-type"]
          ) {
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
    }),
    triggerSuccessors: enqueueActions(
      (
        { enqueue },
        params: {
          port: string;
        },
      ) => {
        enqueue.sendTo(
          ({ context, system }) =>
            system.get(
              Object.keys(context.outputSockets).find((k) =>
                k.endsWith(params.port),
              ),
            ),
          {
            type: "TRIGGER",
          },
        );
      },
    ),
    // triggerSuccessors: async (
    //   action: ActionArgs<any, any, any>,
    //   params: {
    //     port: string;
    //   },
    // ) => {
    //   console.log("TRIGGER SUCCESSORS", action, params);

    //   // return;

    //   if (!params?.port) {
    //     throw new Error("Missing params");
    //   }
    //   const port = action.context.outputSockets[params?.port];

    //   const connections = port["x-connection"] || {};

    //   for (const [nodeId, conn] of Object.entries(connections)) {
    //     const targetNode = action.system.get(nodeId);

    //     const socket = targetNode.getSnapshot().context.inputSockets[conn.key];

    //     const values = Object.entries(action.context.outputSockets)
    //       .filter(([key, value]) => {
    //         return value["x-connection"]?.[nodeId];
    //       })
    //       .filter(([key, value]) => {
    //         return key !== params.port;
    //       })
    //       .map(([key, value]) => {
    //         const targetkey = value["x-connection"]?.[nodeId].key;
    //         const sourceValue = action.context.outputs[key];
    //         return {
    //           [targetkey]: sourceValue,
    //         };
    //       })
    //       .reduce((acc, value) => {
    //         return { ...acc, ...value };
    //       }, {});

    //     targetNode.send({
    //       type: socket["x-event"],
    //       params: {
    //         values,
    //       },
    //     });
    //   }
    // },
    updateSocket: assign({
      inputSockets: ({ context, event }) => {
        if (event.params.side === "input") {
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
    setOutput: assign({
      outputs: (
        { context, event },
        params: {
          key: string;
          value: any;
        },
      ) => {
        const p = event.params || params;
        return {
          ...context.outputs,
          [p.key]: p.value,
        };
      },
    }),
    setValue: assign({
      inputs: (
        { context, event, self },
        params: { values: Record<string, any> },
      ) => {
        const values = event.params?.values || params?.values;
        console.log("SET VALUE", { values, self });

        // TODO:
        // Object.keys(context.inputs).forEach((key) => {
        //   if (!context.inputSockets[key]) {
        //     delete context.inputs[key];
        //   }
        // });
        // Object.keys(values).forEach((key) => {
        //   if (!context.inputSockets[key]) {
        //     delete values[key];
        //   }
        // });

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
        if (!value.machines) {
          console.error("Node", key, "missing machines");
          throw new Error(`Node ${key} missing machines`);
        }
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

    const computeActorInputs = setup({
      types: {
        input: {} as {
          value: ContextFrom<AnyActor>;
          targets: string[];
          parent: ActorRefFrom<typeof inputSocketMachine>;
        },
        context: {} as {
          value: ContextFrom<AnyActor>;
          targets: string[];
          parent: ActorRefFrom<typeof inputSocketMachine>;
        },
      },
      actions: {
        setValue: this.baseActions.setValue,
      },
    }).createMachine({
      context: ({ input }) => {
        const inputs = Object.keys(input.value.inputs).reduce((acc, key) => {
          return {
            ...acc,
            [key]: null,
          };
        }, {});
        return {
          ...input,
          inputs,
        };
      },
      initial: "prepare",
      states: {
        prepare: {
          entry: enqueueActions(({ enqueue, context, self }) => {
            console.log("PREPARE", context);
            const inputSockets = Object.values(context.value.inputSockets);
            for (const socket of inputSockets) {
              enqueue.sendTo(socket, {
                type: "COMPUTE",
                params: {
                  targets: [self.id],
                },
              });
            }
          }),
          on: {
            SET_VALUE: {
              actions: enqueueActions(({ enqueue, context, event }) => {
                console.log("SET VALUE ON EXECUTION", event);
                enqueue("setValue");
              }),
            },
          },
          always: [
            {
              guard: ({ context }) => {
                return Object.values(context.inputs).every((t) => !isNull(t));
              },
              target: "done",
              actions: enqueueActions(({ enqueue, context, event }) => {
                console.log("COMPUTE ACTOR INPUTS DONE", context);
                context.targets.forEach((target) => {
                  enqueue.sendTo(
                    ({ system }) => system.get(target),
                    ({ context }) => ({
                      type: "RESULT",
                      params: {
                        inputs: context.inputs,
                      },
                    }),
                  );
                });
              }),
            },
          ],
        },
        done: {
          // type: "final",
          // output: ({ context }) => context.inputs,
        },
      },
    });

    const computeValue = setup({
      types: {
        input: {} as {
          value: any;
          definition: JSONSocket;
          targets: string[];
          parent: ActorRefFrom<typeof inputSocketMachine>;
        },
        context: {} as {
          value: any;
          definition: JSONSocket;
          targets: string[];
          parent: ActorRefFrom<typeof inputSocketMachine>;
        },
      },
    }).createMachine({
      /** @xstate-layout N4IgpgJg5mDOIC5QGMD2BbADgVwC5gDUBDAG2zAGIJUA7MAOllyP3rSz0NPIG0AGALqJQmVLACWucbWEgAHogAsi+gEYAnOoBMqgOxaArAA4AzOoBsJrYoA0IAJ6JVWgL5u7NVBDiz2OfMRkYLKiElIySPJOunaOCKqqfPSKBibOfOqKuuppBopubkA */
      id: "computeValue",
      context: ({ input }) => input,
      invoke: {
        src: fromPromise(async ({ input }) => {
          if (input.definition.format === "secret") {
            return this.variables.get(input.value);
          } else if (input.definition.format === "expression") {
            const { start } = await import("./worker/main");
            const worker = await start();

            // for (const lib of input.libraries) {
            //   await worker.postoffice.installLibrary(lib);
            // }
            const result = await worker.postoffice.sendScript(
              `() => \`${input.value}\``,
              {},
            );
            worker.destroy();
            console.log("RRR", result);
            return result;
          } else {
            return input.value;
          }
        }),
        input: ({ context }) => context,
        onDone: {
          actions: enqueueActions(({ enqueue, event, context }) => {
            enqueue.sendTo(
              ({ context }) => context.parent,
              ({ event, context }) => ({
                type: "RESULT",
                params: {
                  value: event.output,
                  targets: context.targets,
                },
              }),
            );
          }),
        },
      },
    });

    this.machine = EditorMachine.provide({
      actions: {
        ...this.baseActions,
      },
      actors: {
        socketWatcher,
        computeActorInputs,
        input: inputSocketMachine.provide({
          actors: {
            computeValue,
          },
        }),
        output: outputSocketMachine,
        value: valueActorMachine,
        ...Object.keys(this.machines).reduce(
          (acc, k) => {
            if (acc[k]) {
              throw new Error(`Actor ${k} already exists`);
            }
            const machine = this.machines[k];
            if (machine.provide) {
              acc[k] = machine.provide({
                actors: {
                  socketWatcher,
                  computeActorInputs,
                  input: inputSocketMachine.provide({
                    actors: {
                      computeValue,
                    },
                  }),
                  output: outputSocketMachine,
                  value: valueActorMachine,
                },
                delays: {},
                actions: {
                  ...this.baseActions,
                },
                guards: {
                  ...this.baseGuards,
                },
              });
            } else if (typeof machine === "function") {
              const [main, child] = k.split(".");
              acc[main] = acc[main].provide({
                actors: {
                  [child]: machine({ di: this }),
                },
              });
              // acc[k] = machine({ di: this });
            }

            return acc;
          },
          {} as Record<string, AnyStateMachine>,
        ),
      },
    });

    this.machine = this.machine.provide({
      actors: {
        NodeModule: this.machine,
      },
    });

    makeObservable(this, {
      cursorPosition: observable,
      setCursorPosition: action,

      selectedNodeId: observable,
      setSelectedNodeId: action,
      selectedNode: computed,

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
      context: props.content?.context!,
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
    let nodeActor = this.actor?.system.get(node.contextId);
    if (node.type === "NodeModule") {
      // console.log(
      //   "EDITOR ACTOR",
      //   this.actor,
      //   this.actor?.getSnapshot(),
      //   this.actor?.getPersistedSnapshot(),
      // );

      const snap = this.actor?.getPersistedSnapshot();

      this.actor?.stop();
      console.log("NODE CONTEXT", node.context);
      // const mergedChildrens = merge(snap.children, node.context);
      const mergedChildrens = {
        ...snap.children,
        [node.contextId]: {
          snapshot: node.context,
          src: node.type,
          systemId: node.contextId,
          syncSnapshot: true,
        },
      };

      // this.actor = this.createActor({
      //   ...snap,
      //   children: mergedChildrens,
      // });

      // this.actor?.start();

      console.log("EDITOR ACTOR SNAP", this.actor.getPersistedSnapshot());

      this.initializeChildrens(mergedChildrens);

      nodeActor = this.actor?.system.get(node.contextId);

      console.log("NODE ACTOR", nodeActor);
    }
    if (!nodeActor) {
      console.log(
        "ACTOR NOT FOUND | SPAWNING",
        node.id,
        node.contextId,
        node.type,
        node.state,
      );
      this.actor?.send({
        type: "SPAWN",
        params: {
          id: node.contextId,
          machineId: node.type as string,
          input: node.state || node.context,
          systemId: node.contextId, // context
        },
      });
    }

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
    console.log("ADDING NODE", node, context, meta);
    const nodeMeta = this.nodeMeta.get(node);
    if (!nodeMeta) {
      throw new Error(`Node type ${String(node)} not registered`);
    }
    if (nodeMeta.nodeType === "NodeModule") {
      // TODO: this is not been checked.
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

    await newNode.setup();
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
        context: workflow.context,
        edges: workflow.edges,
        nodes: workflow.nodes,
        contexts: workflow.contexts,
      },
    });
    await di.setup();

    console.log("Editor created", di);
    return di;
  }

  public async setupEnv() {
    const creds = await this.api.trpc.credentials.list.query({
      // projectId: this.projectId,
    });
    console.log("CREDS", creds);
    // const openai = await this.api.getAPIKey({
    //   key: "OPENAI_API_KEY",
    //   projectId: this.projectId,
    // });
    creds.forEach((c) => {
      this.variables.set(c.key, c.value);
    });
    // this.variables.set("OPENAI_API_KEY", openai);
  }

  private createInitialSnapshot() {
    if (this.content.context?.state) {
      return this.content.context.state;
    }
    // const children: Record<string, SnapshotFrom<AnyStateMachine>> = {};
    // this.content.contexts
    //   .filter((c) => {
    //     return c.id !== this.content.context.id;
    //   })
    //   .forEach((n: any) => {
    //     children[n.id] = {
    //       snapshot: n.state,
    //       src: n.type,
    //       systemId: n.id,
    //       syncSnapshot: true,
    //     };
    //   });
    let snapshot = {
      value: "idle",
      status: "active",
      children: {},
      context: {
        inputSockets: {},
        outputSockets: {},
        inputs: {},
        outputs: {},
        actors: {},
      },
      error: undefined,
      output: undefined,
    } as any;
    // if (this.content.context?.state) {
    //   snapshot = {
    //     ...snapshot,
    //   };
    // }

    // snapshot.children = children;
    console.log("INITIAL SNAPSHOT", snapshot);
    return snapshot;
  }

  private createActor(snapshot: SnapshotFrom<typeof EditorMachine>) {
    return createActor(withLogging(this.machine), {
      id: this.content.context?.id,
      systemId: "editor", // ROOT ACTOR.
      inspect: (inspectionEvent) => {
        if (this.inspector) {
          this.inspector?.inspect?.next(inspectionEvent);
        }
        if (inspectionEvent.type === "@xstate.snapshot") {
          // skip editor snapshots
          if (inspectionEvent.actorRef === this.actor) {
            const editorSnapshot = {
              src: "NodeModule",
              syncSnapshot: true,
              snapshot: inspectionEvent.actorRef.getPersistedSnapshot(),
              systemId: inspectionEvent.actorRef.id,
            } as unknown as SnapshotFrom<typeof EditorMachine>;

            this.stateEvents.next({
              executionId: this.executionId,
              state: editorSnapshot,
              readonly: false,
              timestamp: +new Date(),
            });

            return;
          }

          if (inspectionEvent.event.type.startsWith("xstate.done.actor")) {
            const actor = inspectionEvent.actorRef;
            console.log("DONE ACTOR", actor.src);
            if (actor.src !== "computeValue") {
              const snapshot = {
                src: actor?.src,
                syncSnapshot: true,
                snapshot: actor.getPersistedSnapshot(),
                systemId: actor.id,
              } as SnapshotFrom<AnyActor>;

              this.stateEvents.next({
                executionId: this.executionId,
                state: snapshot,
                readonly: false,
                timestamp: +new Date(),
              });
            }
          }
        }
        if (inspectionEvent.type === "@xstate.event") {
          const event = inspectionEvent.event;

          // Only listen for events sent to the root actor
          if (inspectionEvent.actorRef !== this.actor) {
            // console.log("EVENT did not SENT FOR", inspectionEvent);
            return;
          }

          if (event.type.startsWith("xstate.snapshot")) {
            const contextId = event.type.split("xstate.snapshot.")[1];
            const actor = this.actor.system.get(contextId);

            let actorSnapshot =
              inspectionEvent.sourceRef?.getPersistedSnapshot();

            /**
             * Here we are making sure the everything within the module has a parent.
             */
            const parentId = get(
              actorSnapshot,
              "context.parent.id",
              this.actor.id,
            );

            actorSnapshot = set(
              actorSnapshot,
              "context.parent.id",
              parentId,
            ) as any;

            const snapshot = {
              src: actor?.src,
              syncSnapshot: actor._syncSnapshot,
              snapshot: actorSnapshot,
              systemId: contextId,
            } as SnapshotFrom<AnyActor>;

            this.stateEvents.next({
              executionId: this.executionId,
              state: snapshot,
              readonly: false,
              timestamp: +new Date(),
            });
          }
        }
      },
      snapshot: cloneDeep(snapshot),
    });
  }

  public initializeChildrens(children: Record<string, AnyActorRef>) {
    if (!this.actor) {
      return;
    }
    for (const [key, value] of Object.entries(children)) {
      const actor = this.actor?.system.get(key);
      if (!actor) {
        // ACTOR HAS REACHED THE FINAL STATE.
        // console.error("ACTOR NOT FOUND", key, value);
        continue;
      }
      if (
        actor.getSnapshot().can({
          type: "INITIALIZE",
        })
      ) {
        actor.send({
          type: "INITIALIZE",
        });
      }
    }
  }

  public async setup() {
    this.editor.use(this.engine);
    this.editor.use(this.dataFlow);

    await this.setupEnv();

    const snapshot = this.createInitialSnapshot();

    // this.inspector = createBrowserInspector({ autoStart: false });
    this.actor = this.createActor(snapshot);

    this.setupEventHandling();
    await this.import(this.content);
    this.actor.start();
    this.initializeChildrens(snapshot.children);

    this.handleNodeEvents();

    await this.setUI();
  }

  setupEventHandling() {
    this.stateEvents
      .pipe(
        // Group by executionNodeId
        bufferTime(500),
        filter((events) => events.length > 0),
        concatMap((events) => {
          // Reduce events to an object with unique systemIds, keeping the latest event for each systemId
          const latestEventsBySystemId = events.reduce(
            (acc, event) => {
              // Assume event.state has a timestamp or similar to determine "latest"
              // If not, you may need to adjust this logic to suit how you determine the latest event
              const currentEvent = acc[event.state.systemId];
              if (!currentEvent || currentEvent.timestamp < event.timestamp) {
                acc[event.state.systemId] = event;
              }
              return acc;
            },
            {} as Record<string, (typeof events)[number]>,
          );
          console.log("LATEST EVENTS", latestEventsBySystemId);
          return this.api.trpc.craft.node.setContext.mutate(
            Object.values(latestEventsBySystemId).map((event) => {
              return {
                contextId: event.state.systemId,
                workflowId: this.workflowId,
                workflowVersionId: this.workflowVersionId,
                projectId: this.projectId,
                context: JSON.stringify(event.state),
              };
            }),
          );
        }),
        catchError((error) => {
          // Handle or log the error
          return of(error); // or use a more suitable error handling strategy
        }),
      )
      .subscribe({
        next: async (event) => {
          // console.log("RXJS EVENT", event);
        },
        error: (error) => {
          console.log("RXJS ERROR", error);
        },
      });
  }

  public async mount(params: {
    container: HTMLElement;
    render: ReactPlugin<Scheme, AreaExtra<Scheme>>;
    domRegistry: DOMRegistry<
      HTMLElement,
      {
        element: HTMLElement;
        component: any;
      }
    >;
  }) {
    const { AreaExtensions, AreaPlugin, Zoom } = await import(
      "rete-area-plugin"
    );
    const render = params.render;
    this.render = render;
    this.domRegistry = params.domRegistry;
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
      await node.setup();
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
          await queue.add(() => {
            const actor = data.actor;
            const snap = {
              src: actor.src,
              syncSnapshot: actor._syncSnapshot,
              systemId: actor.id,
              snapshot: actor.getSnapshot().toJSON(),
            };

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
                context: JSON.stringify(snap),
                position: { x: 0, y: 0 }, // When node is created it's position is 0,0 and it's moved later on.
                ...size,
              },
            });
          });
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
          queue.add(() =>
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
    const metaEvents = new Subject<
      RouterInputs["craft"]["node"]["updateMetadata"]
    >();
    metaEvents
      .pipe(
        groupBy((event) => event.id),
        mergeMap((group) =>
          group.pipe(
            scan((acc, curr) => ({ ...acc, ...curr })),
            debounceTime(1000),
          ),
        ),
      )
      .subscribe(async (event) => {
        await this.api.trpc.craft.node.updateMetadata.mutate(event);
      });

    const positionSubject = new BehaviorSubject<Position>({ x: 0, y: 0 });
    positionSubject.pipe(debounceTime(100)).subscribe((position) => {
      this.setCursorPosition(position);
    });
    const selectedNodeSubject = new BehaviorSubject<NodeId | null>(null);

    selectedNodeSubject.pipe(debounceTime(100)).subscribe((nodeId) => {
      this.setSelectedNodeId(nodeId);
    });

    this.area?.addPipe((context) => {
      match(context)
        .with({ type: "pointermove" }, ({ data: { position } }) => {
          positionSubject.next(position);
        })
        .with({ type: "nodepicked" }, ({ data }) => {
          selectedNodeSubject.next(data.id);
        })
        .with({ type: "pointerdown" }, ({ data }) => {
          if (
            (data?.event.target as HTMLElement).classList.contains(
              "background",
            ) &&
            this.selectedNodeId
          ) {
            selectedNodeSubject.next(null);
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
            metaEvents.next({ id: data.id, size });
          }
        })
        .with({ type: "nodetranslated" }, ({ data }) => {
          if (
            data.position.x !== data.previous.y ||
            data.position.y !== data.previous.y
          ) {
            metaEvents.next({ id: data.id, position: data.position });
          }
        });
      return context;
    });
  }
}
