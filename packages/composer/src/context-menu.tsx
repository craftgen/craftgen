import React, {
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { useKBar, VisualState } from "kbar";

import type { NodeTypes } from "@craftgen/core/types";
import {
  ContextMenu,
  ContextMenuTrigger,
} from "@craftgen/ui/components/context-menu";
import { Icons } from "@craftgen/ui/components/icons";

import { useCraftStore } from "./use-store";

export const ContextMenuProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<any>(null);

  const { query, kbarState } = useKBar((state) => {
    return {
      kbarState: state.visualState === VisualState.showing,
    };
  });

  const setOpenS = (open: boolean) => {
    setOpen(open);
    if (open && !kbarState) {
      query.toggle();
    }
  };

  return (
    <ContextMenu onOpenChange={setOpenS} modal>
      <ContextMenuTrigger ref={ref}>{children}</ContextMenuTrigger>
    </ContextMenu>
  );
};

const NodeMetaInfo = ({ nodeType }: { nodeType: NodeTypes }) => {
  const di = useCraftStore((store) => store.di);
  const nodeMeta = useMemo(
    () =>
      di &&
      Array.from(di.nodeMeta.values()).find(
        (n) => n.nodeType.toString().toLowerCase() === nodeType,
      ),
    [nodeType, di],
  );
  const Icon = useMemo(() => {
    return Icons[nodeMeta?.icon as keyof typeof Icons];
  }, [nodeMeta?.icon]);
  if (!nodeMeta) return null;
  return (
    <div className="p-4">
      <div className="flex w-full items-center justify-center">
        <Icon className="h-20 w-20" />
      </div>
      <h3 className="font-mono text-xl font-bold">{nodeMeta?.label}</h3>
      <p>{nodeMeta?.description}</p>
    </div>
  );
};
