import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { ClassicPreset } from "rete";

export class SelectControl<T extends string> extends ClassicPreset.Control {
  __type = "select";

  constructor(
    public value: T,
    public placeholder: string,
    public values: { key: T; value: string }[]
  ) {
    super();
  }
}

export function SelectControlComponent<T extends string>(props: { data: SelectControl<T> }) {
  const [value, setValue] = useState<T>(props.data.value);

  useEffect(() => {
    setValue(props.data.value);
  }, [props.data.value]);

  const handleChange = (value: any) => {
    setValue(value);
  };

  return (
    <Select
      onValueChange={handleChange}
      defaultValue={String(props.data.value)}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Theme" />
      </SelectTrigger>
      <SelectContent>
        {props.data.values.map((value) => (
          <SelectItem key={value.key} value={value.key}>
            {value.value}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
