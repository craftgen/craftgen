import { cn } from "@/lib/utils";
import { ActionImpl } from "kbar";
import React from "react";

export const ResultItem = React.forwardRef<
  {} extends React.Ref<HTMLDivElement> ? HTMLDivElement : never,
  { action: ActionImpl; active: boolean }
>(({ action, active }, ref: React.Ref<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        // "flex flex-row justify-between p-2",
        active && "bg-muted-foreground/20 bg-opacity-20 border-l border-l-black"
      )}
      ref={ref}
    >
      <div className="flex gap-2 items-center">
        <div className="p-1 flex items-start justify-center min-w-[3rem]">
          {action.icon && action.icon}
        </div>
        <div className="flex flex-col">
          <span className="text-foreground">{action.name}</span>
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
              className="uppercase bg-opacity-30 bg-muted py-1 px-2 rounded"
            >
              {shortcut}
            </kbd>
          ))}
        </div>
      ) : null}
    </div>
  );
});
