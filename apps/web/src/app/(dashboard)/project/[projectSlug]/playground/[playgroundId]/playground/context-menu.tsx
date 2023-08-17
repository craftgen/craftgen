import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { PropsWithChildren, useRef, useState } from "react";
import { useCraftStore } from "./store";
import { createNode } from "./io";
import { NodeTypes } from "./types";
import { ContextMenuItem } from "@radix-ui/react-context-menu";
import { useHotkeys } from "react-hotkeys-hook";
import { Key } from "ts-key-enum";

export const ContextMenuProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const di = useCraftStore((store) => store.di);
  const playgroundId = useCraftStore((store) => store.playgroundId);
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
    const node = await createNode({
      di: di!,
      name,
      data,
      saveToDB: true,
      playgroundId: playgroundId,
      projectSlug: projectSlug,
    });
    await di?.editor.addNode(node);
    await di?.area.translate(node.id, {
      x: position.x,
      y: position.y,
    });
    setOpen(false);
  };
  const handleAddNode = async (nodeName: string) => {
    switch (nodeName) {
      case "text":
        curriedCreateNode({ name: "Start", position });
        break;
      default:
        break;
    }
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
            <CommandItem onSelect={() => handleAddNode("text")}>
              Text
            </CommandItem>
            <CommandItem>Search Emoji</CommandItem>
            <CommandItem>Calculator</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem>Profile</CommandItem>
            <CommandItem>Billing</CommandItem>
            <CommandItem>Settings</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </ContextMenu>
  );
};
