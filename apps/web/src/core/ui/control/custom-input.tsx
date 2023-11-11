import { useEffect, useState } from "react";

import type { InputControl } from "@seocraft/core/src/controls/input.control";

import { Input } from "@/components/ui/input";

export function CustomInput(props: { data: InputControl }) {
  const [value, setValue] = useState(props.data.value);

  useEffect(() => {
    setValue(props.data.value);
  }, [props.data.value]);

  return (
    <Input
      id={props.data.id}
      disabled={props.data.options.readonly}
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        props.data.setValue(e.target.value);
      }}
    />
  );
}
