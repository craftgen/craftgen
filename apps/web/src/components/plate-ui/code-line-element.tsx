"use client";

import React, { forwardRef } from "react";
import { PlateElement, type PlateElementProps } from "@udecode/plate-common";

const CodeLineElement = forwardRef<HTMLDivElement, PlateElementProps>(
  (props, ref) => <PlateElement ref={ref} {...props} />,
);
CodeLineElement.displayName = "CodeLineElement";

export { CodeLineElement };
