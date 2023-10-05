import type { MyValue } from "@/lib/plate/plate-types";
import { BaseControl } from "./base";

export type ArticleControlOptions = {
  initial: MyValue;
  change: (value: MyValue) => void;
};

export class ArticleControl extends BaseControl {
  __type = "editor";

  constructor(public value: MyValue, public options: ArticleControlOptions) {
    super(500);
    if (typeof options?.initial !== "undefined") this.value = options.initial;
  }

  setValue(value: MyValue) {
    this.value = value;
    if (this.options?.change) this.options.change(value);
  }
}
