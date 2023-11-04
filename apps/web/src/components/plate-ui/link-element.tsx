import React from "react";
import type { PlateElementProps, Value } from "@udecode/plate-common";
import { PlateElement } from "@udecode/plate-common";
import type { TLinkElement} from "@udecode/plate-link";
import { useLink } from "@udecode/plate-link";

import { cn } from "@/lib/utils";

const LinkElement = React.forwardRef<
  React.ElementRef<typeof PlateElement>,
  PlateElementProps<Value, TLinkElement>
>(({ className, children, ...props }, ref) => {
  const { props: linkProps } = useLink({ element: props.element });

  return (
    <PlateElement
      asChild
      ref={ref}
      className={cn("font-medium underline underline-offset-4", className)}
      {...linkProps}
      {...(props as any)}
    >
      <a>{children}</a>
    </PlateElement>
  );
});
LinkElement.displayName = "LinkElement";

export { LinkElement };
