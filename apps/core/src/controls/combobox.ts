import { BaseControl } from "./base";

export class ComboboxControl<T extends string, Data> extends BaseControl {
  __type = "combobox";

  constructor(
    public value: T | undefined,
    public placeholder: string,
    public dataKey: string,
    public dataFetch: () => Promise<Data[]>,
    public dataTransform: (data: Data[]) => { key: T; value: string }[],
    public setValue: (value: T) => void
  ) {
    super(55);
  }
}