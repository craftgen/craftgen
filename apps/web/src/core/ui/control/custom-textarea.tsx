import { useEffect, useState } from "react";

import { Textarea } from "@/components/ui/textarea";

import { TextareControl } from "../../controls/textarea";

export function CustomTextarea(props: { data: TextareControl }) {
  const [value, setValue] = useState(props.data.value);

  useEffect(() => {
    setValue(props.data.value);
  }, [props.data.value]);

  return (
    <Textarea
      id={props.data.id}
      disabled={props.data.options.readonly}
      rows={3}
      value={value}
      className="resize-none hover:resize"
      onChange={(e) => {
        setValue(e.target.value as string);
        props.data.setValue(e.target.value as string);
      }}
    />
  );
}
