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
import { PropsWithChildren, useRef, useState } from "react";
import { useCraftStore } from "./use-store";
import { createNodeInstance } from "./io";
import { NodeTypes, nodes, nodesMeta } from "./types";
import { useHotkeys } from "react-hotkeys-hook";
import { Key } from "ts-key-enum";

export const ContextMenuProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const di = useCraftStore((store) => store.di);
  const playgroundId = useCraftStore((store) => store.workflowId);
  const workflowVersionId = useCraftStore((store) => store.workflowVersionId);
  const projectSlug = useCraftStore((store) => store.projectSlug);
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
    // const node = await createNodeInstance({
    //   di: di!,
    //   type: name,
    //   data: {
    //     ...data,
    //     workflowVersionId,
    //   },
    //   saveToDB: true,
    //   workflowId: playgroundId,
    //   projectSlug: projectSlug,
    // });
    // console.log("context createNode", node);
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

  return (
    <ContextMenu onOpenChange={setOpen} modal>
      <ContextMenuTrigger ref={ref}>{children}</ContextMenuTrigger>
      <CommandDialog open={open} onOpenChange={setOpen} modal={false}>
        <CommandInput placeholder="Type a command or search..." autoFocus />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem onSelect={() => handleAddNode("TextNode")}>
              Text
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Nodes">
            {Object.entries(nodesMeta).map(([key, val]) => {
              const Icon = val.icon;
              return (
                <CommandItem
                  key={key}
                  onSelect={() => handleAddNode(key as NodeTypes)}
                >
                  <Icon className="text-muted-foreground mr-2" />
                  {val.name}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </ContextMenu>
  );
};
