import { useMemo, useState } from "react";
import { useSelector } from "@xstate/react";
import { LayoutGroup, motion } from "framer-motion";
import { groupBy, omit } from "lodash-es";
import { observer } from "mobx-react-lite";
import { AnyActor } from "xstate";

import { NodeControl } from "@seocraft/core/src/controls/node";
import { JSONSocket } from "@seocraft/core/src/controls/socket-generator";
import {
  getControlBySocket,
  getSocketByJsonSchemaType,
} from "@seocraft/core/src/sockets";

import { ControlWrapper } from "@/app/(playground)/[projectSlug]/[workflowSlug]/v/[version]/playground";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    return (
      <div className="space-y-1">
        <ControlWrapper control={controller} definition={item} />
      </div>
    );
  }, [item]);

  const selectedActor = useSelector<AnyActor, AnyActor>(
    props.data.actor,
    (state) =>
      state.context.inputSockets[props.data.definition["x-key"]]["x-actor-ref"],
  );

  return (
    <div>
      <LayoutGroup>
        {actorSelector}
        {
          <InputsList
            actor={selectedActor}
            showAdvanced={item["x-showControl"]}
          />
        }
      </LayoutGroup>
    </div>
  );
});

const InputsList = observer(
  (props: { actor: AnyActor; showAdvanced: boolean }) => {
    const selectedActorState = useSelector<AnyActor, any>(
      props.actor,
      (state) => state,
    );
    // const [showAdvanced, setShowAdvanced] = useState(false);
    // const showAdvanced = ["x-showControl"];
    const { true: advanceInputs, false: basicInputs } = useMemo(() => {
      return (
        groupBy(
          Object.values<JSONSocket>(selectedActorState.context.inputSockets),
          (input) => {
            return input["x-isAdvanced"];
          },
        ) || { true: [], false: [] }
      );
    }, [selectedActorState.context.inputSockets]);
    return (
      <LayoutGroup>
        {basicInputs?.map((item) => {
          return (
            <InputItem
              key={item["x-key"]}
              itemKey={item["x-key"]}
              item={item}
              actor={props.actor}
            />
          );
        })}

        {/* {advanceInputs?.length > 0 && (
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
      )} */}
        {props.showAdvanced && (
          <motion.div layout>
            {advanceInputs?.map((item) => {
              return (
                <InputItem
                  key={item["x-key"]}
                  itemKey={item["x-key"]}
                  item={item}
                  actor={props.actor}
                />
              );
            })}
          </motion.div>
        )}
      </LayoutGroup>
    );
  },
);

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
