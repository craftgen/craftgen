import React from "react";
import type { ActionImpl } from "kbar";

import { cn } from "@/lib/utils";

export const ResultItem = React.forwardRef<
  {} extends React.Ref<HTMLDivElement> ? HTMLDivElement : never,
  { action: ActionImpl; active: boolean }
>(({ action, active }, ref: React.Ref<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        "aria-selected:bg-accent aria-selected:text-accent-foreground relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        // "flex flex-row justify-between p-2",
        active &&
          "bg-muted-foreground/20 border-l border-l-black bg-opacity-20",
      )}
      ref={ref}
    >
      <div className="flex items-center gap-2">
        <div className="flex min-w-[3rem] items-start justify-center p-1">
          {action.icon && action.icon}
        </div>
        <div className="flex flex-col">
          <span className="text-foreground">{action.name}</span>
          <span className="text-muted-foreground text-sm">
            {action.subtitle}
          </span>
        </div>
      </div>
      {action.shortcut?.length ? (
        <div
          className="text-muted-foreground ml-auto text-xs tracking-widest"
          aria-hidden
        >
          {action.shortcut.map((shortcut) => (
            <kbd
              key={shortcut}
              className="bg-muted rounded bg-opacity-30 px-2 py-1 uppercase"
            >
              {shortcut}
            </kbd>
          ))}
        </div>
      ) : null}
    </div>
  );
});
