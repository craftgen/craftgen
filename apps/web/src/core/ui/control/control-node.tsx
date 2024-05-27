import { useMemo, useState } from "react";
import { useSelector } from "@xstate/react";
import { LayoutGroup, motion } from "framer-motion";
import _, { omit, get, isNil, isEqual } from "lodash-es";
import {
  ChevronDown,
  ChevronRight,
  Circle,
  CircleDot,
  Type,
} from "lucide-react";
import { Actor, ActorRefFrom, AnyActor, AnyActorRef } from "xstate";

import { NodeControl } from "@seocraft/core/src/controls/node";
import { JSONSocket } from "@seocraft/core/src/controls/socket-generator";
import {
  getControlBySocket,
  getSocketByJsonSchemaType,
  useSocketConfig,
} from "@seocraft/core/src/sockets";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";

import { ControlWrapper } from "@/core/ui/control-wrapper";
import { inputSocketMachine } from "@seocraft/core/src/input-socket";
import { Label } from "@/components/ui/label";
import { outputSocketMachine } from "@seocraft/core/src/output-socket";
import { SocketGenerator } from "./control-socket-generator";
import { Divider } from "@tremor/react";
import { Badge } from "@/components/ui/badge";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { JSONView } from "@/components/json-view";

export const NodeControlComponent = (props: { data: NodeControl }) => {
  const socketKey = useMemo(() => {
    return `${props.data.definition["x-actor-ref-id"]}-${props.data.definition["x-key"]}`;
  }, [props.data.actor.src, props.data.definition["x-key"]]);

  const item = useSelector<AnyActorRef, JSONSocket>(
    props.data.actor,
    (state) => state.context.inputSockets[socketKey] as JSONSocket,
  );

  const actorSelector = useMemo(() => {
    if (!item) return null;
    if (item["x-connection"] && Object.keys(item["x-connection"]).length > 0) {
      return null;
    }
    if (item["x-compatible"]?.length === 1 || isNil(item["x-compatible"])) {
      return null;
    }
    const controller = getControlBySocket({
      socket: getSocketByJsonSchemaType(item),
      actor: props.data.actor,
      selector: (snapshot) =>
        snapshot.context.inputSockets[socketKey]["x-actor-type"],
      definitionSelector: (snapshot) =>
        snapshot.context.inputSockets[socketKey],
      onChange: (v) => {
        console.log("onChange", v);
        props.data.actor.send({
          type: "UPDATE_SOCKET",
          params: {
            name: item["x-key"],
            side: "input",
            socket: {
              "x-actor-type": v,
            },
          },
        });
        props.data.actor.send({
          type: "INITIALIZE",
        });
      },
      definition: omit(item, ["x-actor-ref"]),
    });
    return (
      <div className="space-y-1">
        <ControlWrapper control={controller} definition={item} />
      </div>
    );
  }, [item]);

  const selectedActor = useSelector<AnyActorRef, AnyActor>(
    props.data?.actor,
    (state) => state.context.inputSockets[socketKey]["x-actor-ref"],
  );

  // console.log("selectedActorState", selectedActor, item["x-key"]);

  return (
    <div>
      <LayoutGroup>
        {actorSelector}
        <InputItem key={item} itemKey={item["x-key"]} actor={selectedActor} />
      </LayoutGroup>
    </div>
  );
};

// {selectedActorState && (
//   <div
//     className={cn(
//       "bg-muted/10 flex flex-col rounded border p-2",
//       selectedActorState === "complete" && "border-green-400/30",
//       selectedActorState === "action_required" &&
//         "border-yellow-400/30",
//     )}
//   >
//     <div className="flex items-center justify-end">
//       {/* <Badge>{JSON.stringify(selectedActorState.value)}</Badge> */}
//       {selectedActorState === "complete" && (
//         <CheckCircle size={14} className="text-green-400" />
//       )}
//       {selectedActorState === "action_required" && (
//         <AlertCircle size={14} className="text-yellow-400" />
//       )}
//     </div>
//     {selectedActor && (
//       <div className="border p-1">
//         <InputsList actor={selectedActor} />
//       </div>
//     )}
//   </div>
// )}

