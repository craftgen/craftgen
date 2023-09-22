import { Textarea } from "@/components/ui/textarea";
import { useEffect, useRef, useState } from "react";
import { ClassicPreset } from "rete";
import { Drag } from "rete-react-plugin";

export function CustomInput(props: {
  data: ClassicPreset.InputControl<"text">;
}) {
  const [value, setValue] = useState(props.data.value);

  useEffect(() => {
    setValue(props.data.value);
  }, [props.data.value]);
  const ref = useRef(null);
  Drag.useNoDrag(ref);

  return (
    <>
      <Textarea
        id={props.data.id}
        ref={ref}
        disabled={props.data.readonly}
        rows={3}
        value={value}
        onChange={(e) => {
          setValue(e.target.value as string);
          props.data.setValue(e.target.value as string);
        }}
      />
    </>
  );
}
