import React from "react";

import { JSONSocket } from "@craftgen/core/controls/socket-generator";
import { Label } from "@craftgen/ui/components/label";
import { cn } from "@craftgen/ui/lib/utils";

export const ControlContainer = React.memo(
  (props: {
    id: string;
    definition: JSONSocket;
    children: React.ReactNode;
  }) => {
    return (
      <div className="space-y-1">
        <Label htmlFor={props.id}>
          {props.definition?.title || props.definition?.name}
        </Label>
        {props.children}
        <p className={cn("text-[0.8rem] text-muted-foreground")}>
          {props.definition?.description}
        </p>
      </div>
    );
  },
);
