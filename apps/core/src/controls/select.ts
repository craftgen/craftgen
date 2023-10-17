import { BaseControl } from "./base";
export type SelectControlOptions<T extends string> = {
  change: (value: T) => void;
  disabled?: boolean;
  placeholder: string;
  values: { key: T; value: string }[];
};

export class SelectControl<T extends string> extends BaseControl {
  __type = "select";

  constructor(
    public value: T | undefined,
    public options: SelectControlOptions<T>
  ) {
    super(55);
    this.options.disabled = this.options.disabled ?? false;
  }

  setValue(value: T) {
    this.value = value;
    if (this.options.change) this.options.change(value);
  }
}
