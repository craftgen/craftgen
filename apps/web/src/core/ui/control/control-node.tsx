import { useMemo } from "react";
import { useSelector } from "@xstate/react";
import { LayoutGroup, motion } from "framer-motion";
import { omit } from "lodash-es";
import { observer } from "mobx-react-lite";
import { AnyActor } from "xstate";

import { NodeControl } from "@seocraft/core/src/controls/node";
import { JSONSocket } from "@seocraft/core/src/controls/socket-generator";
import {
  getControlBySocket,
  getSocketByJsonSchemaType,
} from "@seocraft/core/src/sockets";

import { ControlWrapper } from "@/app/(playground)/[projectSlug]/[workflowSlug]/v/[version]/playground";

export const NodeControlComponent = observer((props: { data: NodeControl }) => {
  const state = useSelector(props.data.actor, (state) => state);
  const item = useSelector<AnyActor, JSONSocket>(
    props.data.actor,
    (state) => state.context.inputSockets[props.data.definition["x-key"]],
  );

  const actorSelector = useMemo(() => {
    if (!item) return null;
    if (item["x-connection"] && Object.keys(item["x-connection"]).length > 0) {
      return null;
    }
    const controller = getControlBySocket({
      socket: getSocketByJsonSchemaType(item),
      actor: props.data.actor,
      selector: (snapshot) =>
        state.context.inputSockets[props.data.definition["x-key"]][
          "x-actor-type"
        ],
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
          type: "UPDATE_CHILD_ACTORS",
        });
      },
      definition: omit(item, ["x-actor-ref"]),
    });
    return <ControlWrapper control={controller} definition={item} />;
  }, [item]);

  const selectedActor = useSelector<AnyActor, AnyActor>(
    props.data.actor,
    (state) =>
      state.context.inputSockets[props.data.definition["x-key"]]["x-actor-ref"],
  );
  const selectedActorState = useSelector<AnyActor, any>(
    selectedActor,
    (state) => state,
  );

  const inputs = useMemo(() => {
    return Object.entries(
      (selectedActorState?.context.inputSockets as Record<
        string,
        JSONSocket
      >) || {},
    ).map(([key, item]) => {
      return (
        <InputItem key={key} itemKey={key} item={item} actor={selectedActor} />
      );
    });
  }, [selectedActorState.context.inputSockets]);

  return (
    <div>
      <LayoutGroup>
        {actorSelector}
        <motion.div layout>{item["x-showControl"] && inputs}</motion.div>
      </LayoutGroup>
    </div>
  );
});

const InputItem = observer(
  ({
    itemKey,
    item,
    actor,
  }: {
    itemKey: string;
    item: JSONSocket;
    actor: AnyActor;
  }) => {
    const socket = getSocketByJsonSchemaType(item);
    const controller = getControlBySocket({
      socket,
      actor: actor,
      selector: (snapshot) => snapshot.context.inputs[itemKey],
      onChange: (v) => {
        console.log("onChange", v);
        actor.send({
          type: "SET_VALUE",
          values: {
            [itemKey]: v,
          },
        });
      },
      definition: item,
    });
    return (
      <motion.div className="space-y-1" layout>
        <ControlWrapper control={controller} definition={item} />
      </motion.div>
    );
  },
);
