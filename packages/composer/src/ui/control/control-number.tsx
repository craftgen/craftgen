import { useSelector } from "@xstate/react";

import type { NumberControl } from "@craftgen/core/controls/number";
import { Input } from "@craftgen/ui/components/input";

import { useStep } from "./shared/useStep";

export const NumberControlComponent = (props: { data: NumberControl }) => {
  const { definition, value: valueActor } = useSelector(
    props.data?.actor,
    (snap) => snap.context,
  );
  // const valueActor = useSelector(
  //   props.data?.actor.system.get(parent.id),
  //   (snap) => snap.context.inputs[definition["x-key"]],
  // );

  const value = useSelector(valueActor, (snap) => snap.context.value);

  const handleChange = (value: number) => {
    props.data.actor.send({
      type: "SET_VALUE",
      params: {
        value,
      },
    });
  };
  const step = useStep(definition);

  return (
    <div className="space-y-1">
      <Input
        id={props.data.id}
        type="number"
        max={definition?.maximum}
        min={definition?.min}
        step={step}
        value={value}
        className="w-full max-w-md"
        onChange={(e) => handleChange(Number(e.target.value))}
      />
    </div>
  );
};
