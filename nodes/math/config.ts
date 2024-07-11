import { dedent } from "npm:ts-dedent@2.2.0";

import type { CraftgenNodeConfig } from "../base/config.ts";

const config: CraftgenNodeConfig = {
  name: "math",
  description: dedent`
    A tool for evaluating mathematical expressions. Example expressions:
    '1.2 * (2 + 4.5)', '12.7 cm to inch', 'sin(45 deg) ^ 2'.
  `,
  icon: "calculator",
  inputs: {
    run: {
      type: "trigger",
      description: "Run",
    },
    expression: {
      type: "string",
      description: "Expression to evaluate",
    },
  },
  outputs: {
    result: {
      type: "number",
      description: "Result of the evaluation",
    },
    onDone: {
      type: "trigger",
      description: "Done",
    },
  },
};

export default config;
