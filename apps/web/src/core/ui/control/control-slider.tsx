import { useEffect } from "react";
import { useSelector } from "@xstate/react";

import type { SliderControl } from "@seocraft/core/src/controls/slider";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export function SliderControlComponenet(props: { data: SliderControl }) {
  const value = useSelector(props.data?.actor, props.data.selector);
  const definition = useSelector(
    props.data?.actor,
    (state) => state.context.inputSockets[props.data.definition["x-key"]],
  );
  const handleChange = (n: number[]) => {
    props.data.setValue(n[0] || props.data.options.min);
  };
  useEffect(() => {
    if (value > definition.maximum) {
      handleChange([definition.maximum]);
    }
  }, [value, definition.maximum]);
  return (
    <div className="space-y-2">
      <Label htmlFor={props.data.id}>
        {definition?.title || definition?.name}{" "}
      </Label>
      <span className="bg-muted text-muted-foreground mx-4 rounded px-2 py-1">
        {value}
      </span>
      <Slider
        value={[value]}
        onValueChange={handleChange}
        className="mt-2"
        max={definition.maximum}
        step={props.data.step}
      />
      <p className={cn("text-muted-foreground text-[0.8rem]")}>
        {definition?.description}
      </p>
    </div>
  );
}
