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
import { createMachine } from "xstate";
import { getDataSet, getDataSets, getNodeData } from "./actions";
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
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

type DataSetSourceNodeData = {
  id: string;
};

const datasetMachine = createMachine({
  id: "dataset",
  initial: "idle",
  context: {
    id: null,
  },
  types: {
    context: {} as {
      id: string | null;
    },
    events: {} as {
      type: "CONNECT";
      dataSetId: string;
    },
  },
  states: {
    idle: {
      on: {
        CONNECT: {
          target: "connected",
        },
      },
    },
    connected: {},
  },
});

export const DataSetSourceNode: React.FC<NodeProps<DataSetSourceNodeData>> = ({
  id,
  type,
}) => {
  const { data } = useSWR(
    () => ["nodeData", id],
    ([key, id]) => getNodeData(id)
  );
  const [state, send] = useActor(datasetMachine, {
    input: {
      id: data?.id,
    },
  });

  const { data: dataSet } = useSWR(["dataSet", state.context.id], ([key, id]) =>
    getDataSet(id!)
  );

  return (
    <>
      <Handle type="source" position={Position.Right} />
      <ContextMenu>
        <ContextMenuTrigger>
          <Card>
            <CardHeader>Data Source</CardHeader>
            <CardContent>
              <pre>
                <code>
                  {JSON.stringify(
                    {
                      data,
                      dataSet,
                    },
                    null,
                    2
                  )}
                </code>
              </pre>
              {state.value === "idle" && data && (
                <DataSetSourceNodeForm
                  projectId={data?.project_id}
                  send={send}
                />
              )}
              {state.value === "connected" && (
                <>
                  <ScrollArea></ScrollArea>
                </>
              )}
            </CardContent>
            <CardFooter>
              <div>id: {id}</div>
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
  }

  const { data: datasets } = useSWR(
    () => ["dataSets", projectId],
    ([key, projectId]) => getDataSets(projectId)
  );
  console.log(datasets);

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

        <Button onClick={() => send({ type: "CONNECT", dataSetId: "" })}>
          Connect
        </Button>
      </form>
    </Form>
  );
};
