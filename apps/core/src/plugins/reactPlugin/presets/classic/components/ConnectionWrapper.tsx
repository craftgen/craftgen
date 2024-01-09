import * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";

import type { Position } from "../../../types";
import { syncFlush } from "../../../utils";

export interface ConnectionContextValue {
  start: Position | null;
  end: Position | null;
  path: null | string;
}

export const ConnectionContext = createContext<ConnectionContextValue>({
  start: null,
  end: null,
  path: null,
});

type PositionWatcher = (cb: (value: Position) => void) => () => void;

interface Props {
  children: JSX.Element;
  start: Position | PositionWatcher;
  end: Position | PositionWatcher;
  path(start: Position, end: Position): Promise<null | string>;
}

export function ConnectionWrapper(props: Props) {
  const { children } = props;
  const [computedStart, setStart] = useState<Position | null>(null);
  const [computedEnd, setEnd] = useState<Position | null>(null);
  const [path, setPath] = useState<string | null>(null);
  const start = "x" in props.start ? props.start : computedStart;
  const end = "x" in props.end ? props.end : computedEnd;
  const flush = syncFlush();

  useEffect(() => {
    const unwatch1 =
      typeof props.start === "function" &&
      props.start((s) => flush.apply(() => setStart(s)));
    const unwatch2 =
      typeof props.end === "function" &&
      props.end((s) => flush.apply(() => setEnd(s)));

    return () => {
      unwatch1 && unwatch1();
      unwatch2 && unwatch2();
    };
  }, []);
  useEffect(() => {
    if (start && end)
      props.path(start, end).then((p) => flush.apply(() => setPath(p)));
  }, [start, end]);

  return (
    <ConnectionContext.Provider value={{ start, end, path }}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  return useContext(ConnectionContext);
}