const advanceInputSelector = (state: any) =>
  _.chain(state.context.inputSockets)
    .pickBy((v) => {
      const definition = v.getSnapshot().context.definition;
      return get(definition, "x-isAdvanced", false);
    })
    .entries()
    .value();

const basicInputSelector = (state: any) =>
  _.chain(state.context.inputSockets)
    .pickBy((v) => {
      const definition = v.getSnapshot().context.definition;
      return !get(definition, "x-isAdvanced", false);
    })
    .entries()
    .value();

export const OutputsList = (props: { actor: AnyActor }) => {
  const outputSockets = useSelector(
    props.actor,
    (state) => {
      return Object.values(state.context.outputSockets);
    },
    isEqual,
  );

  return (
    <div>
      Outputs
      {outputSockets.length === 0 && <div>No Outputs</div>}
      {outputSockets.map((actor) => {
        return <div>{actor.src}</div>;
      })}
    </div>
  );
};

export const InputsList = (props: {
  actor: AnyActor;
  showAdvanced?: boolean;
}) => {
  const [showSocketGenerator, setShowSocketGenerator] = useState(false);
  const canAddSocket = useSelector(props.actor, (state) => {
    return state.can({
      type: "ADD_SOCKET",
    });
  });
  return (
    <div>
      <LayoutGroup>
        <BasicInputs actor={props.actor} />
        <AdvanceInputs
          actor={props.actor}
          showAdvanced={props.showAdvanced || false}
        />
        {showSocketGenerator && (
          <div className="flex w-full p-4">
            <SocketGenerator
              actor={props.actor}
              hideGenerator={() => setShowSocketGenerator(false)}
            />
          </div>
        )}
        {canAddSocket && (
          <Divider>
            <Button
              onClick={() => setShowSocketGenerator(true)}
              variant={"ghost"}
              size={"sm"}
            >
              Add Socket
            </Button>
          </Divider>
        )}
      </LayoutGroup>
    </div>
  );
};

export const OutputList = (props: { actor: AnyActor }) => {
  const outputSockets = useSelector(
    props.actor,
    (state) => {
      return Object.values(state.context.outputSockets);
    },
    isEqual,
  );

  return (
    <div>
      Outputs
      {outputSockets.length === 0 && <div>No Outputs</div>}
      {outputSockets.map((actor) => {
        return <OutputSocketItem key={actor.id} actor={actor} />;
      })}
    </div>
  );
};

export const OutputSocketItem = (props: {
  actor: ActorRefFrom<typeof outputSocketMachine>;
}) => {
  const { key, parentId } = useSelector(props.actor, (state) => ({
    key: state.context.definition["x-key"],
    parentId: state.context.parent.id,
  }));
  const value = useSelector(
    props.actor.system.get(parentId),
    (state) => state.context.outputs[key],
  );
  return (
    <div>
      <div>{key}</div>
      <JSONView src={value} />
    </div>
  );
};

const BasicInputs = (props: { actor: AnyActor }) => {
  const inputSockets = useSelector(props.actor, basicInputSelector, _.isEqual);

  return (
    <>
      {inputSockets?.map(([key, actor]) => {
        return <InputItem key={key} itemKey={key} actor={actor} />;
      })}
    </>
  );
};

const AdvanceInputs = (props: { actor: AnyActor; showAdvanced: boolean }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const inputSockets = useSelector(
    props.actor,
    advanceInputSelector,
    _.isEqual,
  );
  console.log("ADVANCE", {
    inputSockets,
    props,
  });
  return (
    <>
      {inputSockets.length > 0 && (
        <div
          className={cn("flex w-full items-center justify-center divide-x-2")}
        >
          <Button
            variant={showAdvanced ? "outline" : "ghost"}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? "Hide" : "Show"} Advance Settings
          </Button>
        </div>
      )}
      {showAdvanced && (
        <motion.div layout>
          {inputSockets?.map(([key, actor]) => {
            return <InputItem key={key} itemKey={key} actor={actor} />;
          })}
        </motion.div>
      )}
    </>
  );
};

