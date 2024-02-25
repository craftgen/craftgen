import { useMemo, useState } from "react";
import { useSelector } from "@xstate/react";
import { LayoutGroup, motion } from "framer-motion";
import _, { omit, get, isEqual } from "lodash-es";
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Circle,
  CircleDot,
} from "lucide-react";
import { AnyActor, AnyActorRef } from "xstate";

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

export const NodeControlComponent = (props: { data: NodeControl }) => {
  console.log("NODE CONTROLLER", props.data.actor.src, props.data.actor.src);
  const item = useSelector<AnyActorRef, JSONSocket>(
    props.data.actor,
    (state) =>
      state.context.inputSockets[props.data.definition["x-key"]] as JSONSocket,
  );

  const actorSelector = useMemo(() => {
    if (!item) return null;
    if (item["x-connection"] && Object.keys(item["x-connection"]).length > 0) {
      return null;
    }
    if (item["x-compatible"]?.length === 1) {
      return null;
    }
    const controller = getControlBySocket({
      socket: getSocketByJsonSchemaType(item),
      actor: props.data.actor,
      selector: (snapshot) =>
        snapshot.context.inputSockets[props.data.definition["x-key"]][
          "x-actor-type"
        ],
      definitionSelector: (snapshot) =>
        snapshot.context.inputSockets[props.data.definition["x-key"]],
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
    (state) =>
      state.context.inputSockets[props.data.definition["x-key"]]["x-actor-ref"],
  );
  const selectedActorState = useSelector<AnyActor, any>(
    selectedActor,
    (state) => state?.value,
    isEqual,
  );

  return (
    <div>
      <LayoutGroup>
        {actorSelector}
        {selectedActorState && (
          <div
            className={cn(
              "bg-muted/10 flex flex-col rounded border p-2",
              selectedActorState === "complete" && "border-green-400/30",
              selectedActorState === "action_required" &&
                "border-yellow-400/30",
            )}
          >
            <div className="flex items-center justify-end">
              {/* <Badge>{JSON.stringify(selectedActorState.value)}</Badge> */}
              {selectedActorState === "complete" && (
                <CheckCircle size={14} className="text-green-400" />
              )}
              {selectedActorState === "action_required" && (
                <AlertCircle size={14} className="text-yellow-400" />
              )}
            </div>
            {selectedActor && (
              <div className="border p-1">
                <InputsList actor={selectedActor} />
              </div>
            )}
          </div>
        )}
      </LayoutGroup>
    </div>
  );
};

const advanceInputSelector = (state: any) =>
  _.chain(state.context.inputSockets)
    .pickBy((v) => get(v, "x-isAdvanced", false))
    .keys()
    .value();

const basicInputSelector = (state: any) =>
  _.chain(state.context.inputSockets)
    .pickBy((v) => !v["x-isAdvanced"])
    .keys()
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
  console.log("Basic inputSockets", inputSockets);
  return (
    <>
      {inputSockets?.map((item) => {
        return <InputItem key={item} itemKey={item} actor={props.actor} />;
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
  actor: AnyActor;
}) => {
  const item = useSelector(
    actor,
    (state) => state.context.inputSockets[itemKey],
  );
  const targetActor = item["x-actor-id"]
    ? actor.system.get(item["x-actor-id"])
    : actor;
  const socket = useMemo(() => getSocketByJsonSchemaType(item), [item]);
  const handleChange = (v: any) => {
    targetActor.send({
      type: "SET_VALUE",
      params: {
        values: {
          [item["x-key"]]: v,
        },
      },
    });
  };
  const controller = useMemo(
    () =>
      getControlBySocket({
        socket,
        actor: targetActor,
        selector: (snapshot) => snapshot.context.inputs[item["x-key"]],
        definitionSelector: (snapshot) =>
          snapshot.context.inputSockets[item["x-key"]],
        onChange: handleChange,
        definition: item,
      }),
    [item, item.format],
  );

  return (
    <SocketController actor={actor} socket={item}>
      <ControlWrapper control={controller} definition={item} />
    </SocketController>
  );
};

const SocketController = ({
  actor,
  socket,
  children,
}: {
  actor: AnyActor;
  socket: JSONSocket;
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
        name: socket["x-key"],
        side: "input",
        socket: {
          "x-showSocket": val,
        },
      },
    });
  };
  const handleToggleController = (val: boolean) => {
    actor.send({
      type: "UPDATE_SOCKET",
      params: {
        name: socket["x-key"],
        side: "input",
        socket: {
          "x-showControl": val,
        },
      },
    });
  };
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      exit={{ opacity: 0 }}
      data-socket-key={socket["x-key"]}
      data-socket-type={socket["x-type"]}
      data-socket-actor-ref-id={socket["x-actor-ref-id"]}
      className={cn(
        "mb-2 flex flex-row space-x-1 p-2",
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
