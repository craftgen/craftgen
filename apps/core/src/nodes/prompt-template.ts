import { get, isString, merge, set } from "lodash-es";
import * as Sqrl from "squirrelly";
import { match } from "ts-pattern";
import { SetOptional } from "type-fest";
import { assign, createMachine, fromPromise } from "xstate";

import { CodeControl } from "../controls/code";
import { Input, Output } from "../input-output";
import { triggerSocket } from "../sockets";
import type { DiContainer } from "../types";
import { BaseMachineTypes, BaseNode, type ParsedNode } from "./base";

const PromptTemplateNodeMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QAcBOB7AtsgLgWhzGwBsBDQgOgEsJiwBiCdAOzGuYDd0BrNtLXASLIylGnQRVO6AMbkqLANoAGALorViFOlhUcC5lpAAPRAGYzADgoBGAJw2ALMoDsANgBMby3a8uANCAAnogeHsoU3o7hLpb2zo4uHgC+yYH82PiEJORs4gxgqBioFCLkAGboqJilGJlCOWK0YJLScvpKahpGyDp6BkamCACsysMU7mbKZo42Hj5jHsOBIQiOPhQW9nZmbsqesZaOqel1gtllTXT0MgAWpMww3Uggvbodhi9Do+OT07PzOyLZbBULKCJJOyWZSOMx+KHDNwnV5nLLCUR5Zr0ADKAFEACoAfQAagBBAAyAFVcc9tO8Bl9zGYXJsrMNHKMOR5YQFQQg5o4KMNLF4bHCbG4XBKkWkUQI0Y1MdcAEqUgBytNefQ+g0QPwmbimMzmC2GSxWet2FBFynm80SYpsyIy53RuQoqAArsxmFIoIwWHlpLxavKGpc2F6fX7Wlx2gYNJq3v0WLqRmMDUaAabzXzDR4KL4bJYXC5HI4ofYnbKXQqIx7vb7HvRCsVSqJKtVQ-ULhiG9HHrHZPJOuo1D1tQzQEM4uMgZ5Dco7JLLGYQatDXZrU4wrFpnsZacw733Tggsg-Td7o8wEnJ6nGfyPKWKF5dmbwnZEpZLBaEG5hQNPYXGFDxxTMZ1UXDPszwvZtjFgHB3VIcpCFQAAKGxwQASnoWtoNPc8-TvekH2nRAbEollmUorD1hcOE3EcP84godZEWGOwXH2ZklggmsoJPShWyqK8HieccXmTHVH1o6ipUomES0Y5i8wlQtYScKZlEsNwJX4o8ezdYSilEvEiTJKkaUkukU0+ciEFnQt9jfJcVzXP9xTYsthUREtnzMOxIOPYy2BkAQ6EIMSbxIuy0xsWJCycMZOL00CbD-Fxl1fUtmWGJxdPcFIBJCxUKHCkgwCi8ySQpalYpkhyEusBxnGGVKbHSzzi0LHymIAxEORmYKjLKiqRCqhhVQ1GytVI+yTAoxLWpS5dOpFDK+TCAt-K48EzTsYYGP42VmHQCA4B6QTQonea0zwNw-zwOc7Fet73teo6RtdMr8luuLHzhQU3AOJjRi-XZNtWMwetictdJLZSkmGb66z7KMmygf7GsW-8K2tMZXpmXKnFUjdOs2BL8u8ECnF8VGCMoWC-WxqdcbmKUhSo4sxQdKFMs461JU8VcF3LBmhLYETUFZsjca4mxInZBWmMcQ0QL-TizA07jEkOYVbQl0LyoiybZYWoZoj-ADFeZEUgfcaJLBR1JkiAA */
  id: "prompt-template",
  initial: "idle",
  context: ({ input }) =>
    merge(
      {
        inputs: {},
        inputSockets: [],
        outputs: {
          value: "",
        },
        outputSockets: [
          {
            name: "value",
            type: "string",
            description: "Result of template",
            required: true,
          },
        ],
        settings: {
          template: "",
          variables: [],
        },
        error: null,
      },
      input,
    ),
  types: {} as BaseMachineTypes<{
    input: {
      settings: {
        template: string;
        variables: string[];
      };
      outputs?: {
        value: string;
      };
    };
    context: {
      settings: {
        template: string;
        variables: string[];
      };
      outputs: {
        value: string;
      };
    };
    events: {
      type: "change";
      value: string;
    };
    actions: {
      type: "updateValue";
      params?: {
        value: string;
      };
    };
    actors: any;
  }>,
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
            inputSockets: ({ context, event }) => {
              const sockets = event.output.variables.map((item: string) => {
                return {
                  name: item,
                  type: "string",
                  description: "",
                  required: true,
                };
              });
              return sockets;
            },
            outputs: ({ event }) => ({ value: event.output.rendered }),
          }),
        },
      },
      on: {
        change: {
          target: "typing",
        },
        SET_VALUE: {
          actions: ["setValue"],
          target: "idle",
          reenter: true,
        },
        RUN: {
          target: "running",
          actions: ["setValue"],
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
          actions: ["setValue"],
        },
      },
    },
    complete: {
      type: "final",
      output: ({ context }) => context.outputs,
      on: {
        change: "typing",
        SET_VALUE: {
          actions: ["setValue"],
          target: "idle",
        },
        RUN: {
          target: "idle",
          actions: ["setValue"],
        },
      },
    },
  },
  output: ({ context }) => context.outputs,
});

const renderFunc = ({
  input,
}: {
  input: {
    inputs: Record<string, any[]>;
    template: string;
  };
}) => {
  const sanitizedInputs = Object.entries(input.inputs).reduce(
    (prev, [key, value]) => {
      prev[key] = Array.isArray(value) ? value[0] : value;
      return prev;
    },
    {} as Record<string, any>,
  );
  const values = Object.entries(sanitizedInputs).reduce(
    (prev, curr) => {
      const [key, value] = curr as [string, any[]];
      if (key.includes(".")) {
        set(prev, key, get(value, key));
      } else {
        set(prev, key, value);
      }
      return prev;
    },
    {} as Record<string, string>,
  );
  const rendered = Sqrl.render(input.template, values, {
    useWith: true,
    // autoTrim: ["nl"],
  });
  return rendered;
};

export type PromptTemplateNode = ParsedNode<
  "PromptTemplate",
  typeof PromptTemplateNodeMachine
>;

export class PromptTemplate extends BaseNode<typeof PromptTemplateNodeMachine> {
  static nodeType = "PromptTemplate" as const;
  static label = "Prompt Template";
  static description = "Template for user prompts";
  static icon = "text-select";

  static parse(
    params: SetOptional<PromptTemplateNode, "type">,
  ): PromptTemplateNode {
    return {
      ...params,
      type: "PromptTemplate",
    };
  }

  constructor(di: DiContainer, data: PromptTemplateNode) {
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
      },
    });

    let prev = this.actor.getSnapshot();
    this.addInput("trigger", new Input(triggerSocket, "Trigger", true));
    this.addOutput("trigger", new Output(triggerSocket, "Trigger"));
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
      }),
    );
  }
}
