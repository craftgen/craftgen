import { makeObservable, observable, reaction } from "mobx";
import { Actor } from "xstate";

import { ThreadMachine } from "../nodes/thread";
import { BaseControl } from "./base";

export type ThreadControlOptions = {};

export class ThreadControl extends BaseControl {
  __type = "openai-thread";

  constructor(
    public actor: Actor<typeof ThreadMachine>,
    public options: ThreadControlOptions,
  ) {
    super(50);
  }
}
