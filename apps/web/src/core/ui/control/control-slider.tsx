import { useEffect, useState } from "react";

import type { SliderControl } from "@seocraft/core/src/controls/slider";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export function SliderControlComponenet(props: { data: SliderControl }) {
  const [value, setValue] = useState<number>(props.data.value);
  const handleChange = (n: number[]) => {
    setValue(n[0] || props.data.options.min);
    props.data.setValue(n[0] || props.data.options.min);
  };
  useEffect(() => {
    setValue(props.data.value);
  }, [props.data.value]);
  return (
    <div className="space-y-2">
      <Label htmlFor={props.data.id}>
        {props.data?.definition?.title || props.data?.definition?.name}{" "}
      </Label>
      <span className="bg-muted text-muted-foreground mx-4 rounded px-2 py-1">
        {value}
      </span>
      <Slider
        value={[value]}
        onValueChange={handleChange}
        className="mt-2"
        max={props.data.options.max}
        step={props.data.options.step || props.data.step}
      />
      <p className={cn("text-muted-foreground text-[0.8rem]")}>
        {props.data?.definition?.description}
      </p>
    </div>
  );
}
