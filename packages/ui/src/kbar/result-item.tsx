import React from "react";
import type { ActionImpl } from "kbar";

import { cn } from "../lib/utils";

export const ResultItem = React.forwardRef<
  {} extends React.Ref<HTMLDivElement> ? HTMLDivElement : never,
  { action: ActionImpl; active: boolean }
>(({ action, active }, ref: React.Ref<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        " relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        active && "rounded  bg-muted-foreground/10 bg-opacity-20",
      )}
      ref={ref}
    >
      <div className="flex items-center gap-2">
        {action.icon && (
          <div className="flex min-w-[2rem] items-start justify-center">
            {action.icon}
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-foreground">{action.name}</span>
          <span className="text-sm text-muted-foreground">
            {action.subtitle}
          </span>
        </div>
      </div>
      {action.shortcut?.length ? (
        <div
          className="ml-auto text-xs tracking-widest text-muted-foreground"
          aria-hidden
        >
          {action.shortcut.map((shortcut) => (
            <kbd
              key={shortcut}
              className="rounded bg-muted bg-opacity-30 px-2 py-1 uppercase"
            >
              {shortcut}
            </kbd>
          ))}
        </div>
      ) : null}
    </div>
  );
});
