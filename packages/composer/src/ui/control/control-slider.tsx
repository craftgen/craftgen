import { useEffect } from "react";
import { useSelector } from "@xstate/react";

import type { SliderControl } from "@craftgen/core/controls/slider";
import { Slider } from "@craftgen/ui/components/slider";

import { ControlContainer } from "../control-container";
import { useStep } from "./shared/useStep";

export function SliderControlComponenet(props: { data: SliderControl }) {
  console.log("SliderControlComponenet", props.data);
  const handleChange = (n: number[]) => {
    props.data.actor.send({
      type: "SET_VALUE",
      params: {
        value: n[0] || definition.exclusiveMinimum || definition.minimum,
      },
    });
  };
  const { definition, parent } = useSelector(
    props.data?.actor,
    (snap) => snap.context,
  );
  const value = useSelector(
    props.data?.actor.system.get(parent.id),
    (snap) => snap.context.inputs[definition["x-key"]],
  );
  const step = useStep(definition);
  useEffect(() => {
    if (value > definition?.maximum) {
      handleChange([definition?.maximum]);
    }
  }, [value, definition?.maximum]);
  return (
    <ControlContainer id={props.data.id} definition={definition}>
      <span className="mx-4 rounded bg-muted px-2 py-1 text-muted-foreground">
        {value}
      </span>
      <Slider
        value={[value]}
        onValueChange={handleChange}
        className="mt-2"
        max={definition?.maximum}
        step={step}
      />
    </ControlContainer>
  );
}
