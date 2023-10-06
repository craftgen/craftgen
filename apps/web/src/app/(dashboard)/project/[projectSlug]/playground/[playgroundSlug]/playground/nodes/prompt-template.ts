import { ClassicPreset } from "rete";
import * as Sqrl from "squirrelly";
import { DiContainer } from "../editor";
import { isString, set, get, isEqual, merge } from "lodash-es";
import { BaseNode, NodeData } from "./base";
import { assign, createMachine, fromPromise } from "xstate";
import { Socket, stringSocket } from "../sockets";
import { CodeControl } from "../controls/code";
import { match } from "ts-pattern";
import { InputControl } from "../controls/input.control";

type Data = {
  value: string;
};

const PromptTemplateNodeMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QAcBOB7AtsgLgWhzGwBsBDQgOgEsJiwBiCdAOzGuYDd0BrNtLXASLIylGnQRVO6AMbkqLANoAGALorViFOlhUcC5lpAAPRACYArAA4KARmXKzAditmALADYPTywBoQAJ6IFo4UAJxObmHKAMxhblFmHrYAvin+-Nj4hCTkbOIMYKgYqBQi5ABm6KiYZRhZQrlitGCS0nL6SmoaRsg6egZGpgiWNvaOLu5ePhb+QQgxFmEUMVZRVla2nsreXmkZ9YI55c109DIAFqTMMD1IIH26nYb3w6N2Ds6unt5+geYOCg+MKuCy2DzRMxWRb7B6HbLCUT5Fr0ADKAFEACoAfQAagBBAAyAFV0XdtE9Bq9gstvBYXGEIhZnGFnHNEDFvBQwcpmWZbLYLGC4m5YZkjoi8hQcAFkFIoOcrjcwOSHv1nkNEE5bE4gdZ6T4PJ5bGEPOyRmYzBQrE4YrFBU4IptVmL4Y0TmwZXKbvRjLAcFLSBVCKgABTjACU9HFCKantl8tVjwGLE1CAsXKsHiWbisDicHmUOvNmwouYzBZibnB3jCFldAljHooRRKiuutzUvXVVNAwwsUW52a22qNRai5pi-IoXjckTCNc8WYbDWOSJbxWqaKxeKJpKTPdT1JG1g+sQcpo2Hhixf+I2vFChMTiw4FzPr6Thjfd65kAjohDtsqB6UkefbBIOGZgnO4JuOOYTmmCNgQlm8R5j4F4rhKcYUH+JBgIBGI4gSJJkl29zJhqx7vOMXxTL8sx3nBHjWraN5mDeDj2GEMRpJ+zDoBAcC9G6a55N2oEvOBCB4LY5p4CxDhKcpylbFhTbrgUEkplJJiIHO5pLjOtj8rYMROCEbhmAu6k-lKXrytpVHSdqVoONm0JuM+lggpOHHhJEHgcfynimtetliZQrbVE5vZ6QgcExNauaMqyRoRNqfm2GWgXBVsEJ0hFkqUHhIgEWAsVgfF1bKHY4KLFmvIeNCCF3mCywmqhubKBhyhhHxKRAA */
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
          actions: "updateValue",
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

    this.addOutput("value", new ClassicPreset.Output(stringSocket, "Text"));
    const self = this;
    this.addControl(
      "template",
      new CodeControl("handlebars", {
        initial: prev?.context?.settings.template || "",
        theme: this.di.store.getState().theme,
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

  // execute() {}
  async compute(inputs: { [key: string]: [string | number] }) {
    console.log("PromptTemplate COMPUTE", inputs);
    this.actor.send({
      type: "SET_VALUE",
      inputs: inputs,
    });
  }

  async serialize(): Promise<Data> {
    const state = this.actor.getSnapshot();
    return {
      value: state.context.rendered,
    };
  }
}
