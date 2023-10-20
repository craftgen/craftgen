import * as Sqrl from "squirrelly";
import { isString, set, get, merge } from "lodash-es";
import { BaseNode, type NodeData } from "./base";
import { assign, createMachine, fromPromise } from "xstate";
import { stringSocket, triggerSocket } from "../sockets";
import { CodeControl } from "../controls/code";
import { match } from "ts-pattern";
import { InputControl } from "../controls/input.control";
import { Input, Output } from "../input-output";
import type { DiContainer } from "../types";

type Data = {
  value: string;
};

const PromptTemplateNodeMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QAcBOB7AtsgLgWhzGwBsBDQgOgEsJiwBiCdAOzGuYDd0BrNtLXASLIylGnQRVO6AMbkqLANoAGALorViFOlhUcC5lpAAPRAGYzADgoBGAJw2ALMoDsANgBMby3a8uANCAAnogeHsoU3o7hLpb2zo4uHgC+yYH82PiEJORs4gxgqBioFCLkAGboqJilGJlCOWK0YJLScvpKahpGyDp6BkamCACsysMU7mbKZo42Hj5jHsOBIQiOPhQW9nZmbsqesZaOqel1gtllTXT0MgAWpMww3Uggvbodhi9Do+OT07PzOyLZbBULKCJJOyWZSOMx+KHDNwnV5nLLCUR5Zr0ADKAFEACoAfQAagBBAAyAFVcc9tO8Bl9zGYXJsrMNHKMOR5YQFQQg5o4KMNLF4bHCbG4XBKkWkUQI0Y1MdcAEqUgBytNefQ+g0QPwmbimMzmC2GSxWet2FBFynm80SYpsyIy53RuQoqAArsxmFIoIwWHlpLxavKGpc2F6fX7Wlx2gYNJq3v0WLqRmMDUaAabzXzDR4KL4bJYXC5HI4ofYnbKXQqIx7vb7HvRCsVSqJKtVQ-ULhiG9HHrHZPJOuo1D1tQzQEM4uMgZ5Dco7JLLGYQatDXZrU4wrFpnsZacw733Tggsg-Td7o8wEnJ6nGfyPKWKF5dmbwnZEpZLBaEG5hQNPYXGFDxxTMZ1UXDPszwvZtjFgHB3VIcpCFQAAKGxwQASnoWtoNPc8-TvekH2nRAbEollmUorD1hcOE3EcP84godZEWGOwXH2ZklggmsoJPShWyqK8HieccXmTHVH1o6ipUomES0Y5i8wlQtYScKZlEsNwJX4o8ezdYSilEvEiTJKkaUkukU0+ciEFnQt9jfJcVzXP9xTYsthUREtnzMOxIOPYy2BkAQ6EIMSbxIuy0xsWJCycMZOL00CbD-Fxl1fUtmWGJxdPcFIBJCxUKHCkgwCi8ySQpalYpkhyEusBxnGGVKbHSzzi0LHymIAxEORmYKjLKiqRCqhhVQ1GytVI+yTAoxLWpS5dOpFDK+TCAt-K48EzTsYYGP42VmHQCA4B6QTQonea0zwNw-zwOc7Fet73teo6RtdMr8luuLHzhQU3AOJjRi-XZNtWMwetictdJLZSkmGb66z7KMmygf7GsW-8K2tMZXpmXKnFUjdOs2BL8u8ECnF8VGCMoWC-WxqdcbmKUhSo4sxQdKFMs461JU8VcF3LBmhLYETUFZsjca4mxInZBWmMcQ0QL-TizA07jEkOYVbQl0LyoiybZYWoZoj-ADFeZEUgfcaJLBR1JkiAA */
  id: "prompt-template",
  initial: "idle",
  context: ({ input }) =>
    merge(
      {
        inputs: {},
        outputs: {},
        settings: {
          template: "",
          variables: [],
        },
        error: null,
      },
      input
    ),
  types: {} as {
    input: {
      settings: {
        template: string;
        variables: string[];
      };
      inputs: Record<string, any>;
      outputs: Record<string, any>;
    };
    context: {
      settings: {
        template: string;
        variables: string[];
      };
      inputs: Record<string, any[]>;
      outputs: Record<string, any>;
      error: {
        name: string;
        message: string;
      } | null;
    };
    events:
      | {
          type: "change";
          value: string;
        }
      | {
          type: "SET_VALUE";
          inputs: Record<string, any[]>;
        }
      | {
          type: "RUN";
          inputs: Record<string, any[]>;
        };
  },
  states: {
    idle: {
      invoke: {
        src: "parse",
        input: ({ context }) => ({
          template: context.settings.template,
          inputs: context.inputs,
        }),
        onError: {
          target: "error",
        },
        onDone: {
          actions: assign({
            settings: ({ context, event }) => ({
              ...context.settings,
              variables: event.output.variables,
            }),
            outputs: ({ event }) => ({ value: event.output.rendered }),
          }),
        },
      },
      on: {
        change: {
          target: "typing",
        },
        SET_VALUE: {
          actions: assign({
            inputs: ({ context, event }) => ({
              ...context.inputs,
              ...event.inputs,
            }),
          }),
          reenter: true,
        },
        RUN: {
          target: "running",
          actions: assign({
            inputs: ({ context, event }) => ({
              ...context.inputs,
              ...event.inputs,
            }),
          }),
        },
      },
    },
    running: {
      after: {
        500: "idle",
      },
      invoke: {
        src: "parse",
        input: ({ context }) => ({
          template: context.settings.template,
          inputs: context.inputs,
        }),
        onError: {
          target: "error",
        },
        onDone: {
          target: "complete",
          actions: assign({
            settings: ({ context, event }) => ({
              ...context.settings,
              variables: event.output.variables,
            }),
            outputs: ({ event }) => ({ value: event.output.rendered }),
          }),
        },
      },
    },
    typing: {
      entry: {
        type: "updateValue",
      },
      after: {
        100: "idle",
      },
      on: {
        change: {
          target: "typing", // self-loop to reset the timer
          actions: "updateValue",
        },
      },
    },
    error: {
      exit: () => {
        assign({
          error: null,
        });
      },
      on: {
        change: {
          target: "typing",
        },
        SET_VALUE: {
          target: "idle",
          actions: assign({
            inputs: ({ context, event }) => ({
              ...context.inputs,
              ...event.inputs,
            }),
          }),
        },
      },
    },
    complete: {
      on: {
        change: "typing",
        SET_VALUE: {
          actions: assign({
            inputs: ({ context, event }) => ({
              ...context.inputs,
              ...event.inputs,
            }),
          }),
          target: "idle",
        },
        RUN: {
          target: "idle",
          actions: assign({
            inputs: ({ context, event }) => ({
              ...context.inputs,
              ...event.inputs,
            }),
          }),
        },
      },
    },
  },
});

