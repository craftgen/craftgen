import { cn } from "@/lib/utils";
import * as React from "react";
import { Socket, Sockets, socketConfig } from "../sockets";
import { Badge } from "@/components/ui/badge";
import { ExtractPayload } from "rete-react-plugin/_types/presets/classic/types";
import { Schemes } from "../types";
import { ClassicPreset } from "rete";
import { match } from "ts-pattern";

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
        }
      )
      .with(
        {
          meta: {
            side: "output",
          },
        },
        ({ data: { output } }) => output
      )
      .exhaustive();
  }, [props.data]);

  return (
    <div title={props.data.socket.name}>
      <Badge
        className={cn(
          "text-primary-foreground z-10",
          config?.badge,
          props.meta.side === "input" && "rounded-l-none -ml-1",
          props.meta.side === "output" && "rounded-r-none -mr-1"
        )}
        data-testid="input-title"
        variant={"outline"}
      >
        {props.data.socket.name !== 'Trigger' ?  data?.label: '⌀'}
      </Badge>
    </div>
  );
}
