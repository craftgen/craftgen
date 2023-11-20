import { useEffect, useState } from "react";

import type { TextareControl } from "@seocraft/core/src/controls/textarea";

import { Textarea } from "@/components/ui/textarea";

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
        setValue(e.target.value);
        props.data.setValue(e.target.value);
      }}
    />
  );
}
