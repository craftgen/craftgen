import { useSelector } from "@xstate/react";

import type { ButtonControl } from "@seocraft/core/src/controls/button";

import { Button } from "@/components/ui/button";

export function CustomButton(props: { data: ButtonControl }) {
  const state = useSelector(props.data.actor, (snap) => snap);
  const can = state.can({
    type: props.data.definition["x-event"],
  });

  return (
    <Button
      id={props.data.id}
      onPointerDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      size={"sm"}
      onClick={props.data.options.onClick}
      disabled={!can}
    >
      {props.data.definition?.title || props.data.definition?.name}
    </Button>
  );
}
