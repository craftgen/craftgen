import { useSelector } from "@xstate/react";

import type { ButtonControl } from "@craftgen/core/controls/button";
import { Button } from "@craftgen/ui/components/button";

export function CustomButton(props: { data: ButtonControl }) {
  const { definition, parent } = useSelector(
    props.data?.actor,
    (snap) => snap.context,
  );
  const targetActor = props.data.actor.system.get(parent.id);
  const can = useSelector(targetActor, (snap) =>
    snap.can({
      type: definition["x-event"],
    }),
  );
  const handleSendEvent = () => {
    props.data.actor.send({
      type: "TRIGGER",
      origin: {
        id: props.data.id,
        type: "input-socket-button",
      },
    });
  };

  return (
    <Button
      id={props.data.id}
      onPointerDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      size={"sm"}
      onClick={handleSendEvent}
      disabled={!can}
    >
      {props.data.definition?.title || props.data.definition?.name}
    </Button>
  );
}
