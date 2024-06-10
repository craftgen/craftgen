"use client";

import { useEffect, useRef } from "react";
import { createAlignPlugin } from "@udecode/plate-alignment";
import { createAutoformatPlugin } from "@udecode/plate-autoformat";
import {
  createBoldPlugin,
  createCodePlugin,
  createItalicPlugin,
  createStrikethroughPlugin,
  createUnderlinePlugin,
} from "@udecode/plate-basic-marks";
import { createBlockquotePlugin } from "@udecode/plate-block-quote";
import { createExitBreakPlugin } from "@udecode/plate-break";
import { createCaptionPlugin } from "@udecode/plate-caption";
import { createCodeBlockPlugin } from "@udecode/plate-code-block";
import { createComboboxPlugin } from "@udecode/plate-combobox";
import {
  CommentsProvider,
  createCommentsPlugin,
} from "@udecode/plate-comments";
import {
  createPlateEditor,
  Plate,
  PlateProvider,
  replaceNodeChildren,
  usePlateSelectors,
  usePlateStates,
  type PlateEditor,
} from "@udecode/plate-common";
import { createDndPlugin } from "@udecode/plate-dnd";
import { createEmojiPlugin } from "@udecode/plate-emoji";
import {
  createHeadingPlugin,
  ELEMENT_H1,
  ELEMENT_H2,
  ELEMENT_H3,
  ELEMENT_H4,
  ELEMENT_H5,
  ELEMENT_H6,
} from "@udecode/plate-heading";
import { createLinkPlugin } from "@udecode/plate-link";
import {
  createImagePlugin,
  createMediaEmbedPlugin,
  ELEMENT_IMAGE,
  ELEMENT_MEDIA_EMBED,
} from "@udecode/plate-media";
import { createNodeIdPlugin } from "@udecode/plate-node-id";
import {
  createParagraphPlugin,
  ELEMENT_PARAGRAPH,
} from "@udecode/plate-paragraph";
import { createResetNodePlugin } from "@udecode/plate-reset-node";
import { createSelectOnBackspacePlugin } from "@udecode/plate-select";
import { createBlockSelectionPlugin } from "@udecode/plate-selection";
import { createTablePlugin } from "@udecode/plate-table";
import { isEqual } from "lodash-es";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { v4 as uuidv4 } from "uuid";

import { ScrollArea } from "@craftgen/ui/components/scroll-area";

import { createMyPlugins, type MyValue } from "@/lib/plate/plate-types";
import { cn } from "@/lib/utils";

import { CommentsPopover } from "../plate-ui/comments-popover";
import { CursorOverlay } from "../plate-ui/cursor-overlay";
import { FixedToolbar } from "../plate-ui/fixed-toolbar";
import { FixedToolbarButtons } from "../plate-ui/fixed-toolbar-buttons";
import { FloatingToolbar } from "../plate-ui/floating-toolbar";
import { FloatingToolbarButtons } from "../plate-ui/floating-toolbar-buttons";
import { TooltipProvider } from "../plate-ui/tooltip";
import { autoformatRules } from "./autoformatRules";
import { createPlateUI } from "./create-plate-ui";
import { exitBreakPlugin } from "./exit-break-plugin-options";
import { captionPlugin } from "./plugins/caption-plugin";
import { linkPlugin } from "./plugins/link-plugin";
import { resetBlockTypePlugin } from "./reset-node-options";

interface EditorProps {
  id: string;
  initialValue?: MyValue;
  onChange?: (value: any[]) => void;
}

