import { useMemo } from "react";
import { useSelector } from "@xstate/react";
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
  console.log("@@@", props.data.actor, state);

  const inputs = useMemo(() => {
    return Object.entries(
      state.context.inputSockets as Record<string, JSONSocket>,
    ).map(([key, item]) => {
      return (
        <InputItem
          key={key}
          itemKey={key}
          item={item}
          actor={props.data.actor}
        />
      );
    });
  }, [state.context.inputSockets]);

  return <div className="space-y-1">{inputs}</div>;
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
      <div className="space-y-1">
        <ControlWrapper control={controller} definition={item} />
      </div>
    );
  },
);
