"use client";

import "./code-block-element.css";

import React, { forwardRef } from "react";
import type { TCodeBlockElement } from "@udecode/plate-code-block";
import { useCodeBlockElementState } from "@udecode/plate-code-block";
import type { PlateElementProps, Value } from "@udecode/plate-common";
import { PlateElement } from "@udecode/plate-common";

import { cn } from "@/lib/utils";

import { CodeBlockCombobox } from "./code-block-combobox";

const CodeBlockElement = forwardRef<
  HTMLDivElement,
  PlateElementProps<Value, TCodeBlockElement>
>(({ className, ...props }, ref) => {
  const { children, element } = props;

  const state = useCodeBlockElementState({ element });

  return (
    <PlateElement
      ref={ref}
      className={cn("relative py-1", state.className, className)}
      {...props}
    >
      <pre className="bg-muted overflow-x-auto rounded-md px-6 py-8 font-mono text-sm leading-[normal] [tab-size:2]">
        <code>{children}</code>
      </pre>

      {state.syntax && (
        <div
          className="absolute right-2 top-2 z-10 select-none"
          contentEditable={false}
        >
          <CodeBlockCombobox />
        </div>
      )}
    </PlateElement>
  );
});
CodeBlockElement.displayName = "CodeBlockElement";

export { CodeBlockElement };
