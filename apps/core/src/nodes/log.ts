import { merge } from "lodash-es";
import type { SetOptional } from "type-fest";
import { assign, createMachine, fromPromise } from "xstate";

import type { DiContainer } from "../types";
import { BaseNode } from "./base";
import type { ParsedNode } from "./base";

const LogNodeMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QBsD2UB0BLCywGIAlAVQDkBtABgF1FQAHVWLAFy1QDs6QAPRARgDMlDAFZKEygBZBsgEz9pggDQgAnogCcADjHb5Adn0TtmgGwGAvpdVpMAJwCuHDlg5R8ETmGwcAbqgA1j52GE4ublAIbgEAxgCGbJxU1CncjMxJXEi8iFKU-BiUolIGlGaiZfxyUnKqGgj8BlIYmqKC1fxmpaIWzda26GHOru74YPb2qPYY9MiJAGbTALYYoeGjUTGoCVkpaTkZrOzZoHwI+YXFpeWVBTV16ojahVKa70YFBqLaZl0DIFCsVQyzmYBYBB4sBYiR88QWEPsAApFBIAJT4IEgsEQg4MJjHTjcc75TQYORyCraKTabTNTT8fj1RByIwYbSUd6UUxyEqM0Siaw2EAcVAQODcOzpAlZYmIAC0ZmZCEVRUk6o1lCswtCODw0syJzlF0eDSEIn4MjkggMZUpHNKAPWI0iBsJp1yCAeGEU-EqbwFUikZi1yu0ojEoh0trklEEmgKxSdQ2BoLwELdspy53aIgs-ATcgTxTMNuVsbkYnNUnE-H0NX4ycwEym9kzRuziFzGHzheLvTLT0acYwpQqlu6WsEJUFQqAA */
  id: "log",
  context: ({ input }) =>
    merge(
      {
        inputs: {},
        outputs: {},
        error: null,
      },
      input,
    ),
  types: {} as {
    input: {
      inputs: Record<string, any>;
      outputs: Record<string, any>;
      error: any;
    };
    context: {
      inputs: Record<string, any>;
      outputs: Record<string, any>;
      error: any;
    };
    events: {
      type: "RUN";
      inputs: any;
    };
  },
  initial: "idle",
  states: {
    idle: {
      on: {
        RUN: {
          target: "running",
          actions: assign({
            inputs: ({ event }) => event.inputs,
          }),
        },
      },
    },
    running: {
      invoke: {
        src: "run",
        input: ({ context }) => ({
          inputs: context.inputs,
        }),
        onDone: {
          target: "complete",
          actions: assign({
            outputs: ({ event }) => event.output,
          }),
        },
        onError: {
          target: "error",
          actions: assign({
            error: ({ event }) => ({
              name: (event.data as Error).name,
              message: (event.data as Error).message,
            }),
          }),
        },
      },
    },
    complete: {
      type: "final",
      output: ({ context }) => context.outputs,
    },
    error: {},
  },
  output: ({ context }) => context.outputs,
});

export type LogData = ParsedNode<"Log", typeof LogNodeMachine>;
export class Log extends BaseNode<typeof LogNodeMachine> {
  static nodeType = "Log" as const;
  static label = "Log";
  static description = "Log node of the workflow";
  static icon = "bug";

  static parse(params: SetOptional<LogData, "type">): LogData {
    return {
      ...params,
      type: "Log",
    };
  }

  static machines = {
    NodeLog: LogNodeMachine,
  };

  constructor(di: DiContainer, data: LogData) {
    super("Log", di, data, LogNodeMachine, {
      actors: {
        run: fromPromise(async ({ input }) => {
          console.log("LogNodeMachine RUNNING", input);
          return input.inputs;
        }),
      },
    });
  }
}
