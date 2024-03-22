"use client";

import { useSelector } from "@xstate/react";
import JsonView from "react18-json-view";

import "react18-json-view/src/style.css";

import { match, P } from "ts-pattern";

export const JSONView: React.FC<Parameters<typeof JsonView>[0]> = (props) => {
  return (
    <JsonView
      {...props}
      displaySize="collapsed"
      customizeNode={(params) => {
        return match(params.node)
          .with(
            {
              src: P.string,
            },
            () => {
              const state = useSelector(params.node, (state) => ({
                state: state.value,
                context: state.context,
              }));
              return <JSONView src={state} />;
            },
          )
          .otherwise(() => ({}));
      }}
      collapsed={(params) => {
        return match(params)
          .with(
            {
              depth: P.when((depth) => depth > 1),
              size: P.when((size) => size === 0),
            },
            () => {
              return true;
            },
          )
          .with(
            {
              depth: P.when((depth) => depth > 3),
              // size: P.when((size) => size > 3),
            },
            () => {
              return true;
            },
          )
          .with(
            {
              depth: P.when((depth) => depth > 1),
              size: P.when((size) => size > 4),
            },
            () => {
              return true;
            },
          )
          .otherwise(() => {
            return false;
          });
      }}
      collapseStringMode="word"
      collapseStringsAfterLength={140}
    />
  );
};
