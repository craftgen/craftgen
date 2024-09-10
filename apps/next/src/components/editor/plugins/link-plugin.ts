import type { RenderAfterEditable } from "@udecode/plate-common";
import type { LinkPlugin } from "@udecode/plate-link";

import { LinkFloatingToolbar } from "@/components/plate-ui/link-floating-toolbar";
import type { MyPlatePlugin, MyValue } from "@/lib/plate/plate-types";

export const linkPlugin: Partial<MyPlatePlugin<LinkPlugin>> = {
  renderAfterEditable: LinkFloatingToolbar as RenderAfterEditable<MyValue>,
};
