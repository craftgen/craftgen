import { JSONSchemaDefinition } from "openai/lib/jsonschema.mjs";
import { ClassicPreset } from "rete";

export class BaseControl extends ClassicPreset.Control {
  constructor(
    public minHeight: number,
    defination?: JSONSchemaDefinition,
  ) {
    super();
  }
}
