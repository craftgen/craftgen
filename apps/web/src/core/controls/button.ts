import { BaseControl } from "./base";

export class ButtonControl extends BaseControl {
  __type = "ButtonControl";

  constructor(public label: string, public onClick: () => void) {
    super(50);
  }
}
