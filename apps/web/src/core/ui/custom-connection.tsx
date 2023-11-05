import * as React from "react";
import { Editor } from "@seocraft/core";
import { Connection } from "@seocraft/core/src/connection/connection";
import { socketConfig, SocketNameType } from "@seocraft/core/src/sockets";
import { Presets } from "rete-react-plugin";
import tw from "tailwind-styled-components";

import { cn } from "@/lib/utils";

const { useConnection } = Presets.classic;

const Svg = tw.svg`
w-screen h-screen overflow-visible pointer-events-none absolute z-0
`;

const Path = tw.path<{ styles?: (props: any) => any }>`
fill-none stroke-[5px] pointer-events-auto stroke-primary  
`;

export function CustomConnection(props: { data: Connection; di: Editor }) {
  const { path } = useConnection();
  const sourceSocket = React.useMemo(() => {
    if (!props.di) return;
    if (props.data.source) {
      return props.di.editor.getNode(props.data.source).outputs[
        props.data.sourceOutput
      ];
    }
    if (props.data.target) {
      return props.di.editor.getNode(props.data.target).inputs[
        props.data.targetInput
      ];
    }
  }, [props.data.source, props.di]);
  const sourceConfig = React.useMemo(() => {
    const socketName = sourceSocket?.socket.name as SocketNameType;
    return socketConfig[socketName];
  }, [sourceSocket]);

  return (
    <Svg data-testid="connection">
      {path && (
        <Path
          d={path}
          className={cn(
            sourceConfig && `stroke-${sourceConfig.connection}-400`,
          )}
        />
      )}
    </Svg>
  );
}
