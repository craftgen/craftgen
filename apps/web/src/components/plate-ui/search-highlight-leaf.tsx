import React from "react";
import type { PlateLeafProps } from "@udecode/plate-common";
import { PlateLeaf } from "@udecode/plate-common";

import { cn } from "@/lib/utils";

export function SearchHighlightLeaf({ className, ...props }: PlateLeafProps) {
  return <PlateLeaf className={cn("bg-yellow-100", className)} {...props} />;
}