const plugins = createMyPlugins(
  [
    // Elements
    createCaptionPlugin({
      ...captionPlugin,
    }) as any, // TODO: fix type
    createAlignPlugin({
      inject: {
        props: {
          validTypes: [
            ELEMENT_PARAGRAPH,
            ELEMENT_H1,
            ELEMENT_H2,
            ELEMENT_H3,
            ELEMENT_H4,
            ELEMENT_H5,
            ELEMENT_H6,
          ],
        },
      },
    }),
    createEmojiPlugin(),
    createImagePlugin(),
    createMediaEmbedPlugin(),
    createSelectOnBackspacePlugin({
      options: {
        query: {
          allow: [ELEMENT_IMAGE, ELEMENT_MEDIA_EMBED],
        },
      },
    }),
    createTablePlugin({
      options: {
        initialTableWidth: 600,
      },
    }),
    createParagraphPlugin(),
    createBlockquotePlugin(),
    createCodeBlockPlugin(),
    createHeadingPlugin(),

    // Marks
    createBoldPlugin(),
    createItalicPlugin(),
    createUnderlinePlugin(),
    createStrikethroughPlugin(),
    createCodePlugin(),
    createLinkPlugin({
      ...linkPlugin,
    }),

    // Functionality
    createAutoformatPlugin({
      options: {
        rules: autoformatRules as any,
        enableUndoOnDelete: true,
      },
    }),
    createBlockSelectionPlugin(),
    createComboboxPlugin(),
    createNodeIdPlugin({
      options: {
        idCreator: uuidv4,
        reuseId: true,
      },
    }),
    createDndPlugin({ options: { enableScroller: true } }),
    createCommentsPlugin(),
    createResetNodePlugin({
      ...resetBlockTypePlugin,
    }),
    createExitBreakPlugin({
      ...exitBreakPlugin,
    }),
  ],
  {
    components: createPlateUI(undefined, {
      draggable: false,
    }),
  },
);

const EditorStore = ({ val, id }: { val: MyValue; id: string }) => {
  const editor = usePlateSelectors().editor();
  const [value, setValue] = usePlateStates("plate").value();
  useEffect(() => {
    if (isEqual(val, value)) return;
    replaceNodeChildren(editor, {
      at: [],
      nodes: val,
    });
  }, [val]);
  return null;
};

export const createTmpEditor = (): PlateEditor<MyValue> => {
  return createPlateEditor({ plugins });
};

export const Editor: React.FC<EditorProps> = ({
  id,
  initialValue = [],
  onChange = console.log,
}) => {
  const containerRef = useRef(null);

  return (
    <div className="relative flex h-full flex-col @container">
      <TooltipProvider>
        <DndProvider backend={HTML5Backend}>
          <PlateProvider<MyValue>
            plugins={plugins}
            // value={initialValue}
            // id={id}
            initialValue={initialValue}
            onChange={onChange}
          >
            <EditorStore id={id} val={initialValue} />
            <FixedToolbar>
              <FixedToolbarButtons id={id} />
            </FixedToolbar>
            <CommentsProvider
            // users={{
            //   123: {
            //     id: 123,
            //     name: "John Doe",
            //   },
            // }}
            // myUserId={"123"}
            >
              <ScrollArea
                ref={containerRef}
                className={cn(
                  "relative mx-auto flex w-full max-w-[900px] overflow-x-auto",
                  "[&_.slate-start-area-top]:!h-4",
                  "[&_.slate-start-area-left]:!w-[64px] [&_.slate-start-area-right]:!w-[64px]",
                )}
              >
                <Plate<MyValue>
                  editableProps={{
                    placeholder: "Type here...",
                    autoFocus: true,
                    className: cn(
                      "relative max-w-full leading-[1.4] outline-none [&_strong]:font-bold",
                      "!min-h-[600px] max-w-[900px] w-full px-4 md:px-10 @lg:px-[96px] my-10",
                    ),
                  }}
                >
                  <FloatingToolbar>
                    <FloatingToolbarButtons />
                  </FloatingToolbar>
                  <CursorOverlay containerRef={containerRef} />
                </Plate>
              </ScrollArea>
              <CommentsPopover />
            </CommentsProvider>
          </PlateProvider>
        </DndProvider>
      </TooltipProvider>
    </div>
  );
};
