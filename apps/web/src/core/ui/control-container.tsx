import { Label } from "@craftgen/ui/components/label";
import { cn } from "@/lib/utils";
import { JSONSocket } from "@seocraft/core/src/controls/socket-generator";
import React from "react";

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
        <p className={cn("text-muted-foreground text-[0.8rem]")}>
          {props.definition?.description}
        </p>
      </div>
    );
  },
);
