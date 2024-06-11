import React from "react";
import { useOutdentButton } from "@udecode/plate-indent";

import { Icons } from "@craftgen/ui/components/icons";

import { ToolbarButton } from "./toolbar";

export function OutdentToolbarButton() {
  const { props } = useOutdentButton();

  return (
    <ToolbarButton tooltip="Outdent" {...props}>
      <Icons.outdent />
    </ToolbarButton>
  );
}
