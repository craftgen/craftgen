import { cn } from "@/lib/utils";
import * as React from "react";
import { Socket, socketConfig } from "../sockets";

export function CustomSocket<T extends Socket>(props: { data: T }) {
  const config = React.useMemo(() => {
    return socketConfig[props.data.name];
  }, [props.data.name]);
  return (
    <div
      title={props.data.name}
      className={cn(
        "w-4 h-2  bg-primary/20 inline-block cursor-pointer border align-middle z-10 box-border hover:bg-primary",
        config.color
      )}
    />
  );
}
