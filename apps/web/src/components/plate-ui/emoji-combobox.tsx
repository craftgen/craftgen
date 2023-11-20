import React from "react";
import type { ComboboxItemProps } from "@udecode/plate-combobox";
import type { EmojiItemData, TEmojiCombobox } from "@udecode/plate-emoji";
import { KEY_EMOJI, useEmojiComboboxState } from "@udecode/plate-emoji";

import { Combobox } from "./combobox";

export function EmojiComboboxItem({
  item,
}: ComboboxItemProps<EmojiItemData>): JSX.Element {
  const {
    data: { id, emoji },
  } = item;

  return (
    <div>
      {emoji} :{id}:
    </div>
  );
}

export function EmojiCombobox<TData extends EmojiItemData = EmojiItemData>({
  pluginKey = KEY_EMOJI,
  id = pluginKey,
  ...props
}: TEmojiCombobox<TData>) {
  const { trigger, onSelectItem } = useEmojiComboboxState({ pluginKey });

  return (
    <Combobox
      id={id}
      trigger={trigger}
      controlled
      onSelectItem={onSelectItem}
      onRenderItem={EmojiComboboxItem}
      {...props}
    />
  );
}
