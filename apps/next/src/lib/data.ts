import type { DeltaType } from "@tremor/react";

export const calculateDeltaType = (
  current: number,
  previous: number,
): DeltaType => {
  const delta = current - previous;
  // const sign = delta > 0 ? "+" : "";
  const percentage = Math.round((delta / previous) * 100);
  switch (true) {
    case delta === 0:
      return "unchanged";
    case percentage > 10:
      return "increase";
    case percentage < -10:
      return "decrease";
    case percentage > 0:
      return "moderateIncrease";
    case percentage < 0:
      return "moderateDecrease";
    default:
      return "unchanged";
  }
};
