import { ELEMENT_BLOCKQUOTE } from "@udecode/plate-block-quote";
import {
  ELEMENT_CODE_BLOCK,
  isCodeBlockEmpty,
  isSelectionAtCodeBlockStart,
  unwrapCodeBlock,
} from "@udecode/plate-code-block";
import {
  isBlockAboveEmpty,
  isSelectionAtBlockStart,
} from "@udecode/plate-common";
import { ELEMENT_TODO_LI } from "@udecode/plate-list";
import { ELEMENT_PARAGRAPH } from "@udecode/plate-paragraph";
import type { ResetNodePlugin } from "@udecode/plate-reset-node";

import type { MyPlatePlugin } from "@/lib/plate/plate-types";

const resetBlockTypesCommonRule = {
  types: [ELEMENT_BLOCKQUOTE, ELEMENT_TODO_LI],
  defaultType: ELEMENT_PARAGRAPH,
};

const resetBlockTypesCodeBlockRule = {
  types: [ELEMENT_CODE_BLOCK],
  defaultType: ELEMENT_PARAGRAPH,
  onReset: unwrapCodeBlock,
};

export const resetBlockTypePlugin: Partial<MyPlatePlugin<ResetNodePlugin>> = {
  options: {
    rules: [
      {
        ...resetBlockTypesCommonRule,
        hotkey: "Enter",
        predicate: isBlockAboveEmpty,
      },
      {
        ...resetBlockTypesCommonRule,
        hotkey: "Backspace",
        predicate: isSelectionAtBlockStart,
      },
      {
        ...resetBlockTypesCodeBlockRule,
        hotkey: "Enter",
        predicate: isCodeBlockEmpty,
      },
      {
        ...resetBlockTypesCodeBlockRule,
        hotkey: "Backspace",
        predicate: isSelectionAtCodeBlockStart,
      },
    ],
  },
};
