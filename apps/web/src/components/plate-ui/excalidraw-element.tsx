import React from "react";
import {
  PlateElement,
  type PlateElementProps,
  type Value,
} from "@udecode/plate-common";
import {
  useExcalidrawElement,
  type TExcalidrawElement,
} from "@udecode/plate-excalidraw";

export function ExcalidrawElement({
  nodeProps,
  ...props
}: PlateElementProps<Value, TExcalidrawElement>) {
  const { children, element } = props;

  const { Excalidraw, excalidrawProps } = useExcalidrawElement({
    element,
  });

  return (
    <PlateElement {...props}>
      <div contentEditable={false}>
        <div className="h-[600px]">
          {Excalidraw && (
            <Excalidraw {...nodeProps} {...(excalidrawProps as any)} />
          )}
        </div>
      </div>
      {children}
    </PlateElement>
  );
}
