import { useEffect } from "react";
import { useSelector } from "@xstate/react";

import type { SliderControl } from "@seocraft/core/src/controls/slider";

import { Slider } from "@craftgen/ui/slider";
import { useStep } from "./shared/useStep";
import { ControlContainer } from "../control-container";

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
      <span className="bg-muted text-muted-foreground mx-4 rounded px-2 py-1">
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
