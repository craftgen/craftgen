import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import type { SWRSelectControl } from "@craftgen/core/controls/swr-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@craftgen/ui/components/select";

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
      <SelectTrigger className="w-full min-w-[180px]">
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
