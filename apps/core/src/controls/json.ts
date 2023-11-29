import { JSONSchemaDefinition } from "openai/lib/jsonschema.mjs";

import { BaseControl } from "./base";

export type JsonControlOptions = {
  change: (v: any) => void;
};

export class JsonControl extends BaseControl {
  __type = "json";

  public value: any;

  constructor(
    public observableSource: () => any, // Function that returns the observable value
    public options: JsonControlOptions,
    public readonly definition?: JSONSchemaDefinition,
  ) {
    super(50);

    const initialValue = observableSource();
    this.value = initialValue;
  }
}
