import { useEffect, useRef, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { SelectControl } from "../../controls/select";

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
    <Select
      value={value}
      onValueChange={handleChange}
      defaultValue={props.data.value}
    >
      <SelectTrigger className="w-full min-w-[5rem]" id={props.data.id}>
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
