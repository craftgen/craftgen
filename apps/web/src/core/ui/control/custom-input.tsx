import { useEffect, useState } from "react";

import type { InputControl } from "@seocraft/core/src/controls/input.control";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function CustomInput(props: { data: InputControl }) {
  const [value, setValue] = useState(props.data.value);

  useEffect(() => {
    setValue(props.data.value);
  }, [props.data.value]);

  return (
    <div className="space-y-1">
      <Label htmlFor={props.data.id}>
        {props.data?.defination?.title || props.data?.defination?.name}{" "}
      </Label>
      <Input
        id={props.data.id}
        disabled={props.data.options.readonly}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          props.data.setValue(e.target.value);
        }}
      />
      <p className={cn("text-muted-foreground text-[0.8rem]")}>
        {props.data?.defination?.description}
      </p>
    </div>
  );
}
