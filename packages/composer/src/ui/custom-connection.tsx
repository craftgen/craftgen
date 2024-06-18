import * as React from "react";
import { useSelector } from "@xstate/react";
import { motion } from "framer-motion";

import { Connection } from "@craftgen/core/connection/connection";
import type { Editor } from "@craftgen/core/editor";
import { SocketNameType } from "@craftgen/core/sockets";
import { cn } from "@craftgen/ui/lib/utils";

import { Presets } from "../plugins/reactPlugin";
import { socketConfig } from "../sockets";

const { useConnection } = Presets.classic;

const useConnectionSync = (props: { data: Connection }) => {
  const sourceValue = useSelector(props.data?.sourceActor, (state) => {
    if (!state) {
      return null;
    }
    if (
      props.data.targetDefinition["x-compatible"]?.includes(
        props.data.sourceDefinition.type,
      )
    ) {
      return props.data.sourceActor;
    }
    return state?.context?.outputs[props.data.sourceDefinition["x-key"]];
  });

  const targetValue = useSelector(props.data?.targetActor, (state) =>
    state ? state?.context?.inputs[props.data.targetDefinition["x-key"]] : null,
  );

  const inSync = React.useMemo(() => {
    return sourceValue === targetValue;
  }, [sourceValue, targetValue]);
  return inSync;
};

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

  const inSync = useConnectionSync(props);
  return (
    <motion.svg
      data-testid="connection"
      className={
        "pointer-events-none absolute z-0 h-screen w-screen overflow-visible"
      }
    >
      {path && (
        <g>
          <motion.path
            d={path}
            className={cn(
              "pointer-events-auto fill-none stroke-muted-foreground stroke-[6px] dark:stroke-muted-foreground/60",
              // sourceConfig &&
              //   `stroke-${sourceConfig.connection}-400 dark:stroke-${sourceConfig.connection}-400`,
            )}
          />
          <motion.path
            d={path}
            animate={inSync ? "sync" : "inSync"}
            variants={{
              sync: { pathLength: 1, pathSpacing: 0.2 },
              inSync: {
                pathLength: [0.1, 0.4, 0.8],
                pathSpacing: [0.2, 0.4],
                transition: {
                  duration: 0.4,
                  ease: "easeInOut",
                  repeat: 1,
                  repeatType: "loop",
                  repeatDelay: 0.1,
                },
              },
            }}
            className={cn(
              "z-1 pointer-events-auto fill-none stroke-[4px]",
              sourceConfig &&
                inSync &&
                `stroke-${sourceConfig.connection}-400 dark:stroke-${sourceConfig.connection}-400/60`,
            )}
          />
        </g>
      )}
    </motion.svg>
  );
}
