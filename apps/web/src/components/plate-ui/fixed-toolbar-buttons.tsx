import React from "react";
import {
  MARK_BOLD,
  MARK_CODE,
  MARK_ITALIC,
  MARK_STRIKETHROUGH,
  MARK_UNDERLINE,
} from "@udecode/plate-basic-marks";
import { usePlateReadOnly } from "@udecode/plate-common";
import { ELEMENT_IMAGE } from "@udecode/plate-media";

import { Icons } from "@/components/icons";

import { AlignDropdownMenu } from "./align-dropdown-menu";
import { ArticleSaveButton } from "./article-save-button";
import { CommentToolbarButton } from "./comment-toolbar-button";
import { EmojiDropdownMenu } from "./emoji-dropdown-menu";
import { InsertDropdownMenu } from "./insert-dropdown-menu";
import { LinkToolbarButton } from "./link-toolbar-button";
import { MarkToolbarButton } from "./mark-toolbar-button";
import { MediaToolbarButton } from "./media-toolbar-button";
import { ModeDropdownMenu } from "./mode-dropdown-menu";
import { TableDropdownMenu } from "./table-dropdown-menu";
import { ToolbarGroup } from "./toolbar";
import { TurnIntoDropdownMenu } from "./turn-into-dropdown-menu";

export function FixedToolbarButtons({ id }: { id: string }) {
  const readOnly = usePlateReadOnly();

  return (
    <div className="w-full overflow-hidden">
      <div
        className="flex flex-wrap @container"
        style={{
          transform: "translateX(calc(-1px))",
        }}
      >
        {!readOnly && (
          <>
            <ToolbarGroup noSeparator>
              <InsertDropdownMenu />
              <TurnIntoDropdownMenu />
            </ToolbarGroup>

            <ToolbarGroup>
              <MarkToolbarButton tooltip="Bold (⌘+B)" nodeType={MARK_BOLD}>
                <Icons.bold />
              </MarkToolbarButton>
              <MarkToolbarButton tooltip="Italic (⌘+I)" nodeType={MARK_ITALIC}>
                <Icons.italic />
              </MarkToolbarButton>
              <MarkToolbarButton
                tooltip="Underline (⌘+U)"
                nodeType={MARK_UNDERLINE}
              >
                <Icons.underline />
              </MarkToolbarButton>

              <MarkToolbarButton
                tooltip="Strikethrough (⌘+⇧+M)"
                nodeType={MARK_STRIKETHROUGH}
              >
                <Icons.strikethrough />
              </MarkToolbarButton>
              <MarkToolbarButton tooltip="Code (⌘+E)" nodeType={MARK_CODE}>
                <Icons.code />
              </MarkToolbarButton>
              <ToolbarGroup>
                <AlignDropdownMenu />
              </ToolbarGroup>
              <ToolbarGroup>
                <LinkToolbarButton />
                <MediaToolbarButton nodeType={ELEMENT_IMAGE} />
                <TableDropdownMenu />
                <EmojiDropdownMenu />

                {/* <PlaygroundMoreDropdownMenu /> */}
              </ToolbarGroup>
            </ToolbarGroup>
          </>
        )}

        <div className="grow" />

        <ToolbarGroup noSeparator>
          <CommentToolbarButton />
          <ArticleSaveButton id={id} />
          <ModeDropdownMenu />
        </ToolbarGroup>
      </div>
    </div>
  );
}
