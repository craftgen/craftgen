import { ClassicPreset } from "rete";
import * as Sqrl from "squirrelly";
import { DiContainer } from "../editor";
import { isString, set, get } from "lodash-es";
import { BaseNode, NodeData } from "./base";
import { assign, createMachine, fromPromise } from "xstate";
import { DebugControl } from "../ui/control/control-debug";
import { stringSocket } from "../sockets";
import { CodeControl } from "../ui/control/control-code";

type Data = {
  value: string;
};

const PromptTemplateNodeMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QAcBOB7AtsgLgWhzGwBsBDQgOgEsJiwBiCdAOzGuYDd0BrNtLXASLIylGnQRVO6AMbkqLANoAGALorViFOlhUcC5lpAAPRACYAzBYoBGZcrMA2ACzKLNm84AcNgDQgAT0RnAHYQimcLLy9lLycLELcLAF9k-35sfEIScjZxBjBUDFQKEXIAM3RUTFKMTKEcsVowSWk5fSU1DSNkHT0DI1MES2s7Bxc3D28-QPMATkcKL3cLOednObmQrdT0usFssqa6ehkAC1JmGG6kEF7dDsNboZHbeydXd08ffyDh+woITMcxiywSm0cPl2d32WWEojYOACyCkUFOFyuYBu2geA2eiDW4TMAFYQjZtmYvAtScTfuYvMTAZS5mZPCzWSFidCMgd4bkKEiUVd6MZYDh+aRyoRUAAKYn2ACU9B5cMaiORqOxdz6j0GiG2jI2jhsxPWFlizmBdIQPgiDMhCS8zkcjmJLO5sIaRzYhWK6Mu1zUPR1eNAQwNEQWJrNFqtswQrnCFicbsi0U88q5aRhAlV3ooqDApAgAUYLDy0l4tVzXoRBaLJdaXHaBg0Wvu-RYeoQqzmFGUiQs6wcngHXmtaYoQ-sxpdoQZJI9NcOdcLxdLvqqpVElWq1fqK-5a8bUmb8k66iDtw7uvxCGJpIijjMThiUSdymcE5siwHD5sczKMS7hmNsS4HnylDHqW5wBliV44p2TxhogD7hM6L6Qm40SuF+8bEpS-Zkq4ILKI4cxWF4qTZsw6AQHAPSeoehDBriXZ3ngjjWngjKbHx-H8UC4G8mq1DNKxSHdpaE4bG8FjEgypqOKsVLCXmdaCqiEm3ihCBrDYFCZqy0QWC4rgzH8USLMsQEDq65lhGptb8puqDaaGJj6kBFCbMocx2F4ZnmmYE4DksTguHYyZhFR2Yqs5UENn8iE6Z5PYMoZzg-hRxpUlscwToB4XLA+kIMsoNjUckQA */
  id: "prompt-template",
  initial: "idle",
  context: {
    template: "",
    rendered: "",
    variables: [],
  },
  types: {
    context: {} as {
      template: string;
      rendered: string;
      variables: string[];
    },
    events: {} as
      | {
          type: "change";
          value: string;
        }
      | {
          type: "render";
          inputs: any;
        },
  },
  states: {
    idle: {
      invoke: {
        src: "parse",
        input: ({ context }) => ({ value: context.template }),
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
        change: "typing",
      },
    },
    ready: {
      invoke: {
        src: "render",
        input: ({ context }) => ({ template: context.template }),
        onError: {
          target: "error",
        },
        onDone: {
          actions: assign({
            rendered: ({ event }) => event.output,
          }),
        },
      },
      on: {
        change: "typing",
        render: {
          target: "ready",
          reenter: true,
        },
      },
    },
  },
});

export class PromptTemplate extends BaseNode<
  typeof PromptTemplateNodeMachine,
  {
    [key: string]: ClassicPreset.Socket;
  },
  { value: ClassicPreset.Socket },
  {
    template: CodeControl;
    debug: DebugControl;
  }
> {
  height = 420;
  width = 380;

  constructor(
    di: DiContainer,
    data: NodeData<typeof PromptTemplateNodeMachine>
  ) {
    console.log("initiiiial", data);
    super("Prompt Template", di, data, PromptTemplateNodeMachine, {
      actions: {
        updateValue: assign({
          template: ({ event }) => event.value,
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
              return item.c;
            });
          return rawTemplate;
        }),
        render: fromPromise(async ({ input }) => {
          const inputs = (await this.di.dataFlow?.fetchInputs(this.id)) as {};

          const values = Object.entries(inputs).reduce((prev, curr) => {
            const [key, value] = curr;
            set(prev, key, get(value[0], key));
            // prev[key] = value[0];

            return prev;
          }, {} as Record<string, string>);
          console.log("@@@ HULO", {
            template: input.template,
            values,
          });
          const rendered = Sqrl.render(input.template, values, {
            useWith: true,
          });
          return rendered;
        }),
      },
    });
    this.actor.subscribe((state) => {
      this.process();
    });
    this.addOutput("value", new ClassicPreset.Output(stringSocket, "Text"));
    const self = this;
    this.addControl(
      "template",
      new CodeControl(data.state?.context?.template || "", "js", (value) => {
        self.actor.send({
          type: "change",
          value,
        });
      })
    );
    this.addControl("debug", new DebugControl(this.actor.status));
    this.process();
    // this.process(data.state?.context?.template || "");
  }

  process() {
    const state = this.actor.getSnapshot();
    const rawTemplate = state.context.variables;

    for (const item of Object.keys(this.inputs)) {
      if (rawTemplate.includes(item)) continue;
      const connections = this.di.editor
        .getConnections()
        .filter((c) => c.target === this.id && c.targetInput === item);
      if (connections.length >= 1) continue;
      // if (this.inputs.) continue; // if there's an input that's not in the template keep it.
      console.log("removing input", item);
      this.removeInput(item);
    }

    for (const item of rawTemplate) {
      if (this.hasInput(item)) continue;
      this.addInput(item, new ClassicPreset.Input(stringSocket, item, false));
    }

    const values = Object.entries(this.inputs).reduce((prev, curr) => {
      const [key, value] = curr;
      prev[key] = value[0];

      return prev;
    }, {} as Record<string, string>);

    const renderedValue = Sqrl.render(state.context.rendered || "", values, {
      useWith: true,
    });

    // this.di.dataFlow?.reset();
    // this.di.editor.getNodes().forEach((n) => this.di.dataFlow?.fetch(n.id));
  }

  execute() {}

  data(inputs: { [key: string]: [string | number] }): Data {
    // this.actor.send({
    //   type: "render",
    // });
    const state = this.actor.getSnapshot();
    console.log("PROMPT TEMPLATE", state, inputs);
    this.actor.send({
      type: "render",
      inputs,
    });

    return {
      value: state.context.rendered,
    };
  }

  async serialize(): Promise<Data> {
    const state = this.actor.getSnapshot();
    return {
      value: state.context.rendered,
    };
  }
}
