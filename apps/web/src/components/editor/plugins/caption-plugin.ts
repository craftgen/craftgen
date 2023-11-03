import { CaptionPlugin } from "@udecode/plate-caption";
import { ELEMENT_IMAGE, ELEMENT_MEDIA_EMBED } from "@udecode/plate-media";

import { MyPlatePlugin } from "@/lib/plate/plate-types";

export const captionPlugin: Partial<MyPlatePlugin<CaptionPlugin>> = {
  options: {
    pluginKeys: [ELEMENT_IMAGE, ELEMENT_MEDIA_EMBED],
  },
};
