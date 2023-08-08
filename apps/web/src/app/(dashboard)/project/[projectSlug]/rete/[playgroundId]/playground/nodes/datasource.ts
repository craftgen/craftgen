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
import { setNodeData } from "../actions";
import { debounce } from "lodash-es";
import {
  getDataSet,
  getDataSets,
} from "../../../../playground/[playgroundId]/nodes/actions";
import { ButtonControl } from "../ui/control/control-button";
import { BaseNode, NodeData } from "./base";

type Data = {
  id: any;
  state?: any;
};

const datasetMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QQIYBcWzGgdBMAbmgPbEA2OAxmcVhAMT5GkUlRRlgDaADALqJQAB1oBLNKOIA7QSAAeiAIwB2AJw4ATADYArFo0AWDQGYdADiM6dAGhABPRBp6KcBrT1UGehnvuNaAXwDbVAwsXCYSchxiITApRkIo1mJ2Tl4BJBARWHFJGSyFBBV1bT1DE3NLG3slHR4cVWVFUzNlZx560yCQ9ExsPD7YYgBXACdKMBwxsBQIO3oAYQB5ADlVgFFFgBUM2Ry86Vki82McHX89LQMmszMNWwcEfxd9N+0tZTNdTx6QUP6ESGowmU0o0ikYEoEikUEY0imoikBGIAGspgDwoMwiDJlQIVCYVAEEiUZR0PkMnssgcJEdCohVMYNDhmm83NpFEytI9EMYzDpGszVB5lJUjIo-piBpjcYiIJx4ZCcKS0RihjLgeM8aIFWAScjiOS6VIqfx9mITcdHKoXFyNGLVJ5RRoWrzngKhRpVIZlDonK7JX8pMR8PAstK0BbclaGQgALSGd2JgxSjURJIsaOHAqgIpJ2oILRnAwCz7MgynVT6NNhGWZ6LUWiQbOxvOIMXuxQ6ZQ4Treqz6AzGRQaHu1wF4BsUWLxVv5a3PAy9rz+CXGIzKZQGLs6dRWAflYej8fBf7p7GYOXz+nthAFp4Os6qer+lRmZzVswTrGy7Xyzgb1zeQOweQsXlcF4dE3W0xR0H9NRxf98SkSFoSRKAgMXMVXjaLRFHwu5zH0d0IOHQimUrXRT16OsgSQ0EULQtAWxpS0FzjRRR1w5Riz8DQzBUHlwIsL1DH8DROR0INaMnP9GJmOYnmEdjbxAhBSzMHBmUEtRPh4ZdjE6UjRKZSSrFtT4zFtYwgiCIA */
  id: "dataset",
  type: "parallel",
  context: ({ input }) => ({
    datasetId: input?.datasetId,
  }),
  types: {
    context: {} as {
      datasetId: string | null;
      datasets?: any[];
      dataset?: any;
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
          invoke: {
            src: "fetchDataSets",
            onDone: {
              target: "ready",
              actions: assign({
                datasets: ({ event }) => {
                  return event.output;
                },
              }),
            },
          },
        },
        ready: {
          on: {
            CONNECT: {
              target: "connecting",
              actions: assign({
                datasetId: ({ event }) => event.datasetId,
                datasets: undefined,
              }),
            },
          },
        },
        connecting: {
          invoke: {
            src: "fetchDataset",
            input: ({ context }) => ({ datasetId: context.datasetId }),
            onDone: {
              target: "connected",
              actions: assign({
                dataset: ({ event }) => event.output,
              }),
            },
          },
        },
        connected: {},
      },
    },
  },
});

export class DataSource extends BaseNode<
  {},
  {
    foreach: TextSocket;
  },
  {
    datasourceId?: SelectControl<string>;
    datasource?: TableControl<any>;
    debug: ButtonControl;
  }
> {
  height = 320;
  width = 380;

  actor: InterpreterFrom<typeof datasetMachine>;

  constructor(di: DiContainer, data: NodeData) {
    super("DataSource", di, data);
    console.log("INITIALIZING DATASOURCE", data);
    this.id = data?.id || this.id;
    console.log({ id: this.id, state: data.state });
    this.di = di;
    this.addControl(
      "debug",
      new ButtonControl("debug", () => {
        this.actor.send({
          type: "devtool.toggle",
        });
      })
    );

    const a = datasetMachine.provide({
      actors: {
        fetchDataSets: fromPromise(async () => {
          const datasets = await getDataSets(data.project_id);
          console.log({ datasets });
          return datasets;
        }),
        fetchDataset: fromPromise(async ({ input }) => {
          console.log("fetching data", input);
          const data = await getDataSet(input.datasetId);
          console.log(data);
          console.log("DDD", data?.rows);
          return data;
        }),
      },
    });
    this.actor = interpret(a, {
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
      if (state.matches("datasource.ready") && !this.controls.datasourceId) {
        this.addControl(
          "datasourceId",
          new SelectControl<string>(
            state.context.datasetId || undefined,
            "Select Data Source",
            [
              ...(state.context.datasets?.map((dataset) => ({
                key: dataset.id,
                value: dataset.name,
              })) || []),
            ],
            (value) => {
              this.actor.send({ type: "CONNECT", datasetId: value });
            }
          )
        );
      }
      if (state.matches("datasource.connected")) {
        if (this.controls.datasourceId) {
          this.removeControl("datasourceId");
        }

        if (!this.controls.datasource) {
          this.addControl(
            "datasource",
            new TableControl(
              [
                {
                  accessorKey: "name",
                  header: "Name",
                },
              ],
              state.context.dataset?.rows.map((r: any) => ({
                ...r.data,
                id: r.id,
              })) || []
              // state.context.dataset?.columns || []
            )
          );
        } else {
        }
      }
    });
    this.actor.start();

    this.addOutput(
      "foreach",
      new ClassicPreset.Output(new TextSocket(), "foreach")
    );

    // const state = this.actor.getSnapshot();
    // console.log("state in Constructor", state);

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
