import React from "react";
import {
  useMediaToolbarButton,
  type ELEMENT_IMAGE,
  type ELEMENT_MEDIA_EMBED,
} from "@udecode/plate-media";

import { Icons } from "@craftgen/ui/components/icons";

import { ToolbarButton } from "./toolbar";

export function MediaToolbarButton({
  nodeType,
}: {
  nodeType?: typeof ELEMENT_IMAGE | typeof ELEMENT_MEDIA_EMBED;
}) {
  const { props } = useMediaToolbarButton({ nodeType });

  return (
    <ToolbarButton {...props}>
      <Icons.image />
    </ToolbarButton>
  );
}
