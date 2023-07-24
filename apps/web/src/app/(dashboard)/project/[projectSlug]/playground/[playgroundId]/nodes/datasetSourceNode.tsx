import {
  CardHeader,
  CardContent,
  Card,
  CardFooter,
} from "@/components/ui/card";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Handle, NodeProps, Position } from "reactflow";
import useSWR from "swr";
import { createMachine, assign } from "xstate";
import { getDataSet, getDataSets, getNodeData, setNodeData } from "./actions";
import { useActor } from "@xstate/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { debounce } from "lodash-es";
import { Wrench } from "lucide-react";
import useStore from "../state";

type DataSetSourceNodeData = {
  id: string;
};

const datasetMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QQIYBcWzGgdBMAbmgPbEA2OAxmcVhAMT5GkXEAOYAdgNoAMAuolBtaASzSjinISAAeiAIwB2AJw4ATEoDMAFi1aAHL14A2XkoU6ANCACeidbwU4ArMeNne6lyu1aAvv42qBhYuEwk5DjsXIyEkRTUtGB8gkggIrDiktLp8gjKapq6+kam5pY29gVuOCr19T46LjoKLiaBweiY2HjdsMQArgBOlGA4ohBkYPQAwgDyAHKLAKKzACqpMpnZUjL5bS44Og0q6ipavgoGKtZ2iFomzm7GhjdKSiY3gUEgnMT4eDpEI9NDbMQSPZ5RAAWnUd2qcJ0nRAILCeHiLHBWUhuVA+XhVUQJi0x1OZh89UMvBcKLRvQiLCoNDo2N2eLkiCU6iJNSUOF4Bn0jxpLhcChMYrp-QZmKiMQ5O1x+welzqLi0Ci06glgtUj15bTULiF+gpYolUt+9PC-SGozAbOV0IQhPurqUOgF7l1Pg+KgU0tCDLtIzGEymjvSSpyKoQ3N5hi9vklDScCnhHWtMttoXt4coUk4YEoaEgTtjLvOpJMqi+Xy1OgM6h57qTdU+lJU6czP38QA */
  id: "dataset",
  type: "parallel",
  context: {
    id: null,
    devtool: false,
  },
  types: {
    context: {} as {
      id: string | null;
      devtool: boolean;
    },
    events: {} as
      | {
          type: "CONNECT";
          dataSetId: string;
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
              target: "connected",
              actions: assign({
                id: ({ event }) => event.dataSetId,
              }),
            },
          },
        },
        connected: {},
      },
    },
  },
});

export const DataSetSourceNode: React.FC<NodeProps<DataSetSourceNodeData>> = ({
  id,
  ...rest
}) => {
  const { data } = useSWR(
    () => ["nodeData", id],
    ([key, id]) => getNodeData(id)
  );

  console.log(rest);
  const { updateNode } = useStore();
  useEffect(() => {
    if (data) {
      updateNode(id, data?.state);
    }
  }, [data]);
  if (!data) return null;
  return <DataSetNode id={id} data={data} />;
};

export const DataSetNode: React.FC<{ id: string; data: any }> = ({
  id,
  data,
}) => {
  console.log(data);

  const [state, send, actor] = useActor(datasetMachine, {
    id: id,
    ...(data?.state !== null && { state: data.state }),
  });

  const saveDebounced = debounce((state) => setNodeData(id, state), 2000);

  useEffect(() => {
    const listener = actor.subscribe((state) => {
      console.log("actor", state);
      saveDebounced(JSON.stringify(state));
    });
    return listener.unsubscribe;
  }, [state]);

  const { data: dataSet } = useSWR(["dataSet", state.context.id], ([key, id]) =>
    getDataSet(id!)
  );

  console.log(dataSet)

  return (
    <>
      <Handle type="source" position={Position.Right} className="scale-200" />
      <ContextMenu>
        <ContextMenuTrigger>
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              Data Source
              <Button
                onClick={() => send({ type: "devtool.toggle" })}
                variant={"ghost"}
              >
                <Wrench />
              </Button>
            </CardHeader>
            <CardContent>
              {state.matches("datasource.idle") && data && (
                <DataSetSourceNodeForm
                  projectId={data?.project_id}
                  send={send}
                />
              )}
              {state.matches("datasource.connected") && (
                <DataSetSourceTableView datasetId={state.context.id!} />
              )}
            </CardContent>
            <CardFooter>
              <div className="flex flex-col">
                <div>id: {id}</div>
                {state.matches("devtool.open") && (
                  <div className="">
                    <pre>
                      <code>
                        {JSON.stringify(
                          {
                            state,
                            data,
                            dataSet,
                          },
                          null,
                          2
                        )}
                      </code>
                    </pre>
                  </div>
                )}
              </div>
            </CardFooter>
          </Card>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem key={"delete"}>
            Delete
            <ContextMenuShortcut>⌫</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </>
  );
};

export const DataSetSourceTableView: React.FC<{ datasetId: string }> = ({
  datasetId,
}) => {
  const { data: dataSet } = useSWR(["dataSet", datasetId], ([key, id]) =>
    getDataSet(id!)
  );
  return (
    <div>
      <h3>{dataSet?.name}</h3>
      <ScrollArea>
        {dataSet?.rows?.map((row) => (
          <div className="flex flex-row">
            <div className="px-2 py-1">{JSON.stringify(row.data)}</div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
};

const DataSetSourceNodeSchema = z.object({
  id: z.string(),
});

const DataSetSourceNodeForm: React.FC<{
  projectId: string;
  send: (params: any) => void;
}> = ({ projectId, send }) => {
  const form = useForm<z.infer<typeof DataSetSourceNodeSchema>>({
    resolver: zodResolver(DataSetSourceNodeSchema),
  });
  async function onSubmit(values: z.infer<typeof DataSetSourceNodeSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);
    send({ type: "CONNECT", dataSetId: values.id });
  }

  const { data: datasets } = useSWR(
    () => ["dataSets", projectId],
    ([key, projectId]) => getDataSets(projectId)
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dataset</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select your dataset" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {datasets?.map((dataset) => (
                    <SelectItem key={dataset.id} value={dataset.id}>
                      {dataset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Select Data Source</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Connect</Button>
      </form>
    </Form>
  );
};
