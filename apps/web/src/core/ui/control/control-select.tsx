import { useSelector } from "@xstate/react";
import { AnyActor } from "xstate";

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

export function SelectControlComponent<T extends AnyActor = AnyActor>(props: {
  data: SelectControl<T, string>;
}) {
  const value = useSelector(props.data?.actor, props.data.selector);

  const handleChange = (value: any) => {
    props.data.setValue(value);
  };

  return (
    <div className="space-y-1">
      <Label htmlFor={props.data.id}>
        {props.data?.definition?.title || props.data?.definition?.name}
      </Label>
      <Select value={value} onValueChange={handleChange} defaultValue={value}>
        <SelectTrigger className="w-full min-w-[5rem]" id={props.data.id}>
          <SelectValue
            id={props.data.id}
            placeholder={props.data.options.placeholder}
            className="w-full max-w-md truncate"
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
        {props.data?.definition?.description}
      </p>
    </div>
  );
}
