import * as React from "react";
import styled, { css } from "styled-components";

import { useDebounce } from "../hooks";
import { CommonStyle } from "../styles";
import type { Customize, Item } from "../types";
import { $width } from "../vars";

export const ItemStyle = styled(CommonStyle)<{ hasSubitems?: boolean }>`
  ${(props) =>
    props.hasSubitems &&
    css`
      &:after {
        content: "►";
        position: absolute;
        opacity: 0.6;
        right: 5px;
        top: 5px;
      }
    `}
`;

export const SubitemStyles = styled.div`
  position: absolute;
  top: 0;
  left: 100%;
  width: ${$width}px;
`;

interface Props {
  data: Item;
  delay: number;
  hide(): void;
  children: React.ReactNode;
  components?: Pick<Customize, "item" | "subitems">;
}

export function ItemElement(props: Props) {
  const [visibleSubitems, setVisibleSubitems] = React.useState(false);
  const setInvisibile = React.useCallback(
    () => setVisibleSubitems(false),
    [setVisibleSubitems],
  );
  const [hide, cancelHide] = useDebounce(setInvisibile, props.delay);
  const Component = props.components?.item?.(props.data) || ItemStyle;
  const Subitems = props.components?.subitems?.(props.data) || SubitemStyles;

  return (
    <Component
      onClick={(e) => {
        e.stopPropagation();
        props.data.handler();
        props.hide();
      }}
      hasSubitems={Boolean(props.data.subitems)}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerOver={() => {
        cancelHide();
        setVisibleSubitems(true);
      }}
      onPointerLeave={() => hide && hide()}
      data-testid="context-menu-item"
    >
      {props.children}
      {props.data.subitems && visibleSubitems && (
        <Subitems>
          {props.data.subitems.map((item) => (
            <ItemElement
              key={item.key}
              data={item}
              delay={props.delay}
              hide={props.hide}
              components={props.components}
            >
              {item.label}
            </ItemElement>
          ))}
        </Subitems>
      )}
    </Component>
  );
}
