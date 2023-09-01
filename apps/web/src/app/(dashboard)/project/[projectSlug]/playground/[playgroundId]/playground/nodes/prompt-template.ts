import { ClassicPreset } from "rete";
import * as Sqrl from "squirrelly";
import { DiContainer } from "../editor";
import { isString, set, get } from "lodash-es";
import { BaseNode, NodeData } from "./base";
import { assign, createMachine, fromPromise } from "xstate";
import { DebugControl } from "../ui/control/control-debug";
import { Socket, stringSocket } from "../sockets";
import { CodeControl } from "../ui/control/control-code";

type Data = {
  value: string;
};

const PromptTemplateNodeMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QAcBOB7AtsgLgWhzGwBsBDQgOgEsJiwBiCdAOzGuYDd0BrNtLXASLIylGnQRVO6AMbkqLANoAGALorViFOlhUcC5lpAAPRACYzAZgoBGZQE5LANktmA7E5tuAHO4A0IACeiD7etpYArN4u9gAsNt4RjgC+yQH82PiEJORs4gxgqBioFCLkAGboqJilGJlCOWK0YJLScvpKahpGyDp6BkamCBbWdo4u7p4+-kGIET4UyjZJlvbuljZOZjap6XWC2WVNdPQyABakzDDdSCC9uh2Gt0Mjtg7Orh5evm4BwcPKZQUNyxexgmxrDzeexOby7O77LLCURsHCBZBSKCnC5XMA3bQPAbPRAw2IUVbeWKwxzRGJ-RBOJxkpxrCLKCIRMzQyyueEZA7I3IUNEYq70YywHBC0jlQioAAUdmUAEp6PykY1UejMfi7n1HoNEN5lGTYpTnFYbJYfFb6QhvDYKKCwW4vJYHCMdmkEQINUc2IVitjLtc1D19UTQENYm4ge83JZYpZfPY3CC7YnTR4IpmzFsbFY+YiGv6KIGqvRUGBmBBCrr7v0WIbhkyKEzlEyEysQTY7Zy3BQIst7GMYTyvXtfSWUWWihWIORSPWI03iQgY3HHAmkym07E7UyzBR7B73k4PTYJz76ocZ1XSBBAowWHlpLxalPb0L74-Wlx2gYGjLoSq5RgyVKLCCZjKDyJoeGaB4Om8axUiO3i+BEsRFp+gqUD+T7liURyVNUH43rhbD4X+sjyJ06hhrcDYGmuMbWGCYLGg4EKTH2oJOhE548majLnnC3rqtO35gA+T7nCGeIMQSjZPGB9omk65pbBs1oOpYdrGkeAlWJhVpmPECTYeRmoUPhjCLsBynNoyEQUBYebOMo25MnpswIFEzICco3gbJ4ebeG4lkCtZtlVjWdaKXqIEqSYDJOC5blMkkCScsFdpmmE0Huh4KHbnEqTesw6C1vAjHFl+hDhklzZ4E4dp4C57GdV19jRJFfozvkjWOSxZh9soR5LEkgLQkyjhUn1kmUCKmJDcxqn2FEbZGR4rhaVydoeE4tixAJLJcrNC31QGc6oKtkYpQg1oufMuleJsPiOH2rpOrtnlcjmbg5pdFE2dJj53aBD0TIOWxslyxnofuvlpvYMNWLEsQwWY8wY+VyRAA */
  id: "prompt-template",
  initial: "idle",
  context: {
    template: "",
    rendered: "",
    variables: [],
    inputs: {},
    error: null,
  },
  types: {
    context: {} as {
      template: string;
      rendered: string;
      variables: string[];
      inputs: Record<string, any[]>;
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
          type: "data";
          inputs: any;
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
      on: {
        change: {
          target: "typing",
          actions: "updateValue",
        },
        render: "idle",
        data: {
          target: "ready",
          actions: assign({
            inputs: ({ event }) => event.inputs,
          }),
        },
      },
    },

    ready: {
      invoke: {
        src: "render",
        input: ({ context }: any) => ({
          // TODO:XSTATE
          template: context.template,
          inputs: context.inputs,
        }),
        onError: {
          target: "error",
          actions: assign({
            error: ({ event }) => ({
              name: event.data.name,
              message: event.data.message,
            }),
          }),
        },
        onDone: {
          actions: assign({
            rendered: ({ event }) => event.output,
          }),
        },
      },
      on: {
        change: "typing",
        data: {
          target: "ready",
          actions: assign({
            inputs: ({ event }) => event.inputs,
          }),
        },
        render: {
          target: "ready",
          actions: assign({
            inputs: ({ event }) => event.inputs,
          }),
          reenter: true,
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
      set(prev, key, get(value[0], key));
    } else {
      set(prev, key, value[0]);
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
    debug: DebugControl;
  }
> {
  constructor(
    di: DiContainer,
    data: NodeData<typeof PromptTemplateNodeMachine>
  ) {
    super("Prompt Template", di, data, PromptTemplateNodeMachine, {
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
    });
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
    const rawTemplate = state.context.variables;

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
      this.addInput(item, new ClassicPreset.Input(stringSocket, item, false));
    }
  }

  execute() {}

  data(inputs: { [key: string]: [string | number] }) {
    console.log(inputs);
    this.actor.send({
      type: "data",
      inputs,
    });
    const state = this.actor.getSnapshot();
    const rendered = renderFunc({
      input: {
        template: state.context.template,
        inputs,
      },
    });
    return {
      value: rendered,
    };
  }

  async serialize(): Promise<Data> {
    const state = this.actor.getSnapshot();
    return {
      value: state.context.rendered,
    };
  }
}
