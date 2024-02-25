import * as React from "react";

import { Editor } from "@seocraft/core";
import { Connection } from "@seocraft/core/src/connection/connection";
import { Presets } from "@seocraft/core/src/plugins/reactPlugin";
import { socketConfig, SocketNameType } from "@seocraft/core/src/sockets";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useSelector } from "@xstate/react";
import { get } from "lodash-es";

const { useConnection } = Presets.classic;

const useConnectionSync = (props: { data: Connection }) => {
  const sourceValue = useSelector(props.data?.sourceNode?.actor, (state) =>
    state ? state?.context?.outputs[props.data.sourceOutput] : null,
  );
  const sourceId = props.data?.sourceNode?.actor?.id;
  const targetActorRefId = useSelector(props.data?.targetNode?.actor, (state) =>
    get(
      state,
      ["context", "inputSockets", props.data.targetInput, "x-actor-ref-id"],
      null,
    ),
  );

  const targetValue = useSelector(props.data?.targetNode?.actor, (state) =>
    state ? state?.context?.inputs[props.data.targetInput] : null,
  );

  const inSync = React.useMemo(() => {
    return sourceValue === targetValue || sourceId === targetActorRefId;
  }, [sourceValue, targetValue, sourceId, targetActorRefId]);
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
        <motion.path
          d={path}
          animate={inSync ? "sync" : "inSync"}
          variants={{
            sync: { pathLength: 1, pathSpacing: 0.2 },
            inSync: {
              pathLength: [0, 0.4, 0.8],
              pathSpacing: [0.2, 0.4],
              transition: {
                duration: 0.2,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "loop",
                repeatDelay: 0.1,
              },
            },
          }}
          className={cn(
            "stroke-primary dark:stroke-primary/60 pointer-events-auto fill-none stroke-[5px]",
            sourceConfig &&
              `stroke-${sourceConfig.connection}-400 dark:stroke-${sourceConfig.connection}-400/60`,
          )}
        />
      )}
    </motion.svg>
  );
}
