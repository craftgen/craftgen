import { BaseControl } from "./base";

export type ButtonControlOptions = {
  disabled?: boolean;
};

export class ButtonControl extends BaseControl {
  __type = "ButtonControl";

  constructor(
    public label: string,
    public onClick: () => void,
    public options?: ButtonControlOptions,
  ) {
    super(50);
  }
}
