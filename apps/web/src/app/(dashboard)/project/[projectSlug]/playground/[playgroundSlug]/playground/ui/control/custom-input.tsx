import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { InputControl } from "../../controls/input";

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
        setValue(e.target.value as string);
        props.data.setValue(e.target.value as string);
      }}
    />
  );
}
