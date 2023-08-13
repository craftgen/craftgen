import { Button } from "@/components/ui/button";
import { ClassicPreset } from "rete";

export class ButtonControl extends ClassicPreset.Control {
  __type = "ButtonControl";

  constructor(public label: string, public onClick: () => void) {
    super();
  }
}

export function CustomButton(props: { data: ButtonControl }) {
  return (
    <Button
      onPointerDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      size={"sm"}
      onClick={props.data.onClick}
    >
      {props.data.label}
    </Button>
  );
}