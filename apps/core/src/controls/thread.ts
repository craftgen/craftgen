import { makeObservable, observable, reaction } from "mobx";
import { Actor } from "xstate";

import { OpenAIThreadMachine } from "../nodes/openai/thread";
import { BaseControl } from "./base";

export type ThreadControlOptions = {};

export class ThreadControl extends BaseControl {
  __type = "thread";

  public threadId: string;

  constructor(
    public threadIdObservable: () => string, // Function that returns the observable value
    public actor: Actor<typeof OpenAIThreadMachine>,
    public options: ThreadControlOptions,
  ) {
    super(50);

    this.threadId = threadIdObservable(); // Set the initial value
    makeObservable(this, {
      threadId: observable.ref,
    });
    reaction(
      () => this.threadIdObservable(),
      (newValue) => {
        if (newValue !== this.threadId) {
          console.log(
            "reaction in select controller value is not matching",
            newValue,
          );
          this.threadId = newValue;
        }
      },
    );
  }
}
