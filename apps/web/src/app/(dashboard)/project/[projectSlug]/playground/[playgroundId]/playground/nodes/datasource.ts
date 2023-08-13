import { ClassicPreset } from "rete";
import { DiContainer } from "../editor";
import { SelectControl } from "../ui/control/control-select";
import { TextSocket } from "../sockets";
import { TableControl } from "../ui/control/control-table";
import { createMachine, assign, fromPromise, StateFrom } from "xstate";
import { getDataSet, getDataSets, getDatasetPaginated } from "../../action";
import { BaseNode, NodeData } from "./base";
import { ButtonControl } from "../ui/control/control-button";

const datasetMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QQIYBcWzGgdASwgBswBiCAewDsx9KA3cgaxtQy1wOIT3vIGN0eKgG0ADAF0x4xKAAO5WHjRDKMkAA9EAJgBsARhx6AnFoDsegBwBmUVb2WtAGhABPbaa2GLFvToAsotZWVjpaVgC+4c6smNg4AE5gKBAuJADCAPIAclkAomkAKlJq8orKVGqaCACsFkY4RnqieqamfiZ6Vm3Obghmojg6FqbV9jrVOjqm-jqR0eixuHxU1HzKlFBkVDQ8DMw4Mew4y5Sr61DcvALllFLFSCClSiqViLX1jc2t7Vqd3a6IHw4PwWCamYZGHQ2aojOYgQ5xE5nSAkPIADSKEhKCmeFQeVXeDSaLTaHS6fh6iBafhwtWqRj8ZiMRmsnT8cIRuESyVSfG5aDA9zkOJurwQfihg2Mehh42a1Ql1UpCCsE2B1kCoNMoh0OoskSiIEo5AgcDUnOxZRe+MQAFodMr7ThRC6XVZGl0rD8tByFkdOGBLbjVDbxU4AX1tcCjG1RMyLHHTDH2YbOQkkikg6LQ342s69O0jHrGZDRBSI1ojFYGlXqrZ6UZ6Xofam-YiVmA1jwoFnraAqq0LDhvDLgt5mqJpsqWjph42LH57FpF16hr62O3Tp2BRBe3j+4g-NVq1YtD4ugmfOZQdPAsOPPpapPTBFWxulvzu3uQwfxaMpY0sp1jKirKous4gjY3gwjqeoGuEQA */
  id: "dataset",
  context: {
    datasetId: null,
    cursor: null,
    processedDataIds: [],
  },
  types: {
    context: {} as {
      datasetId: string | null;
      datasets?: any[];
      dataset?: any;
      processedDataIds?: string[];
      cursor?: string | null;
    },
    events: {} as
      | {
          type: "CONNECT";
          datasetId: string;
        }
      | {
          type: "NEXT";
          cursor: string;
        }
      | {
          type: "CREATE";
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
        CREATE: "creating",
      },
    },
    creating: {
      // on: {
      // CREATE: {
      //   target: "connecting",
      //   actions: assign({
      //     datasetId: ({ event }) => event.datasetId,
      //   }),
      // },
      // },
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

    connected: {
      on: {
        NEXT: {
          target: "connecting",
          actions: assign({
            cursor: ({ event }) => event.cursor,
            processedDataIds: ({ context, event }) => {
              if (event.cursor === null) return [];
              return [...(context.processedDataIds || []), event.cursor];
            },
          }),
        },
      },
    },
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
    createButton?: ButtonControl;
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
    if (state.matches("ready")) {
      this.addControl(
        "createButton",
        new ButtonControl("Create", () => {
          this.actor.send({
            type: "CREATE",
          });
        })
      );
    } else {
      this.removeControl("createButton");
    }
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
          )
        );
      } else {
      }
    }
  }

  execute() {
    return {};
  }

  async data() {
    const state = this.actor.getSnapshot();
    if (state.matches("connected")) {
      const data = await getDatasetPaginated({
        datasetId: state.context.datasetId,
        cursor: state.context.cursor,
        limit: 1,
      });
      this.actor.send({
        type: "NEXT",
        cursor: data.nextCursor || null,
      });
      return {
        foreach: data.data[0],
      };
    }
    return {
      foreach: "something",
    };
  }

  serialize() {
    return {};
  }
}
