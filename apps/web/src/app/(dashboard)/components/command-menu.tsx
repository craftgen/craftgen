"use client";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useState, useEffect } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Key } from "ts-key-enum";

export function CommandMenu() {
  const [open, setOpen] = useState(false);

  useHotkeys(`${Key.Meta}+k`, (e) => {
    e.preventDefault();
    setOpen((open) => !open);
  });

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>Articles</CommandItem>
          <CommandItem>Data Sources</CommandItem>
          <CommandItem>Playground</CommandItem>
        </CommandGroup>
        <CommandGroup heading="Projects">
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
