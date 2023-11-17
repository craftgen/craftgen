import { BaseControl } from "./base";

export class DateControl extends BaseControl {
  __type = "date";
  public value: Date;

  constructor(
    public observableSource: () => Date, // Function that returns the observable value
    public options: any,
  ) {
    super(50);

    this.value = observableSource(); // Set the initial value
  }
}
