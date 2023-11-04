import React from "react";
import { PortalBody, useComposedRef } from "@udecode/plate-common";
import {
  flip,
  offset,
  useFloatingToolbar,
  useFloatingToolbarState,
} from "@udecode/plate-floating";
import type { FloatingToolbarState } from "@udecode/plate-floating/dist";

import { cn } from "@/lib/utils";

import type { ToolbarProps } from "./toolbar";
import { Toolbar } from "./toolbar";

export interface FloatingToolbarProps extends ToolbarProps {
  state?: FloatingToolbarState;
}

const FloatingToolbar = React.forwardRef<
  React.ElementRef<typeof Toolbar>,
  FloatingToolbarProps
>(({ state, children, ...props }, componentRef) => {
  const floatingToolbarState = useFloatingToolbarState({
    ...state,
    floatingOptions: {
      placement: "top",
      middleware: [
        offset(12),
        flip({
          padding: 12,
          fallbackPlacements: [
            "top-start",
            "top-end",
            "bottom-start",
            "bottom-end",
          ],
        }),
      ],
      ...state?.floatingOptions,
    },
  });

  const {
    ref: floatingRef,
    props: rootProps,
    hidden,
  } = useFloatingToolbar(floatingToolbarState);

  const ref = useComposedRef<HTMLDivElement>(componentRef, floatingRef);

  if (hidden) return null;

  return (
    <PortalBody>
      <Toolbar
        ref={ref}
        className={cn(
          "bg-popover absolute z-50 whitespace-nowrap border px-1 opacity-100 shadow-md",
        )}
        {...rootProps}
        {...props}
      >
        {children}
      </Toolbar>
    </PortalBody>
  );
});
FloatingToolbar.displayName = "FloatingToolbar";

export { FloatingToolbar };
