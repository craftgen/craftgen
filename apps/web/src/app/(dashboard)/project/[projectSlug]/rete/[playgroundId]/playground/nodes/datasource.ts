import { ClassicPreset } from "rete";
import { DiContainer } from "../editor";
import { SelectControl } from "../ui/control/control-select";
import { TextSocket } from "../sockets";
import { TableControl } from "../ui/control/control-table";
import {
  createMachine,
  assign,
  interpret,
  InterpreterFrom,
  fromPromise,
} from "xstate";
import { DebugControl } from "../ui/control/control-debug";
import { getNodeData, setNodeData } from "../actions";
import { debounce } from "lodash-es";

type Data = {
  state?: any;
};

const datasetMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QQIYBcWzGgdBMAbmgPbEA2OAxmcVhAMT5GkUlRRlgDaADALqJQAB1oBLNKOIA7QSAAeiAIwB2AJw4ATADYArFoDMADmVGDG1QBoQAT0QAWHlpx2Nh-ap7K7hu-rUBffytUDCxcJhJyHGIhMClGQkjWYnZOXgEkEBFYcUkZTIUEFXVtPSMTQzNLG0R9HR0cVSM3Vz9VNUV9QOD0TGw8XthiAFcAJ0owHFEITnoAYQB5ADklgFE5gBV02Wzc6VlCxXqcXUNKu1UNfTs7ZR59K1sEPScdJsNFFUNXO51ukBCfXCgxG40mlGkUjAlAkUigjGkk1EUgIxAA1pNAWEBqFQRMqJDobCoAhkajKOg8ultpldhJ9gV7IYGl5rqobp46nVHog3jxGjweDpBXZFHYdMoNP8sf0pMR8FMZmB6DThGJ6flQIdjqdjDx2h8NPcNDyisoGnYtB8eBd9PrmToukEAYNZfLJgAzbCUAAWyPhEERUxR6MxrtwcoVXrQvv9pJDFI11P4O3VeQO9hcJy0osUGklikMgpNNTNFqtihtTXt9SdzsjcFkMrQqZyGozCAAtBo7Kbu-pGqoh8OR8OnT1Qv0IixW3tNfJED3TdpDM5HYotILvsYNBvpeG8IkWFQaHRZ+3GQhJab9FoNDgeEb3KodJVOh995PwkeojE4uf00va5lGce4tE3LQTCuQxVC0G8cxwHQjRcV8riFPRPyBHFMDxMAAIZLVF17UtblXVRC0fEwtFg7x2Uw7EsVwxVOHw+dCmvUtX3UGCDXIkU1DseipxBMZ8QhKQoRhf1WI7cwByLIdHE3V9qMqU0XlAvxBTzW56lUITgVxUTwUJGFIBky9dAaLRFFUNxJUdG5qPUmCcB45QYMrG0BIMnAGwswiECXUsDGcZlIPzepK2o81fIbZi8NpNMCIXK8SyeFQ7GcSDbiMUV9E6K04vdHBo1jOEAtSjRhRwEwbTON4NHzO4HlLI5+XaTpxR0Std3cP5nWbPyStGMAUAgJ41TbQDAps+8dAcbq9A8po4Larxsq8BaN1varX0CQIgA */
    id: "dataset",
    type: "parallel",
    context: ({ input }) => ({
      datasetId: input?.datasetId,
      devtool: false,
    }),
    types: {
      context: {} as {
        datasetId: string | null;
        devtool: boolean;
      },
      events: {} as
        | {
            type: "CONNECT";
            datasetId: string;
          }
        | {
            type: "devtool.toggle";
          },
    },
    states: {
      devtool: {
        initial: "closed",
        states: {
          closed: {
            on: {
              "devtool.toggle": {
                target: "open",
              },
            },
          },
          open: {
            on: {
              "devtool.toggle": {
                target: "closed",
              },
            },
          },
        },
      },

      datasource: {
        initial: "idle",
        states: {
          idle: {
            on: {
              CONNECT: {
                target: "connecting",
                actions: assign({
                  datasetId: ({ event }) => event.datasetId,
                }),
              },
            },
          },
          connecting: {
            // invoke: {
            //   src: "fetchData",
            //   input: ({ context }) => ({ datasetId: context.id }),
            //   onDone: "connected",
            // },
          },
          connected: {},
        },
      },
      // node: {
      //   initial: "idle",
      //   states: {
      //     idle: {
      //       always: {
      //         target: "#dataset.node.fetching",
      //       },
      //     },
      //     fetching: {
      //       invoke: {
      //         src: "fetchData",
      //         input: ({ self }) => {
      //           return { id: self.id };
      //         },
      //         onDone: {
      //           target: "ready",
      //           actions: assign({
      //             datasetId: ({ event }) => {
      //               console.log('EEE', event)
      //               return event.output.state.context.datasetId
      //             },
      //           }),
      //         },
      //       },
      //     },
      //     ready: {},
      //   },
      // },
    },
  },
  {
    // actors: {
    //   fetchData: fromPromise(async ({ input }) => {
    //     console.log("fetching data", input);
    //     const data = await getNodeData(input.id);
    //     console.log("DDD", data?.state.context);
    //     return data;
    //   }),
    // },
  }
);

export class DataSource extends ClassicPreset.Node<
  {},
  {
    foreach: TextSocket;
  },
  {
    datasourceId: SelectControl<string>;
    datasource?: TableControl;
    debug: DebugControl;
  }
> {
  height = 320;
  width = 380;

  private di: DiContainer;
  actor: InterpreterFrom<typeof datasetMachine>;

  constructor(di: DiContainer, data: Data) {
    super("DataSource");
    console.log("INITIALIZING DATASOURCE", data);
    this.id = data?.state?.id || this.id;
    console.log({ id: this.id, state: data.state });
    this.di = di;
    this.actor = interpret(datasetMachine, {
      id: this.id,
      ...(data?.state !== null && { state: data.state }),
    });

    const saveDebounced = debounce(
      (state) => setNodeData(this.id, state),
      2000
    );
    this.actor.subscribe((state) => {
      console.log("state changed", state);
      saveDebounced(JSON.stringify(state));
    });
    this.actor.start();

    this.addOutput(
      "foreach",
      new ClassicPreset.Output(new TextSocket(), "foreach")
    );

    this.addControl(
      "datasourceId",
      new SelectControl<string>(
        undefined,
        "Select Data Source",
        [
          {
            key: "Famous",
            value: "Famous",
          },
          {
            key: "Chess Games",
            value: "Chess Games",
          },
        ],
        (value) => {
          this.actor.send({ type: "CONNECT", datasetId: value });
        }
      )
    );
    // this.addControl("debug", new DebugControl(this.data));
  }

  execute() {
    return {};
  }

  data() {
    return {};
  }

  serialize(): Data {
    return {};
  }
}
