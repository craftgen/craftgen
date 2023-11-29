import { useEffect, useState } from "react";

import type { NumberControl } from "@seocraft/core/src/controls/number";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function NumberControlComponent(props: { data: NumberControl }) {
  const [value, setValue] = useState<number>(props.data.value);
  const handleChange = (value: number) => {
    setValue(value);
    props.data.setValue(value);
  };
  useEffect(() => {
    setValue(props.data.value);
  }, [props.data.value]);
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
        value={value}
        className="w-full max-w-md"
        onChange={(e) => handleChange(Number(e.target.value))}
      />
      <p className={cn("text-muted-foreground text-[0.8rem]")}>
        {props.data?.definition?.description}
      </p>
    </div>
  );
}
