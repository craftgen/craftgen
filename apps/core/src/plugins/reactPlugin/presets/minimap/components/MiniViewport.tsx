import * as React from "react";
import styled from "styled-components";

import { useDrag } from "../../../shared/drag";
import type { Rect, Transform, Translate } from "../types";
import { px } from "../utils";

const MiniViewportStyles = styled.div`
  position: absolute;
  background: rgba(255, 251, 128, 0.32);
  border: 1px solid #ffe52b;
`;

export function MiniViewport(
  props: Rect & {
    containerWidth: number;
    start(): Transform;
    translate: Translate;
  },
) {
  const scale = (v: number) => v * props.containerWidth;
  const invert = (v: number) => v / props.containerWidth;
  const drag = useDrag(
    (dx, dy) => props.translate(invert(-dx), invert(-dy)),
    (e) => ({ x: e.pageX, y: e.pageY }),
  );

  return (
    <MiniViewportStyles
      onPointerDown={drag.start}
      style={{
        left: px(scale(props.left)),
        top: px(scale(props.top)),
        width: px(scale(props.width)),
        height: px(scale(props.height)),
      }}
      data-testid="minimap-viewport"
    />
  );
}
