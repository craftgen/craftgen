import type { ButtonControl } from "@seocraft/core/src/controls/button";

import { Button } from "@/components/ui/button";

export function CustomButton(props: { data: ButtonControl }) {
  return (
    <Button
      id={props.data.id}
      onPointerDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      size={"sm"}
      onClick={props.data.onClick}
      disabled={props.data.options?.disabled}
    >
      {props.data.label}
    </Button>
  );
}
