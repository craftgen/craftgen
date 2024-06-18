import * as React from "react";
import type { ClassicPreset } from "rete";
import styled from "styled-components";

import { Drag } from "../../../shared";

const Input = styled.input<{ styles?: (props: any) => any }>`
  width: 100%;
  border-radius: 30px;
  background-color: white;
  padding: 2px 6px;
  border: 1px solid #999;
  font-size: 110%;
  box-sizing: border-box;
  ${(props) => props.styles?.(props)}
`;

export function Control<N extends "text" | "number">(props: {
  data: ClassicPreset.InputControl<N>;
  styles?: () => any;
}) {
  const [value, setValue] = React.useState(props.data.value);
  const ref = React.useRef(null);

  Drag.useNoDrag(ref);

  React.useEffect(() => {
    setValue(props.data.value);
  }, [props.data.value]);

  return (
    <Input
      value={value}
      type={props.data.type}
      ref={ref}
      readOnly={props.data.readonly}
      onChange={(e) => {
        const val = (
          props.data.type === "number" ? +e.target.value : e.target.value
        ) as (typeof props.data)["value"];

        setValue(val);
        props.data.setValue(val);
      }}
      styles={props.styles}
    />
  );
}
