import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useMemo, useState } from "react";
import { ClassicPreset } from "rete";
import useSWR from "swr";

export class SWRSelectControl<
  T extends string,
  Data
> extends ClassicPreset.Control {
  __type = "swr-select";

  constructor(
    public value: T | undefined,
    public placeholder: string,
    public dataKey: string,
    public dataFetch: () => Promise<Data[]>,
    public dataTransform: (data: Data[]) => { key: T; value: string }[],
    public setValue: (value: T) => void
  ) {
    super();
  }
}

export function SWRSelectControlComponent<T extends string, Data>(props: {
  data: SWRSelectControl<T, Data>;
}) {
  const { data, error } = useSWR(props.data.dataKey, props.data.dataFetch);
  const [value, setValue] = useState<T | undefined>(props.data.value);

  const values = useMemo(() => {
    if (!data) return [];
    return props.data.dataTransform(data);
  }, [data, props.data.dataTransform]);

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
        {values?.map((value) => (
          <SelectItem key={value.key} value={value.key}>
            {value.value}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
