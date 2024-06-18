import * as React from "react";
import styled from "styled-components";

import { useDebounce } from "../hooks";
import { CommonStyle } from "../styles";
import type { Customize, Item } from "../types";
import { $width } from "../vars";
import { ItemElement } from "./Item";
import { Search } from "./Search";

export const Styles = styled.div`
  padding: 10px;
  width: ${$width}px;
  margin-top: -20px;
  margin-left: -${$width / 2}px;
`;

interface Props {
  items: Item[];
  delay: number;
  searchBar?: boolean;
  onHide(): void;
  components?: Customize;
}

export function Menu(props: Props) {
  const [hide, cancelHide] = useDebounce(props.onHide, props.delay);
  const [filter, setFilter] = React.useState("");
  const filterRegexp = new RegExp(filter, "i");
  const filteredList = props.items.filter((item) =>
    item.label.match(filterRegexp),
  );
  const Component = props.components?.main?.() || Styles;
  const Common = props.components?.common?.() || CommonStyle;

  return (
    <Component
      onMouseOver={() => cancelHide()}
      onMouseLeave={() => hide && hide()}
      onWheel={(e) => e.stopPropagation()}
      data-testid="context-menu"
    >
      {props.searchBar && (
        <Common>
          <Search
            value={filter}
            onChange={setFilter}
            component={props.components?.search?.()}
          />
        </Common>
      )}
      {filteredList.map((item) => {
        return (
          <ItemElement
            key={item.key}
            data={item}
            delay={props.delay}
            hide={props.onHide}
            components={props.components}
          >
            {item.label}
          </ItemElement>
        );
      })}
    </Component>
  );
}
