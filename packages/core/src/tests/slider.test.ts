import { expect, test } from "bun:test";

interface SliderConfig {
  minimum: number;
  maximum: number;
  default?: number;
}

test("slider step", () => {
  function calculateStep(config: SliderConfig): number {
    const { minimum, maximum, default: defaultValue } = config;

    // Helper function to find the decimal place count
    function decimalPlaceCount(value: number): number {
      if (!isFinite(value)) return 0;
      let e = 1,
        p = 0;
      while (Math.round(value * e) / e !== value) {
        e *= 10;
        p++;
      }
      return p;
    }

    // Determine the decimal places for min, max, and if present, default
    const minDecimals = decimalPlaceCount(minimum);
    const maxDecimals = decimalPlaceCount(maximum);
    const defaultDecimals =
      defaultValue !== undefined ? decimalPlaceCount(defaultValue) : 0;

    // Use the highest decimal count as the step size, but ensure a minimum of 0.01
    const maxDecimalCount = Math.max(minDecimals, maxDecimals, defaultDecimals);
    const step = Math.pow(10, -maxDecimalCount);
    return Math.max(step, 0.01);
  }

  // Example usage
  const topPConfig = { minimum: 0, maximum: 1, default: 0.9 };
  console.log(calculateStep(topPConfig)); // Expected step: 0.01

  const anotherConfig = { minimum: 1, maximum: 9 };
  console.log(calculateStep(anotherConfig)); // Expected step: 1
});
