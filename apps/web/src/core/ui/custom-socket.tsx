import * as React from "react";
import { match } from "ts-pattern";

import type { ExtractPayload } from "@seocraft/core/src/plugins/reactPlugin/presets/classic/types";
import { useSocketConfig, type Socket } from "@seocraft/core/src/sockets";
import type { Schemes } from "@seocraft/core/src/types";

import { Badge } from "@craftgen/ui/components/badge";
import { cn } from "@/lib/utils";
import { Input, Output } from "@seocraft/core/src/input-output";
import { useSelector } from "@xstate/react";

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
          "text-primary-foreground border-primary-foreground/50  z-10 font-mono",
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
