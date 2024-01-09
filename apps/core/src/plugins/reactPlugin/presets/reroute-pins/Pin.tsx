import * as React from "react";
import styled from "styled-components";

import { useDrag } from "../../shared/drag";
import type { Position } from "../../types";
import type { Pin as PinType } from "./types";

const pinSize = 20;

const Styles = styled.div<{ selected?: boolean }>`
  width: ${pinSize}px;
  height: ${pinSize}px;
  box-sizing: border-box;
  background: ${(props) => (props.selected ? "#ffd92c" : "steelblue")};
  border: 2px solid white;
  border-radius: ${pinSize}px;
`;

type Props = PinType & {
  contextMenu(): void;
  translate(dx: number, dy: number): void;
  pointerdown(): void;
  pointer(): Position;
};

export function Pin(props: Props) {
  const drag = useDrag((dx, dy) => props.translate(dx, dy), props.pointer);
  const { x, y } = props.position;

  return (
    <Styles
      onPointerDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
        drag.start(e);
        props.pointerdown();
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        e.preventDefault();
        props.contextMenu();
      }}
      selected={props.selected}
      style={{
        position: "absolute",
        top: `${y - pinSize / 2}px`,
        left: `${x - pinSize / 2}px`,
      }}
      data-testid="pin"
    ></Styles>
  );
}
