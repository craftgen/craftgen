import { ClassicPreset } from "rete";

export type CodeControlOptions = {
  initial: string;
  change: (value: string) => void;
};

export class CodeControl extends ClassicPreset.Control {
  __type = "code";
  value?: string;

  constructor(public language: string, public options: CodeControlOptions) {
    super();
    if (typeof options?.initial !== "undefined") this.value = options.initial;
  }

  setValue(value: string) {
    this.value = value;
    if (this.options?.change) this.options.change(value);
  }
}
