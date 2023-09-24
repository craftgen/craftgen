import { ClassicPreset } from "rete";

export class DataSourceControl<T> extends ClassicPreset.Control {
  constructor(public datasourceId: string) {
    super();
  }
}
