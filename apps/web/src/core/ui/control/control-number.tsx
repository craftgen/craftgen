import { useSelector } from "@xstate/react";

import type { NumberControl } from "@seocraft/core/src/controls/number";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useStep } from "./shared/useStep";

export const NumberControlComponent = (props: { data: NumberControl }) => {
  const { definition, parent } = useSelector(
    props.data?.actor,
    (snap) => snap.context,
  );
  const value = useSelector(
    props.data?.actor.system.get(parent.id),
    (snap) => snap.context.inputs[definition["x-key"]],
  );
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
      <Label htmlFor={props.data.id}>
        {props.data?.definition?.title || props.data?.definition?.name}
      </Label>
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
      <p className={cn("text-muted-foreground text-[0.8rem]")}>
        {props.data?.definition?.description}
      </p>
    </div>
  );
};
