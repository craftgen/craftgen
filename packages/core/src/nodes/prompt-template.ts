import { get, isString, merge, set } from "lodash-es";
import type { SetOptional } from "type-fest";
import { createMachine, enqueueActions, fromPromise } from "xstate";

import { generateSocket } from "../controls/socket-generator";
import type { MappedType } from "../sockets";
import type { DiContainer } from "../types";
import {
  BaseNode,
  NodeContextFactory,
  type BaseMachineTypes,
  type None,
  type ParsedNode,
} from "./base";

const inputSockets = {
  "x-template": generateSocket({
    name: "template",
    type: "string",
    description: "Template",
    required: true,
    default: "",
    "x-key": "x-template",
    "x-showSocket": false,
    "x-controller": "code",
    format: "expression",
    "x-language": "handlebars",
  }),
};

const PromptTemplateNodeMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QAcBOB7AtsgLgWhzGwBsBDQgOgEsJiwBiCdAOzGuYDd0BrNtLXASLIylGnQRVO6AMbkqLANoAGALorViFOlhUcC5lpAAPRAGYzADgoBGAJw2ALMoDsANgBMby3a8uANCAAnogeHsoU3o7hLpb2zo4uHgC+yYH82PiEJORs4gxgqBioFCLkAGboqJilGJlCOWK0YJLScvpKahpGyDp6BkamCACsysMU7mbKZo42Hj5jHsOBIQiOPhQW9nZmbsqesZaOqel1gtllTXT0MgAWpMww3Uggvbodhi9Do+OT07PzOyLZbBULKCJJOyWZSOMx+KHDNwnV5nLLCUR5Zr0ADKAFEACoAfQAagBBAAyAFVcc9tO8Bl9zGYXJsrMNHKMOR5YQFQQg5o4KMNLF4bHCbG4XBKkWkUQI0Y1MdcAEqUgBytNefQ+g0QPwmbimMzmC2GSxWet2FBFynm80SYpsyIy53RuQoqAArsxmFIoIwWHlpLxavKGpc2F6fX7Wlx2gYNJq3v0WLqRmMDUaAabzXzDR4KL4bJYXC5HI4ofYnbKXQqIx7vb7HvRCsVSqJKtVQ-ULhiG9HHrHZPJOuo1D1tQzQEM4uMgZ5Dco7JLLGYQatDXZrU4wrFpnsZacw733Tggsg-Td7o8wEnJ6nGfyPKWKF5dmbwnZEpZLBaEG5hQNPYXGFDxxTMZ1UXDPszwvZtjFgHB3VIcpCFQAAKGxwQASnoWtoNPc8-TvekH2nRAbEollmUorD1hcOE3EcP84godZEWGOwXH2ZklggmsoJPShWyqK8HieccXmTHVH1o6ipUomES0Y5i8wlQtYScKZlEsNwJX4o8ezdYSilEvEiTJKkaUkukU0+ciEFnQt9jfJcVzXP9xTYsthUREtnzMOxIOPYy2BkAQ6EIMSbxIuy0xsWJCycMZOL00CbD-Fxl1fUtmWGJxdPcFIBJCxUKHCkgwCi8ySQpalYpkhyEusBxnGGVKbHSzzi0LHymIAxEORmYKjLKiqRCqhhVQ1GytVI+yTAoxLWpS5dOpFDK+TCAt-K48EzTsYYGP42VmHQCA4B6QTQonea0zwNw-zwOc7Fet73teo6RtdMr8luuLHzhQU3AOJjRi-XZNtWMwetictdJLZSkmGb66z7KMmygf7GsW-8K2tMZXpmXKnFUjdOs2BL8u8ECnF8VGCMoWC-WxqdcbmKUhSo4sxQdKFMs461JU8VcF3LBmhLYETUFZsjca4mxInZBWmMcQ0QL-TizA07jEkOYVbQl0LyoiybZYWoZoj-ADFeZEUgfcaJLBR1JkiAA */
    id: "prompt-template",
    context: (ctx) =>
      NodeContextFactory(ctx, {
        name: "Prompt Template",
        description: "Template for user prompts",
        inputSockets,
        outputSockets: {
          value: generateSocket({
            name: "value",
            type: "string",
            description: "Result of template",
            required: true,
            "x-showSocket": true,
            "x-key": "value",
          }),
        },
      }),

    // context: ({ input }) =>
    //   merge<typeof input, any>(
    //     {
    //       name: "Prompt Template",
    //       description: "Template for user prompts",
    //       inputs: {
    //         template: "",
    //       },
    //       inputSockets,
    //       outputs: {
    //         value: "",
    //       },
    //       settings: {
    //         variables: [],
    //       },
    //     },
    //     input,
    //   ),
    types: {} as BaseMachineTypes<{
      input: {
        settings: {
          variables: string[];
        };
        outputs?: {
          value: string;
        };
      };
      context: {
        inputs: MappedType<typeof inputSockets>;
        settings: {
          variables: string[];
        };
        outputs: {
          value: string;
        };
      };
      actions: None;
      events: None;
      guards: None;
      actors: None;
    }>,
    initial: "idle",
    entry: enqueueActions(({ enqueue }) => {
      enqueue("initialize");
    }),
    on: {
      ASSIGN_CHILD: {
        actions: enqueueActions(({ enqueue }) => {
          enqueue("assignChild");
        }),
      },
      INITIALIZE: {
        actions: enqueueActions(({ enqueue }) => {
          enqueue("initialize");
        }),
      },
      ADD_SOCKET: {
        actions: "addSocket",
      },
      REMOVE_SOCKET: {
        actions: "removeSocket",
      },
      SET_VALUE: {
        actions: enqueueActions(({ enqueue }) => {
          enqueue("setValue");
        }),
      },
    },
    states: {
      idle: {},
      // complete: {
      //   invoke: {
      //     src: "parse",
      //     input: ({ context }) => ({
      //       template: context.inputs["x-template"],
      //       inputs: context.inputs,
      //     }),
      //     onError: {
      //       target: "error",
      //       actions: ["setError"],
      //     },
      //     onDone: {
      //       actions: assign({
      //         settings: ({ context, event }) => ({
      //           ...context.settings,
      //           variables: event.output.variables,
      //         }),
      //         inputSockets: ({ context, event }) => {
      //           const sockets = event.output.variables
      //             .filter((item: string) => item.length > 0)
      //             .map((item: string) => {
      //               return generateSocket({
      //                 name: item,
      //                 title: item,
      //                 type: "string",
      //                 description: "variable",
      //                 required: true,
      //                 "x-compatible": ["any"],
      //                 "x-key": item,
      //                 "x-showSocket": true,
      //                 "x-isAdvanced": false,
      //               });
      //             })
      //             .reduce((prev: any, curr: any) => {
      //               prev[curr.name] = curr;
      //               return prev;
      //             }, {});
      //           return {
      //             "x-template": context.inputSockets["x-template"],
      //             ...sockets,
      //           };
      //         },
      //         outputs: ({ event }) => ({ value: event.output.rendered }),
      //       }),
      //     },
      //   },
      //   on: {
      //     // change: {
      //     //   target: "typing",
      //     // },
      //     SET_VALUE: {
      //       actions: ["setValue"],
      //       target: "complete",
      //       reenter: true,
      //     },
      //   },
      // },
      // error: {
      //   exit: () => {
      //     assign({
      //       error: null,
      //     });
      //   },
      //   on: {
      //     SET_VALUE: {
      //       target: "complete",
      //       actions: ["setValue"],
      //     },
      //   },
      // },
    },
  },
  // {
  //   actors: {
  //     parse: fromPromise(async ({ input }) => {
  //       let variables: any[] = [];
  //       variables = Sqrl.parse(input.template, {
  //         ...Sqrl.defaultConfig,
  //         useWith: true,
  //       })
  //         .filter((item) => !isString(item))
  //         .map((item) => {
  //           return (item as any).c; // TODO:TYPE
  //         });
  //       try {
  //         const rendered = renderFunc({ input });
  //         return {
  //           variables,
  //           rendered,
  //         };
  //       } catch (e) {
  //         console.log(e);
  //         return {
  //           variables,
  //           rendered: input.template,
  //         };
  //       }
  //     }),
  //   },
  // },
);

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

export type NodePromptTemplateData = ParsedNode<
  "NodePromptTemplate",
  typeof PromptTemplateNodeMachine
>;

export class NodePromptTemplate extends BaseNode<
  typeof PromptTemplateNodeMachine
> {
  static nodeType = "PromptTemplate" as const;
  static label = "Prompt Template";
  static description = "Template for user prompts";
  static icon = "text-select";

  static parse(
    params: SetOptional<NodePromptTemplateData, "type">,
  ): NodePromptTemplateData {
    return {
      ...params,
      type: "NodePromptTemplate",
    };
  }

  static machines = {
    NodePromptTemplate: PromptTemplateNodeMachine,
  };

  constructor(di: DiContainer, data: NodePromptTemplateData) {
    super("NodePromptTemplate", di, data, PromptTemplateNodeMachine, {});
  }
}
