import { JSONView } from "@/components/json-view";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NodeProps } from "@seocraft/core/src/types";
import { useSelector } from "@xstate/react";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import Markdown from "react-markdown";
import { renderFieldValueBaseOnSocketType } from "../playground";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Runs } from "./runs";
import dynamic from "next/dynamic";
const ControlWrapper = dynamic(() =>
  import("@/core/ui/control-wrapper").then((mod) => mod.ControlWrapper),
);
const DynamicInputsForm = dynamic(() =>
  import("./dynamic-inputs-form").then((mod) => mod.DynamicInputsForm),
);

export const InspectorNode: React.FC<{ node: NodeProps }> = observer(
  ({ node }) => {
    const controls = Object.entries(node.controls);
    const state = useSelector(node.actor, (state) => state);
    const outputs = useMemo(() => {
      if (!state.context.outputs) return [];
      return Object.entries(node.outputs)
        .filter(([key, output]) => output?.socket.name !== "trigger")
        .map(([key, output]) => {
          return {
            key,
            socket: output?.socket,
            value: state.context.outputs[key],
          };
        });
    }, [state]);

    return (
      <div className="flex h-full w-full flex-1 flex-col">
        <Tabs defaultValue="controls">
          <TabsList>
            <TabsTrigger value="controls">Controls</TabsTrigger>
            <TabsTrigger value="outputs">Outputs</TabsTrigger>
            <TabsTrigger value="debug">Debug</TabsTrigger>
          </TabsList>
          <TabsContent value="debug" className="h-full">
            <div className="flex h-full flex-col gap-4 overflow-hidden ">
              <ScrollArea className="w-full">
                <JSONView src={state} />
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="controls" className="h-full ">
            <div className="flex h-full flex-col gap-4 overflow-hidden ">
              <ScrollArea className="w-full">
                {controls.map(([key, control]) => (
                  <ControlWrapper key={key} control={control} label={key} />
                ))}
                <DynamicInputsForm inputs={node.inputs} />
                <Separator />
                <Runs node={node} />
              </ScrollArea>
            </div>
          </TabsContent>
          <TabsContent value="outputs" className="h-full">
            <ScrollArea>
              {outputs.map((output) => (
                <div key={output.key}>
                  <Label className="capitalize">{output.key}</Label>
                  {renderFieldValueBaseOnSocketType(
                    output.socket,
                    output.value,
                  )}
                </div>
              ))}
            </ScrollArea>
          </TabsContent>
        </Tabs>
        {state.matches("error") && (
          <div className="px-4 py-4">
            <Alert variant={"destructive"} className="bg-muted/80 shadow">
              <ExclamationTriangleIcon className="h-6 w-6" />
              <AlertTitle className="text-lg font-bold">
                {state.context.error?.name}
              </AlertTitle>
              <AlertDescription className="prose">
                <Markdown>{state.context.error?.message}</Markdown>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    );
  },
);
