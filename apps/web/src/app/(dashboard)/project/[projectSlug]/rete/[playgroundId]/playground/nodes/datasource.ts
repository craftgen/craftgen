import { ClassicPreset } from "rete";
import { DiContainer } from "../editor";
import { SelectControl } from "../ui/control/control-select";
import { TextSocket } from "../sockets";
import { TableControl } from "../ui/control/control-table";
import { createMachine, assign, fromPromise, StateFrom } from "xstate";
import {
  getDataSet,
  getDataSets,
} from "../../../../playground/[playgroundId]/nodes/actions";
import { BaseNode, NodeData } from "./base";

const datasetMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QQIYBcWzGgdBMAbmgPbEA2OAxmcVhAMT5GkUlRRlgDaADALqJQAB1oBLNKOIA7QSAAeiAIwB2AJw4ATADYArFo0AWDQGYdADiM6dAGhABPRBp6KcBrT1UGehnvuNaAXwDbVAwsXCYSchxiITApRkIo1mJ2Tl4BJBARWHFJGSyFBBV1bT1DE3NLG3slHR4cVWVFUzNlZx560yCQ9ExsPD7YYgBXACdKMBwxsBQIO3oAYQB5ADlVgFFFgBUM2Ry86Vki82McHX89LQMmszMNWwcEfxd9N+0tZTNdTx6QUP6ESGowmU0o0ikYEoEikUEY0imoikBGIAGspgDwoMwiDJlQIVCYVAEEiUZR0PkMnssgcJEdCohVMYNDhmm83NpFEytI9EMYzDpGszVB5lJUjIo-piBpjcYiIJx4ZCcKS0RihjLgeM8aIFWAScjiOS6VIqfx9mITcdHKoXFyNGLVJ5RRoWrzngKhRpVIZlDonK7JX8pMR8PAstK0BbclaGQgALSGd2JgxSjURJIsaOHAqgIpJ2oILRnAwCz7MgynVT6NNhGWZ6LUWiQbOxvOIMXuxQ6ZQ4Treqz6AzGRQaHu1wF4BsUWLxVv5a3PAy9rz+CXGIzKZQGLs6dRWAflYej8fBf7p7GYOXz+nthAFp4Os6qer+lRmZzVswTrGy7Xyzgb1zeQOweQsXlcF4dE3W0xR0H9NRxf98SkSFoSRKAgMXMVXjaLRFHwu5zH0d0IOHQimUrXRT16OsgSQ0EULQtAWxpS0FzjRRR1w5Riz8DQzBUHlwIsL1DH8DROR0INaMnP9GJmOYnmEdjbxAhBSzMHBmUEtRPh4ZdjE6UjRKZSSrFtT4zFtYwgiCIA */
  id: "dataset",
  context: {
    datasetId: null,
  },
  types: {
    context: {} as {
      datasetId: string | null;
      datasets?: any[];
      dataset?: any;
    },
    events: {} as {
      type: "CONNECT";
      datasetId: string;
    },
  },
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
});

export class DataSource extends BaseNode<
  typeof datasetMachine,
  {},
  {
    foreach: TextSocket;
  },
  {
    datasourceId?: SelectControl<string>;
    datasource?: TableControl<any>;
  }
> {
  height = 320;
  width = 380;

  constructor(di: DiContainer, data: NodeData<typeof datasetMachine>) {
    super("DataSource", di, data, datasetMachine, {
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

    this.actor.subscribe((state) => {
      console.log("state changed in datasource actor => ", state);
      this.syncStateWithUI(state);
    });

    this.addOutput(
      "foreach",
      new ClassicPreset.Output(new TextSocket(), "foreach")
    );
    const state = this.actor.getSnapshot();
    this.syncStateWithUI(state);
  }

  syncStateWithUI(state: StateFrom<typeof datasetMachine>) {
    if (state.matches("ready") && !this.controls.datasourceId) {
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
    if (state.matches("connected")) {
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
  }

  execute() {
    return {};
  }

  data() {
    return {
      foreach: "something",
    };
  }

  serialize() {
    return {};
  }
}
