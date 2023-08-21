import React from "react";

import { cn } from "@/lib/utils";

import { Toolbar, ToolbarProps } from "./toolbar";

const FixedToolbar = React.forwardRef<HTMLDivElement, ToolbarProps>(
  ({ className, ...props }: ToolbarProps, ref) => {
    return (
      <Toolbar
        ref={ref}
        className={cn(
          "min-h-[45px] h-auto",
          "supports-backdrop-blur:bg-background/60 sticky top-0 left-0 z-50 w-full justify-between overflow-x-auto  border-b border-b-border bg-background/95 backdrop-blur",
          className
        )}
        {...props}
      />
    );
  }
);
FixedToolbar.displayName = "FixedToolbar";

export { FixedToolbar };
