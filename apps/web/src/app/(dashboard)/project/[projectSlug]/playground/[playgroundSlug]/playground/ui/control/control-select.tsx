import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useRef, useState } from "react";
import type { SelectControl } from "../../controls/select";

export function SelectControlComponent<T extends string>(props: {
  data: SelectControl<T>;
}) {
  const [value, setValue] = useState<T | undefined>(props.data.value);

  useEffect(() => {
    setValue(props.data.value);
  }, [props.data.value]);

  const handleChange = (value: any) => {
    setValue(value);
    props.data.setValue(value);
  };
  const [open, setOpen] = useState(false);

  return (
    <Select
      onValueChange={handleChange}
      defaultValue={props.data.value}
      open={open}
      onOpenChange={setOpen}
    >
      <SelectTrigger className="min-w-[5rem] w-full" id={props.data.id}>
        <SelectValue placeholder={props.data.options.placeholder} />
      </SelectTrigger>
      <SelectContent className="z-50">
        {props.data.options.values.map((value) => (
          <SelectItem key={value.key} value={value.key}>
            {value.value}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
