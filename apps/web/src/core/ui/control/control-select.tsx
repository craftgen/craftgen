import { useEffect, useRef, useState } from "react";

import { SelectControl } from "@seocraft/core/src/controls/select";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function SelectControlComponent<T extends string>(props: {
  data: SelectControl<T>;
}) {
  const [value, setValue] = useState<T | undefined>(props.data.value);

  const handleChange = (value: any) => {
    props.data.setValue(value);
    setValue(value);
  };

  useEffect(() => {
    setValue(props.data.value);
  }, [props.data.value]);

  return (
    <div className="space-y-1">
      <Label htmlFor={props.data.id}>
        {props.data?.defination?.title || props.data?.defination?.name}
      </Label>
      <Select
        value={value}
        onValueChange={handleChange}
        defaultValue={props.data.value}
      >
        <SelectTrigger className="w-full min-w-[5rem]" id={props.data.id}>
          <SelectValue
            id={props.data.id}
            placeholder={props.data.options.placeholder}
          />
        </SelectTrigger>
        <SelectContent className="z-50">
          {props.data.options.values.map((value) => (
            <SelectItem key={value.key} value={value.key}>
              {value.value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <p className={cn("text-muted-foreground text-[0.8rem]")}>
        {props.data?.defination?.description}
      </p>
    </div>
  );
}
