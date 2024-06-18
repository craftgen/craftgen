import * as React from "react";
import styled from "styled-components";

import type { ComponentType } from "../types";

export const SearchInput = styled.input`
  color: white;
  padding: 1px 8px;
  border: 1px solid white;
  border-radius: 10px;
  font-size: 16px;
  font-family: serif;
  width: 100%;
  box-sizing: border-box;
  background: transparent;
`;

export function Search(props: {
  value: string;
  onChange(value: string): void;
  component?: ComponentType;
}) {
  const Component = props.component || SearchInput;

  return (
    <Component
      value={props.value}
      onInput={(e) => props.onChange((e.target as HTMLInputElement).value)}
      onPointerDown={(e) => e.stopPropagation()}
      data-testid="context-menu-search-input"
    />
  );
}
