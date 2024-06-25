import { useSelector } from "@xstate/react";

import type { TextareControl } from "@craftgen/core/controls/textarea";
import { Textarea } from "@craftgen/ui/components/textarea";

import { ControlContainer } from "../control-container";

export function CustomTextarea(props: { data: TextareControl }) {
  const value = useSelector(props.data?.actor, props.data.selector);

  return (
    <ControlContainer id={props.data.id} definition={props.data.definition!}>
      <Textarea
        id={props.data.id}
        disabled={props.data.options.readonly}
        rows={3}
        value={value}
        className="resize-none hover:resize"
        onChange={(e) => {
          props.data.setValue(e.target.value);
        }}
      />
    </ControlContainer>
  );
}
