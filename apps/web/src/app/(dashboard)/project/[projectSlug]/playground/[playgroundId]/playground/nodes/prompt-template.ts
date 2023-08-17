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
  /** @xstate-layout N4IgpgJg5mDOIC5QAcBOB7AtsgLgWhzGwBsBDQgOgEsJiwBiCdAOzGuYDd0BrNtLXASLIylGnQRVO6AMbkqLANoAGALorViFOlhUcC5lpAAPRACYALAGYKARmUBOKwA4Lzqx4e2ArAHYANCAAnoi+DsoUZg4OFo5mZlbeAGxJAL6pgfzY+IQk5GziDGCoGKgUIuQAZuiomOUY2UJ5YrRgktJy+kpqGkbIOnoGRqYIljb2Tq7unj4BwYhuDhS+ylY+iW7O4VbpmQ2CuRUtdPQyABakzDC9SCD9ul2GtyNjdo4ubh5WXn6BIaPKCK+CzRXxJVarbzOXy+XZ3fY5YSiNg4ILIKRQU4XK5gG7aB5DZ6IBzebwUbyA5TgpK+KyWJK2P6IKxJZzLEEOJIWPy2NyxCxwrIHJH5Cio9FXejGWA4UWkSqEVAACnsygAlPQhYjmii0Ri8XcBo9hohnMoyVDvCSqbZXGDvEyEM5bBQOZyrObeTTVoKEU0jmxiqUsZdrmo+kbCaARmaLc4rRSGXakg75ggQUDVqqnGYqQkBRl4QJtQGKEGavRUGBmBBigb7oMWCaEOCybY6TCXMpbLmkmZHSzfK7vB7nAzYmbfLZfcX-ciKFXSBAgowWAVpLx6rPDvPF8v2lxOgYNPXI02iQgKRYKFz3A5c95c2ZU-9SeMqVb4wlopYZ40d6Ke4ruWZRHNUtRbv+IqUEBB6yPI3TqOGtwNsaF7JEOFK+GaWaxDCSSOmENjgve3jchYFi5lYBZ7Nu0FsEBIY4qeBLntGiAYeSyjYYCax4WCjquC6ExmLG3YOGOaSFlqc6AWAS4rlWNZ1sh+KNk87GjPEbwUTELJmCsDgwo6fhkgZlFmCmRl+BR6SFsw6C1vAKF+gBhARqxGkmIgeAEWmeBktEQXBSFOzSa59HUK0Hnqc2lGEVCN5xNRyiUZMsLhXROpinqVwxWhmkxEsvh+O4j5gnSPaOhYKyRBCWw1Ws0IZbRUHZSB+VRt5CBTkkFDcRCGwWEk95zP8IIulR2Z0nmNFFm1pZAZ1bHdS4Zj9XSlE0hJlhhGNiCshEfZhN47YpMo0LOHZqRAA */
  id: "prompt-template",
  initial: "idle",
  context: {
    template: "",
    rendered: "",
    variables: [],
    inputs: {},
  },
  types: {
    context: {} as {
      template: string;
      rendered: string;
      variables: string[];
      inputs: Record<string, any[]>;
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
        change: "typing",
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
        input: ({ context }: any) => ({ // TODO:XSTATE
          template: context.template,
          inputs: context.inputs,
        }),
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
    [key: string]: ClassicPreset.Socket;
  },
  { value: ClassicPreset.Socket },
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
      if (connections.length >= 1) continue;
      // if (this.inputs.) continue; // if there's an input that's not in the template keep it.
      this.removeInput(item);
    }

    for (const item of rawTemplate) {
      if (this.hasInput(item)) continue;
      this.addInput(item, new ClassicPreset.Input(stringSocket, item, false));
    }
  }

  execute() {}

  data(inputs: { [key: string]: [string | number] }) {
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
