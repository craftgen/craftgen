import * as React from "react";
import styled from "styled-components";

import { px } from "../utils";

const Styles = styled.div`
  position: absolute;
  background: rgba(110, 136, 255, 0.8);
  border: 1px solid rgb(192 206 212 / 60%);
`;

export function MiniNode(props: {
  left: number;
  top: number;
  width: number;
  height: number;
}) {
  return (
    <Styles
      style={{
        left: px(props.left),
        top: px(props.top),
        width: px(props.width),
        height: px(props.height),
      }}
      data-testid="minimap-node"
    />
  );
}
