import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu";
import { PropsWithChildren, useMemo, useRef, useState } from "react";
import { useCraftStore } from "./use-store";
import { useHotkeys } from "react-hotkeys-hook";
import { Key } from "ts-key-enum";
import { NodeTypes } from "@seocraft/core/src/types";
import { Icons } from "@/components/icons";
import React from "react";
import { cn } from "@/lib/utils";

export const ContextMenuProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const di = useCraftStore((store) => store.di);
  const position = useCraftStore((store) => store.position);
  const [open, setOpen] = useState(false);
  const ref = useRef<any>(null);

  const curriedCreateNode = async ({
    name,
    data,
    position,
  }: {
    name: NodeTypes;
    position: { x: number; y: number };
    data?: any;
  }) => {
    if (!di) return;
    const node = await di?.addNode(name);
    await di?.area?.translate(node.id, {
      x: position.x,
      y: position.y,
    });
    setOpen(false);
  };
  const handleAddNode = async (nodeName: NodeTypes) => {
    curriedCreateNode({ name: nodeName, position });
  };

  useHotkeys(`${Key.Meta}+k`, () => {
    setOpen(true);
  });

  const nodes = useMemo(() => {
    if (!di) return [];
    return Array.from(di?.nodeMeta.values());
  }, [di?.nodeMeta]);
  const [value, setValue] = useState("textnode");

  return (
    <ContextMenu onOpenChange={setOpen} modal>
      <ContextMenuTrigger ref={ref}>{children}</ContextMenuTrigger>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        modal={false}
        commandProps={{
          value,
          onValueChange: (val) => setValue(val || ""),
        }}
      >
        <CommandInput placeholder="Type a command or search..." autoFocus />
        <div className="flex">
          <CommandList className={cn("flex-1", value && "w-1/2")}>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Nodes">
              {nodes.map(({ label, nodeType, icon }) => {
                const Icon = Icons[icon as keyof typeof Icons];
                return (
                  <CommandItem
                    key={nodeType}
                    value={String(nodeType)}
                    onSelect={() => handleAddNode(nodeType as NodeTypes)}
                  >
                    <Icon className="text-muted-foreground mr-2" />
                    {label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
          <div className={cn("p-4 w-0", value && "w-1/2")}>
            {value && <NodeMetaInfo nodeType={value as NodeTypes} />}
          </div>
        </div>
      </CommandDialog>
    </ContextMenu>
  );
};

const NodeMetaInfo = ({ nodeType }: { nodeType: NodeTypes }) => {
  const di = useCraftStore((store) => store.di);
  const nodeMeta = useMemo(
    () =>
      di &&
      Array.from(di.nodeMeta.values()).find(
        (n) => n.nodeType.toString().toLowerCase() === nodeType
      ),
    [nodeType, di]
  );
  const Icon = useMemo(() => {
    return Icons[nodeMeta?.icon as keyof typeof Icons];
  }, [nodeMeta?.icon]);
  if (!nodeMeta) return null;
  return (
    <div className="p-4">
      <div className="flex items-center w-full justify-center">
        <Icon className="w-20 h-20" />
      </div>
      <h3 className="font-bold font-mono text-xl">{nodeMeta?.label}</h3>
      <p>{nodeMeta?.description}</p>
    </div>
  );
};
