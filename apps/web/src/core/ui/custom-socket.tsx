import * as React from "react";
import type { ClassicPreset } from "rete";
import { match } from "ts-pattern";

import type { ExtractPayload } from "@seocraft/core/src/plugins/reactPlugin/presets/classic/types";
import type { Socket, Sockets } from "@seocraft/core/src/sockets";
import { socketConfig } from "@seocraft/core/src/sockets";
import type { Schemes } from "@seocraft/core/src/types";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function CustomSocket<T extends Socket>(props: {
  data: {
    socket: T;
    input?: ClassicPreset.Input<Sockets>;
    output?: ClassicPreset.Output<Sockets>;
  };
  meta: Omit<ExtractPayload<Schemes, "socket">, "payload">;
}) {
  const config = React.useMemo(() => {
    return socketConfig[props.data.socket.name];
  }, [props.data.socket.name]);

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

  return (
    <div title={props.data.socket.name}>
      <Badge
        className={cn(
          "text-primary-foreground z-10",
          config?.badge,
          props.meta.side === "input" && "-ml-1 rounded-l-none",
          props.meta.side === "output" && "-mr-1 rounded-r-none",
        )}
        data-testid="input-title"
        variant={"outline"}
      >
        {props.data.socket.name !== "Trigger" ? data?.label : "⌀"}
      </Badge>
    </div>
  );
}
