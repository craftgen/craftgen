import { ClassicPreset } from "rete";
import * as Sqrl from "squirrelly";
import { DiContainer } from "../editor";
import { isString, set, get } from "lodash-es";
import { BaseNode, NodeData } from "./base";
import { assign, createMachine, fromPromise } from "xstate";
import { Socket, stringSocket } from "../sockets";
import { CodeControl } from "../controls/code";

type Data = {
  value: string;
};

const PromptTemplateNodeMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QAcBOB7AtsgLgWhzGwBsBDQgOgEsJiwBiCdAOzGuYDd0BrNtLXASLIylGnQRVO6AMbkqLANoAGALorViFOlhUcC5lpAAPRACYzAZgoBGZQE5LANktmA7E5tuAHO4A0IACeiD7etpYArN4u9gAsNt4RjgC+yQH82PiEJORs4gxgqBioFCLkAGboqJilGJlCOWK0YJLScvpKahpGyDp6BkamCBbWdo4u7p4+-kGIET4UyjZJlvbuljZOZjap6XWC2WVNdPQyABakzDDdSCC9uh2Gt0Mjtg7Orh5evm4BwcPKZQUNyxexgmxrDzeexOby7O77LLCURsHCBZBSKCnC5XMA3bQPAbPRAw2IUVbeWKwxzRGJ-RBOJxkpxrCLKCIRMzQyyueEZA7I3IUNEYq70YywHBC0jlQioAAUdmUAEp6PykY1UejMfi7n1HoNEN5lGTYpTnFYbJYfFb6QhvDYKKCwW4vJYHCMdmkEQINUc2IVitjLtc1D19UTQENYm4ge83JZYpZfPY3CC7YnTR4IpmzFsbFY+YiGv6KIGqvRUGBmBBCrr7v0WIbhkyKEzlEyEysQTY7Zy3BQIst7GMYTyvXtfSWUWWihWIORSPWI03iQgY3HHAmkym07E7UyzBR7B73k4PTYJz76ocZ1XSBBAowWHlpLxalPb0L74-Wlx2gYGjLoSq5RgyVKLCCZjKDyJoeGaB4Om8axUiO3i+BEsRFp+gqUD+T7liURyVNUH43rhbD4X+sjyJ06hhrcDYGmuMbWGCYLGg4EKTH2oJOhE548majLnnC3rqtO35gA+T7nCGeIMQSjZPGB9omk65pbBs1oOpYdrGkeAlWJhVpmPECTYeRmoUPhjCLsBynNoyEQUBYebOMo25MnpswIFEzICco3gbJ4ebeG4lkCtZtlVjWdaKXqIEqSYDJOC5blMkkCScsFdpmmE0Huh4KHbnEqTesw6C1vAjHFl+hDhklzZ4E4dp4C57GdV19jRJFfozvkjWOSxZh9soR5LEkgLQkyjhUn1kmUCKmJDcxqn2FEbZGR4rhaVydoeE4tixAJLJcrNC31QGc6oKtkYpQg1oufMuleJsPiOH2rpOrtnlcjmbg5pdFE2dJj53aBD0TIOWxslyxnofuvlpvYMNWLEsQwWY8wY+VyRAA */
  id: "prompt-template",
  initial: "idle",
  context: {
    template: "",
    variables: [],
    inputs: {},
    outputs: {},
    error: null,
  },
  types: {
    context: {} as {
      template: string;
      variables: string[];
      inputs: Record<string, any[]>;
      outputs: Record<string, any>;
      error: {
        name: string;
        message: string;
      } | null;
    },
    events: {} as
      | {
          type: "change";
          value: string;
        }
      | {
          type: "render";
          inputs: any;
        }
      | {
          type: "SET_VALUE";
          inputs: Record<string, any[]>;
        },
  },
  states: {
    idle: {
      invoke: {
        src: "parse",
        input: ({ context }: any) => ({ value: context.template }), //TODO:XSTATE
        onError: {
          target: "error",
        },
        onDone: {
          target: "ready",
          actions: assign({
            variables: ({ event }) => event.output,
          }),
        },
      },
      on: {
        change: {
          target: "typing",
          actions: "updateValue",
        },
        SET_VALUE: {
          actions: assign({
            inputs: ({ context, event }) => ({
              ...context.inputs,
              ...event.inputs,
            }),
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
    ready: {
      on: {
        change: "typing",
        render: {
          target: "running",
          actions: assign({
            inputs: ({ context, event }) => ({
              ...context.inputs,
              ...event.inputs,
            }),
          }),
        },
        SET_VALUE: {
          actions: assign({
            inputs: ({ context, event }) => ({
              ...context.inputs,
              ...event.inputs,
            }),
          }),
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
          actions: "updateValue",
        },
        render: {
          target: "running",
          actions: assign({
            inputs: ({ context, event }) => ({
              ...context.inputs,
              ...event.inputs,
            }),
          }),
        },
        SET_VALUE: {
          target: "ready",
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
      invoke: {
        src: "render",
        input: ({ context }) => ({
          template: context.template,
          inputs: context.inputs,
        }),
        onError: {
          target: "error",
          actions: assign({
            error: ({ event }) => ({
              name: (event.data as Error).name,
              message: (event.data as Error).message,
            }),
          }),
        },
        onDone: {
          target: "ready",
          actions: assign({
            outputs: ({ event }) => ({ value: event.output }),
          }),
        },
      },
    },
  },
});

const renderFunc = async ({
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

export class PromptTemplate extends BaseNode<
  typeof PromptTemplateNodeMachine,
  {
    [key: string]: Socket;
  },
  { value: Socket },
  {
    template: CodeControl;
  }
> {
  constructor(
    di: DiContainer,
    data: NodeData<typeof PromptTemplateNodeMachine>
  ) {
    super(
      "PromptTemplate",
      "Prompt Template",
      di,
      data,
      PromptTemplateNodeMachine,
      {
        actions: {
          updateValue: assign({
            template: ({ event }: any) => event.value, // TODO:
          }),
        },
        actors: {
          parse: fromPromise(async ({ input }) => {
            let rawTemplate: any[] = [];
            // try {
            rawTemplate = Sqrl.parse(input.value, {
              ...Sqrl.defaultConfig,
              useWith: true,
            })
              .filter((item) => !isString(item))
              .map((item) => {
                return (item as any).c; // TODO:TYPE
              });
            return rawTemplate;
          }),
          render: fromPromise(renderFunc),
        },
      }
    );
    this.actor.subscribe((state) => {
      this.process();
    });
    this.addOutput("value", new ClassicPreset.Output(stringSocket, "Text"));
    const self = this;
    this.addControl(
      "template",
      new CodeControl("handlebars", {
        initial: data.state?.context?.template || "",
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
    const rawTemplate: string[] = state.context.variables;
    for (const item of Object.keys(this.inputs)) {
      if (rawTemplate.includes(item)) continue;
      const connections = this.di.editor
        .getConnections()
        .filter((c) => c.target === this.id && c.targetInput === item);
      if (connections.length >= 1) continue; // if there's an input that's not in the template keep it.
      this.removeInput(item);
    }

    for (const item of rawTemplate) {
      if (this.hasInput(item)) continue;
      const input = new ClassicPreset.Input(stringSocket, item, false);
      input.addControl(
        new ClassicPreset.InputControl("text", {
          initial: state.context.inputs[item] || "",
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

  execute() {}

  async data(inputs: { [key: string]: [string | number] }) {
    this.actor.send({
      type: "render",
      inputs,
    });
    let state = this.actor.getSnapshot();
    const subs = this.actor.subscribe((newState) => {
      state = newState;
      console.log("state", newState, inputs);
    });
    while (state.matches("running")) {
      console.log("waiting for complete");
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    subs.unsubscribe();
    return state.context.outputs;
  }

  async serialize(): Promise<Data> {
    const state = this.actor.getSnapshot();
    return {
      value: state.context.rendered,
    };
  }
}
