// "use client";

import React, { forwardRef, useCallback, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import useResizeObserver from "use-resize-observer";

import { cn } from "../lib/utils";
import {
  CollapseButton,
  File,
  Folder,
  Tree,
  TreeViewElement,
} from "./tree-view-api";

// TODO: Add the ability to add custom icons

interface TreeViewComponentProps extends React.HTMLAttributes<HTMLDivElement> {}

type TreeViewProps = {
  initialSelectedId?: string;
  elements: TreeViewElement[];
  indicator?: boolean;
} & (
  | {
      initialExpendedItems?: string[];
      expandAll?: false;
    }
  | {
      initialExpendedItems?: undefined;
      expandAll: true;
    }
) &
  TreeViewComponentProps;

export const TreeView = ({
  elements,
  className,
  initialSelectedId,
  initialExpendedItems,
  expandAll,
  indicator = false,
}: TreeViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { getVirtualItems, getTotalSize } = useVirtualizer({
    count: elements.length,
    getScrollElement: () => containerRef.current,
    estimateSize: useCallback(() => 40, []),
    overscan: 5,
  });

  const { height = getTotalSize(), width } = useResizeObserver({
    ref: containerRef,
  });
  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full overflow-hidden rounded-md py-1",
        className,
      )}
    >
      <Tree
        initialSelectedId={initialSelectedId}
        initialExpendedItems={initialExpendedItems}
        elements={elements}
        style={{ height, width }}
        className="h-full w-full overflow-y-auto"
      >
        {getVirtualItems().map((element) => (
          <TreeItem
            aria-label="Root"
            key={element.key}
            elements={[elements[element.index]]}
            indicator={indicator}
          />
        ))}
        <CollapseButton elements={elements} expandAll={expandAll}>
          <span>Expand All</span>
        </CollapseButton>
      </Tree>
    </div>
  );
};

TreeView.displayName = "TreeView";

export const TreeItem = forwardRef<
  HTMLUListElement,
  {
    elements?: TreeViewElement[];
    indicator?: boolean;
  } & React.HTMLAttributes<HTMLUListElement>
>(({ className, elements, indicator, ...props }, ref) => {
  return (
    <ul ref={ref} className="w-full space-y-1 " {...props}>
      {elements &&
        elements.map((element) => (
          <li key={element.id} className="w-full">
            {element.children && element.children?.length > 0 ? (
              <Folder
                element={element.name}
                value={element.id}
                isSelectable={element.isSelectable}
              >
                <TreeItem
                  key={element.id}
                  aria-label={`folder ${element.name}`}
                  elements={element.children}
                  indicator={indicator}
                />
              </Folder>
            ) : (
              <File
                value={element.id}
                aria-label={`File ${element.name}`}
                key={element.id}
                isSelectable={element.isSelectable}
              >
                <span>{element?.name}</span>
              </File>
            )}
          </li>
        ))}
    </ul>
  );
});

TreeItem.displayName = "TreeItem";
