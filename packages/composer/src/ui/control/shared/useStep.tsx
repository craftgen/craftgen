import { useCallback, useMemo } from "react";

import { JSONSocket } from "@craftgen/core/controls/socket-generator";

export const useStep = (definition: JSONSocket) => {
  const decimalPlaceCount = useCallback((value: number) => {
    if (!isFinite(value)) return 0;
    let e = 1,
      p = 0;
    while (Math.round(value * e) / e !== value) {
      e *= 10;
      p++;
    }
    return p;
  }, []);
  const step = useMemo(() => {
    // if (this.options.step) return this.options.step;
    if (definition.maximum === 1 && definition.minimum === 0) {
      return 0.01;
    }
    if (definition.mininum < 0) {
      return 0.01;
    }
    // Determine the decimal places for min, max, and default
    const minDecimals = decimalPlaceCount(definition.mininum);
    const maxDecimals = decimalPlaceCount(definition.maximum);

    const defaultDecimals =
      definition?.default !== undefined
        ? decimalPlaceCount(Number(definition?.default!))
        : 0;

    // Use the highest decimal count as the step size
    const step = Math.pow(
      10,
      -Math.max(minDecimals, maxDecimals, defaultDecimals),
    );
    return step;
  }, [definition]);
  return step;
};
