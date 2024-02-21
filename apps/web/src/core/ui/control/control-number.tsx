import { useSelector } from "@xstate/react";

import type { NumberControl } from "@seocraft/core/src/controls/number";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const NumberControlComponent = (props: { data: NumberControl }) => {
  const value = useSelector(props.data?.actor, props.data.selector);
  const handleChange = (value: number) => {
    props.data.setValue(value);
  };

  return (
    <div className="space-y-1">
      <Label htmlFor={props.data.id}>
        {props.data?.definition?.title || props.data?.definition?.name}
      </Label>
      <Input
        id={props.data.id}
        type="number"
        max={props.data?.options?.max}
        min={props.data?.options?.min}
        step={props.data?.step}
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