const renderFunc = ({
  input,
}: {
  input: {
    inputs: Record<string, any[]>;
    template: string;
  };
}) => {
  const values = Object.entries(input.inputs).reduce((prev, curr) => {
    const [key, value] = curr as [string, any[]];
    if (key.includes(".")) {
      set(prev, key, get(value, key));
    } else {
      set(prev, key, value);
    }
    return prev;
  }, {} as Record<string, string>);
  const rendered = Sqrl.render(input.template, values, {
    useWith: true,
  });
  return rendered;
};

export class PromptTemplate extends BaseNode<typeof PromptTemplateNodeMachine> {
  constructor(
    di: DiContainer,
    data: NodeData<typeof PromptTemplateNodeMachine>
  ) {
    super("PromptTemplate", di, data, PromptTemplateNodeMachine, {
      actions: {
        updateValue: assign({
          settings: ({ event, context }) => {
            return match(event)
              .with({ type: "change" }, ({ value }) => {
                return {
                  ...context.settings,
                  template: value,
                };
              })
              .run();
          },
        }),
      },
      actors: {
        parse: fromPromise(async ({ input }) => {
          let variables: any[] = [];
          // try {
          variables = Sqrl.parse(input.template, {
            ...Sqrl.defaultConfig,
            useWith: true,
          })
            .filter((item) => !isString(item))
            .map((item) => {
              return (item as any).c; // TODO:TYPE
            });
          try {
            const rendered = renderFunc({ input });
            return {
              variables,
              rendered,
            };
          } catch (e) {
            console.log(e);
            return {
              variables,
              rendered: input.template,
            };
          }
        }),
        render: fromPromise(renderFunc),
      },
    });

    let prev = this.actor.getSnapshot();
    this.actor.subscribe((state) => {
      this.process();
      prev = state;
    });
    this.addInput("trigger", new Input(triggerSocket, "Trigger", true));
    this.addOutput("trigger", new Output(triggerSocket, "Trigger"));

    this.addOutput("value", new Output(stringSocket, "Text"));
    const self = this;
    this.addControl(
      "template",
      new CodeControl("handlebars", {
        initial: prev?.context?.settings.template || "",
        theme: "dark",
        change: (value) => {
          self.actor.send({
            type: "change",
            value,
          });
        },
      })
    );

    this.process();
  }

  process() {
    const state = this.actor.getSnapshot();
    console.log("PromptTemplate PROCESS", state);
    const rawTemplate: string[] = state.context.settings.variables;
    for (const item of Object.keys(this.inputs)) {
      if (item === "trigger") continue; // don't remove the trigger socket
      if (rawTemplate.includes(item)) continue;
      const connections = this.di.editor
        .getConnections()
        .filter((c) => c.target === this.id && c.targetInput === item);
      if (connections.length >= 1) continue; // if there's an input that's not in the template keep it.
      this.removeInput(item);
    }

    for (const item of rawTemplate) {
      if (this.hasInput(item)) continue;
      const input = new Input(stringSocket, item, false);
      input.addControl(
        new InputControl(state.context.inputs[item], {
          change: (value) => {
            console.log(value);
            this.actor.send({
              type: "SET_VALUE",
              inputs: {
                [item]: value,
              },
            });
          },
        })
      );
      this.addInput(item, input);
    }
  }

  // async compute(inputs: { [key: string]: [string | number] }) {
  //   console.log("PromptTemplate COMPUTE", inputs);
  //   this.actor.send({
  //     type: "SET_VALUE",
  //     inputs: inputs,
  //   });
  // }

  async serialize(): Promise<Data> {
    const state = this.actor.getSnapshot();
    return {
      value: state.context.rendered,
    };
  }
}
