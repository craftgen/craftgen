import { Button } from "@/components/ui/button";
import { ButtonControl } from "@seocraft/core/src/controls/button";


export function CustomButton(props: { data: ButtonControl }) {
  return (
    <Button
      id={props.data.id}
      onPointerDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      size={"sm"}
      onClick={props.data.onClick}
    >
      {props.data.label}
    </Button>
  );
}