const InputItem = ({
  itemKey,
  actor,
}: {
  itemKey: string;
  actor: Actor<typeof inputSocketMachine>;
}) => {
  const item = useSelector(actor, (state) => state.context.definition, isEqual);
  const { controller, definition } = useMemo(() => {
    const controller = getControlBySocket({
      actor: actor,
      definition: item,
    });
    return {
      controller,
      definition: item,
    };
  }, [item]);

  const hasConnectionBasic = useSelector(actor, (s) =>
    s.matches({ socket: { basic: "connection" } }),
  );

  const hasConnectionActor = useSelector(actor, (s) =>
    s.matches({ socket: { actor: "connection" } }),
  );

  if (hasConnectionActor) {
    // console.log({
    //   hasConnectionBasic,
    //   hasConnectionActor,
    //   item,
    // });
  }

  if (hasConnectionBasic) {
    //   console.log("HAS CONNECTION");
    const connectionActor: ActorRefFrom<typeof outputSocketMachine> =
      Object.values(item["x-connection"])[0];

    // console.log(connectionActors);
    // const connectionDefinition =
    //   connectionActor?.getSnapshot().context.definition;

    if (!connectionActor) return null;
    const targetActor = actor.system.get(
      connectionActor.getSnapshot().context.parent.id,
    );
    if (!targetActor) return null;

    return <ActorInputItem targetActor={targetActor} socketActor={actor} />;
  }

  if (hasConnectionActor) {
    const connectionActorId: ActorRefFrom<typeof outputSocketMachine> =
      Object.keys(item["x-connection"])[0];

    const outputSocketActor = actor.system.get(connectionActorId);
    if (!outputSocketActor) return null;

    const connectionTargetActor = actor.system.get(
      outputSocketActor.getSnapshot().context.parent.id,
    );

    if (connectionTargetActor) {
      return (
        <ActorInputItem
          targetActor={connectionTargetActor}
          socketActor={actor}
        />
      );
    }
    // const targetActor = useSelector(actor, (state) => state.context.value);
    const targetActor = actor.getSnapshot().context.value;
    if (!targetActor) return null;
    return <ActorInputItem targetActor={targetActor} socketActor={actor} />;
  }

  return (
    <SocketController actor={actor} socket={item} socketKey={itemKey}>
      <ControlWrapper control={controller} definition={definition} />
    </SocketController>
  );
};

