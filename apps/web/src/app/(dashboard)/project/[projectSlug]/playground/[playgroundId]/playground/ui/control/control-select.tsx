import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { ClassicPreset } from "rete";
type SelectControlOptions<T extends string> = {
  change: (value: T) => void;
  placeholder: string;
  values: { key: T; value: string }[];
};

export class SelectControl<T extends string> extends ClassicPreset.Control {
  __type = "select";

  constructor(
    public value: T | undefined,
    public options: SelectControlOptions<T>
  ) {
    super();
  }

  setValue(value: T) {
    this.value = value;
    if (this.options.change) this.options.change(value);
  }
}

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

  return (
    <Select onValueChange={handleChange} defaultValue={props.data.value}>
      <SelectTrigger className="min-w-[180px] w-full" id={props.data.id}>
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
