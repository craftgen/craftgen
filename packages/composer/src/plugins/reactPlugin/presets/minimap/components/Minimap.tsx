import * as React from "react";
import { useCallback, useRef } from "react";
import styled from "styled-components";
import { useElementSize } from "usehooks-ts";

import type { Rect, Transform, Translate } from "../types";
import { px } from "../utils";
import { MiniNode } from "./MiniNode";
import { MiniViewport } from "./MiniViewport";

const Styles = styled.div<{ size: number }>`
  position: absolute;
  right: 24px;
  bottom: 24px;
  background: rgba(229, 234, 239, 0.65);
  padding: 20px;
  overflow: hidden;
  border: 1px solid #b1b7ff;
  border-radius: 8px;
  box-sizing: border-box;
`;

interface Props {
  size: number;
  ratio: number;
  nodes: Rect[];
  viewport: Rect;
  start(): Transform;
  translate: Translate;
  point(x: number, y: number): void;
}

export function Minimap(props: Props) {
  const container = useRef<HTMLElement | null>();
  const [containerRef, { width: containerWidth }] = useElementSize();
  const scale = (v: number) => v * containerWidth;
  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      container.current = node;
      containerRef(node);
    },
    [containerRef],
  );

  return (
    <Styles
      size={props.size}
      style={{
        width: px(props.size * props.ratio),
        height: px(props.size),
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!container.current) return;
        const box = container.current.getBoundingClientRect();
        const x = (e.clientX - box.left) / (props.size * props.ratio);
        const y = (e.clientY - box.top) / (props.size * props.ratio);

        props.point(x, y);
      }}
      ref={ref}
      data-testid="minimap"
    >
      {containerWidth &&
        props.nodes.map((node, i) => (
          <MiniNode
            key={i}
            left={scale(node.left)}
            top={scale(node.top)}
            width={scale(node.width)}
            height={scale(node.height)}
          />
        ))}
      <MiniViewport
        {...props.viewport}
        start={props.start}
        containerWidth={containerWidth}
        translate={props.translate}
      />
    </Styles>
  );
}