const ActorInputItem = ({
  targetActor,
  socketActor,
}: {
  targetActor: AnyActor;
  socketActor: Actor<typeof inputSocketMachine>;
}) => {
  const handleToggleSocket = (val: boolean) => {
    socketActor.send({
      type: "UPDATE_SOCKET",
      params: {
        "x-showSocket": val,
      },
    });
  };
  const handleToggleController = (val: boolean) => {
    socketActor.send({
      type: "UPDATE_SOCKET",
      params: {
        "x-showController": val,
      },
    });
  };
  const socket = useSelector(socketActor, (state) => state.context.definition);
  const targetActorState = useSelector(targetActor, (state) => state.value);

  return (
    <div
      className={cn(
        "bg-muted/20 m-2 rounded border",
        targetActorState === "action_required" && "border-yellow-300/40",
      )}
    >
      <div className="m-2 ml-0 flex w-full flex-row items-center p-1 ">
        <div className="flex w-full flex-1 flex-row items-center space-x-1">
          <Toggle
            onPressedChange={handleToggleSocket}
            pressed={socket["x-showSocket"]}
            size={"sm"}
            // disabled={hasConnection}
          >
            {socket["x-showSocket"] ? (
              <CircleDot className="h-4 w-4" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
          </Toggle>
          <div
            className="flex w-full flex-1 cursor-pointer flex-col"
            onClick={() => handleToggleController(!socket["x-showController"])}
          >
            <Label>{socket.title || socket.name}</Label>
            <p className={cn("text-muted-foreground text-[0.8rem]")}>
              {socket?.description}
            </p>
          </div>
        </div>
        <div>
          <Toggle
            variant={"default"}
            size={"sm"}
            onPressedChange={handleToggleController}
          >
            {socket["x-showController"] ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Toggle>
        </div>
      </div>
      {socket["x-showController"] && (
        <div
          className={cn(
            "bg-muted/20 m-1 rounded py-1 ",
            // targetActorState === "action_required" && "bg-yellow-300/40",
          )}
        >
          <InputsList actor={targetActor} showAdvanced={true} />
        </div>
      )}
    </div>
  );
};

const SocketController = ({
  actor,
  socket,
  socketKey,
  children,
}: {
  actor: ActorRefFrom<typeof inputSocketMachine | typeof outputSocketMachine>;
  socket: JSONSocket;
  socketKey: string;
  children: React.ReactNode;
}) => {
  const hasConnection = useMemo(() => {
    return (
      socket["x-connection"] && Object.keys(socket["x-connection"]).length > 0
    );
  }, [socket]);
  const handleToggleSocket = (val: boolean) => {
    actor.send({
      type: "UPDATE_SOCKET",
      params: {
        "x-showSocket": val,
      },
    });
  };
  const handleToggleController = (val: boolean) => {
    actor.send({
      type: "UPDATE_SOCKET",
      params: {
        "x-showController": val,
      },
    });
  };

  const handleClone = () => {
    console.log("CLONE");
  };
  const handleDelete = () => {
    actor.send({
      type: "DELETE",
    });
  };
  const [showEdit, setShowEdit] = useState(false);
  const handleEdit = () => {
    setShowEdit(true);
  };
  const canDelete = useSelector(
    actor,
    (state) => {
      return state.can({
        type: "DELETE",
      });
    },
    isEqual,
  );
  const parentId = useSelector(actor, (state) => state.context.parent.id);
  const config = useSocketConfig(socket.type);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      exit={{ opacity: 0 }}
      data-socket-key={socketKey}
      data-socket-value-key={socket["x-key"]}
      data-socket-type={socket["x-type"]}
      data-socket-actor-ref-id={socket["x-actor-ref-id"]}
      className={cn(
        "m-2 mb-2 flex flex-row space-x-1  p-2",
        hasConnection && "bg-muted/30 rounded border",
      )}
    >
      <div className="flex flex-col space-y-1 ">
        <Toggle
          onPressedChange={handleToggleSocket}
          pressed={socket["x-showSocket"]}
          size={"sm"}
          disabled={hasConnection}
        >
          {socket["x-showSocket"] ? (
            <CircleDot className="h-4 w-4" />
          ) : (
            <Circle className="h-4 w-4" />
          )}
        </Toggle>
        {socket["x-actor-ref"] && (
          <Toggle
            variant={"default"}
            size={"sm"}
            onPressedChange={handleToggleController}
          >
            {socket["x-showController"] ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Toggle>
        )}
      </div>
      <div className="relative w-full">
        <div className="absolute right-0 top-0 flex space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="data-[state=open]:bg-muted flex h-8 w-8 p-0"
              >
                <DotsHorizontalIcon className="text-muted-foreground h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuItem onSelect={() => handleEdit()}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleClone()}>
                Make a copy
              </DropdownMenuItem>
              <DropdownMenuItem>Favorite</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleDelete} disabled={!canDelete}>
                Delete
                <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {showEdit && (
          <SocketGenerator
            actor={actor.system.get(parentId)}
            hideGenerator={() => setShowEdit(false)}
            socketActor={actor}
          />
        )}
        {children}
        <div className="flex items-center space-x-2 py-1">
          <Badge
            className="rounded-md bg-green-400/40 text-green-500"
            variant={"outline"}
          >
            {socket["x-key"]}
          </Badge>
          <Badge
            variant={"outline"}
            className={cn(
              "border-1 rounded-md border border-opacity-60 bg-opacity-30",
              config?.badge,
            )}
          >
            <Type className="mr-2 h-3 w-3" />
            {socket["type"]}
          </Badge>
        </div>
      </div>
    </motion.div>
  );
};
