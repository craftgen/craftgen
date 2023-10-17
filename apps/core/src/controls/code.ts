import { BaseControl } from "./base";

export type CodeControlOptions = {
  initial: string;
  change: (value: string) => void;
  theme?: string;
};

export class CodeControl extends BaseControl {
  __type = "code";
  value?: string;

  constructor(public language: string, public options: CodeControlOptions) {
    super(200);
    if (typeof options?.initial !== "undefined") this.value = options.initial;
  }

  setValue(value: string) {
    this.value = value;
    if (this.options?.change) this.options.change(value);
  }
}
