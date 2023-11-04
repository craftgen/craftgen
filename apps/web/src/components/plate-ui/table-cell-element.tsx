import React from "react";
import type { PlateElementProps, Value } from "@udecode/plate-common";
import { PlateElement } from "@udecode/plate-common";
import type {
  TTableCellElement} from "@udecode/plate-table";
import {
  useTableCellElement,
  useTableCellElementResizable,
  useTableCellElementResizableState,
  useTableCellElementState,
} from "@udecode/plate-table";

import { cn } from "@/lib/utils";

import { ResizeHandle } from "./resizable";

export interface TableCellElementProps
  extends PlateElementProps<Value, TTableCellElement> {
  hideBorder?: boolean;
  isHeader?: boolean;
}

const TableCellElement = React.forwardRef<
  React.ElementRef<typeof PlateElement>,
  TableCellElementProps
>(({ children, className, style, hideBorder, isHeader, ...props }, ref) => {
  const { element } = props;

  const {
    colIndex,
    rowIndex,
    readOnly,
    selected,
    hovered,
    hoveredLeft,
    rowSize,
    borders,
    isSelectingCell,
  } = useTableCellElementState();
  const { props: cellProps } = useTableCellElement({ element: props.element });
  const resizableState = useTableCellElementResizableState({
    colIndex,
    rowIndex,
  });
  const { rightProps, bottomProps, leftProps, hiddenLeft } =
    useTableCellElementResizable(resizableState);

  const Cell = isHeader ? "th" : "td";

  return (
    <PlateElement
      asChild
      ref={ref}
      className={cn(
        "bg-background relative overflow-visible border-none p-0",
        hideBorder && "before:border-none",
        element.background ? "bg-[--cellBackground]" : "bg-background",
        !hideBorder &&
          cn(
            isHeader && "text-left [&_>_*]:m-0",
            "before:h-full before:w-full",
            selected && "before:bg-muted before:z-10",
            "before:absolute before:box-border before:select-none before:content-['']",
            borders &&
              cn(
                borders.bottom?.size &&
                  `before:border-b-border before:border-b`,
                borders.right?.size && `before:border-r-border before:border-r`,
                borders.left?.size && `before:border-l-border before:border-l`,
                borders.top?.size && `before:border-t-border before:border-t`,
              ),
          ),
        className,
      )}
      {...cellProps}
      {...props}
      style={
        {
          "--cellBackground": element.background,
          ...style,
        } as React.CSSProperties
      }
    >
      <Cell>
        <div
          className="relative z-20 box-border h-full px-3 py-2"
          style={{
            minHeight: rowSize,
          }}
        >
          {children}
        </div>

        {!isSelectingCell && (
          <div
            className="group absolute top-0 h-full w-full select-none"
            contentEditable={false}
            suppressContentEditableWarning={true}
          >
            {!readOnly && (
              <>
                <ResizeHandle
                  {...rightProps}
                  className="-top-3 right-[-5px] w-[10px]"
                />
                <ResizeHandle
                  {...bottomProps}
                  className="bottom-[-5px] h-[10px]"
                />
                {!hiddenLeft && (
                  <ResizeHandle
                    {...leftProps}
                    className="-top-3 left-[-5px] w-[10px]"
                  />
                )}

                {hovered && (
                  <div
                    className={cn(
                      "bg-ring absolute -top-3 z-30 h-[calc(100%_+_12px)] w-1",
                      "right-[-1.5px]",
                    )}
                  />
                )}
                {hoveredLeft && (
                  <div
                    className={cn(
                      "bg-ring absolute -top-3 z-30 h-[calc(100%_+_12px)] w-1",
                      "left-[-1.5px]",
                    )}
                  />
                )}
              </>
            )}
          </div>
        )}
      </Cell>
    </PlateElement>
  );
});
TableCellElement.displayName = "TableCellElement";

const TableCellHeaderElement = React.forwardRef<
  React.ElementRef<typeof TableCellElement>,
  TableCellElementProps
>((props, ref) => {
  return <TableCellElement ref={ref} {...props} isHeader />;
});
TableCellHeaderElement.displayName = "TableCellHeaderElement";

export { TableCellElement, TableCellHeaderElement };
