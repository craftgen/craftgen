import { useMemo, useState } from "react";
import { useSelector } from "@xstate/react";
import { LayoutGroup, motion } from "framer-motion";
import _, { omit, get, isNil, isEqual } from "lodash-es";
import { ChevronDown, ChevronRight, Circle, CircleDot } from "lucide-react";
import { Actor, AnyActor, AnyActorRef } from "xstate";

import { NodeControl } from "@seocraft/core/src/controls/node";
import { JSONSocket } from "@seocraft/core/src/controls/socket-generator";
import {
  getControlBySocket,
  getSocketByJsonSchemaType,
} from "@seocraft/core/src/sockets";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";

import { ControlWrapper } from "@/core/ui/control-wrapper";
import { inputSocketMachine } from "@seocraft/core/src/input-socket";
import { Label } from "@/components/ui/label";
import { outputSocketMachine } from "@seocraft/core/src/output-socket";

export const NodeControlComponent = (props: { data: NodeControl }) => {
  const socketKey = useMemo(() => {
    return `${props.data.definition["x-actor-ref-id"]}-${props.data.definition["x-key"]}`;
  }, [props.data.actor.src, props.data.definition["x-key"]]);

  console.log("NODE CONTROLLER SOCKET", socketKey);

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

  console.log("selectedActorState", selectedActor, item["x-key"]);

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
    .pickBy((v) => get(v, "x-isAdvanced", false))
    .keys()
    .value();

const basicInputSelector = (state: any) =>
  _.chain(state.context.inputSockets)
    // .pickBy((v) => !v["x-isAdvanced"])
    .entries()
    .value();

export const InputsList = (props: {
  actor: AnyActor;
  showAdvanced?: boolean;
}) => {
  return (
    <LayoutGroup>
      <BasicInputs actor={props.actor} />
      <AdvanceInputs
        actor={props.actor}
        showAdvanced={props.showAdvanced || false}
      />
    </LayoutGroup>
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
          {inputSockets?.map((item) => {
            return <InputItem key={item} itemKey={item} actor={props.actor} />;
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
  const parentId = useSelector(
    actor,
    (state) => state.context.parent.id,
    isEqual,
  );

  const controller = useMemo(() => {
    return getControlBySocket({
      actor: actor,
      definition: item,
    });
  }, [item]);

  if (item["x-actor-type"]) {
    console.log("ACTOR TYPE INPUTS", item["x-actor-type"], item);
    const targetActor = actor.system.get(parentId).getSnapshot().context.inputs[
      item["x-key"]
    ];
    console.log("TARGET ACTOR", targetActor, parentId, item["x-key"]);
    return <ActorInputItem targetActor={targetActor} socketActor={actor} />;
  }

  return (
    <SocketController actor={actor} socket={item} socketKey={itemKey}>
      <ControlWrapper control={controller} definition={item} />
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
        "x-showControl": val,
      },
    });
  };
  const socket = useSelector(socketActor, (state) => state.context.definition);

  if (socket["x-actor-type"] === "NodeText") {
    console.log({
      targetActor,
      socketActor,
      socket,
      // outputs: Object.values(
      //   targetActor.getSnapshot().context.outputSockets,
      // )[0],
    });

    // const controller = useMemo(() => {
    //   const actor = Object.values(
    //     targetActor.getSnapshot().context.inputSockets,
    //   )[0] as Actor<typeof outputSocketMachine>;
    //   return getControlBySocket({
    //     actor: actor,
    //     definition: actor.getSnapshot().context.definition,
    //   });
    // }, []);
    return (
      <SocketController
        actor={socketActor}
        socket={socket}
        socketKey={socket["x-key"]}
      >
        <ControlWrapper control={null} definition={socket} />
      </SocketController>
    );
  }

  return (
    <div className="m-2 rounded border">
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
            onClick={() => handleToggleController(!socket["x-showControl"])}
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
            {socket["x-showControl"] ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Toggle>
        </div>
      </div>
      {socket["x-showControl"] && (
        <div className="bg-muted/20   m-1">
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
  actor: Actor<typeof inputSocketMachine | typeof outputSocketMachine>;
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
        "x-showControl": val,
      },
    });
  };
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
        "m-2 mb-2 flex flex-row space-x-1 p-2",
        hasConnection && "bg-muted/30 rounded border",
      )}
    >
      <div className="flex flex-col space-y-1">
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
      {children}
    </motion.div>
  );
};
