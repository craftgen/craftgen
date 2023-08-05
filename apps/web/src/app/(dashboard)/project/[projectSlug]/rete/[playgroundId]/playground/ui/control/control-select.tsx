import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect,  useState } from "react";
import { ClassicPreset } from "rete";

export class SelectControl<T extends string> extends ClassicPreset.Control {
  __type = "select";

  constructor(
    public value: T | undefined,
    public placeholder: string,
    public values: { key: T; value: string }[],
    public setValue: (value: T) => void
  ) {
    super();
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
      <SelectTrigger className="min-w-[180px] w-full">
        <SelectValue placeholder={props.data.placeholder} />
      </SelectTrigger>
      <SelectContent className="z-50">
        {props.data.values.map((value) => (
          <SelectItem key={value.key} value={value.key}>
            {value.value}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
