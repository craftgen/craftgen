import * as React from "react";
import { useSelector } from "@xstate/react";
import { match } from "ts-pattern";

import { Input, Output } from "@craftgen/core/input-output";
import type { ExtractPayload } from "@craftgen/core/plugins/reactPlugin/presets/classic/types";
import { Socket } from "@craftgen/core/sockets";
import type { Schemes } from "@craftgen/core/types";
import { Badge } from "@craftgen/ui/components/badge";
import { cn } from "@craftgen/ui/lib/utils";

import { useSocketConfig } from "../sockets";

export function CustomSocket<T extends Socket>(props: {
  data: {
    socket?: T;
    input?: Input;
    output?: Output;
  };
  meta: Omit<ExtractPayload<Schemes, "socket">, "payload">;
}) {
  if (!props.data.socket) return null;
  const config = useSocketConfig(props.data.socket?.name);

  const data = React.useMemo(() => {
    return match(props)
      .with(
        {
          meta: {
            side: "input",
          },
        },
        ({ data: { input } }) => {
          return input;
        },
      )
      .with(
        {
          meta: {
            side: "output",
          },
        },
        ({ data: { output } }) => output,
      )
      .exhaustive();
  }, [props.data]);

  const label = useSelector(
    data?.actor,
    (state) =>
      state?.context?.definition?.name ||
      state?.context?.definition?.title ||
      data?.label,
  );

  return (
    <div title={props.data.socket.name}>
      <Badge
        className={cn(
          "z-10 border-primary-foreground/50  font-mono text-primary-foreground",
          config?.badge,
          props.meta.side === "input" && "-ml-1 rounded-l-none",
          props.meta.side === "output" && "-mr-1 rounded-r-none",
        )}
        variant={"outline"}
      >
        {label}
      </Badge>
    </div>
  );
}
