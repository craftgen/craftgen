"use client";
import "reflect-metadata";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  redirect,
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { createCraftStore } from "@/core/store";
import { CraftContext, useCraftStore } from "@/core/use-store";
import { debounce } from "lodash-es";
import {
  FileClock,
  LayoutDashboard,
  MousePointerSquareDashed,
} from "lucide-react";
import { useStore } from "zustand";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getControl } from "@/core/control";
import * as FlexLayout from "flexlayout-react";
import { Badge } from "@/components/ui/badge";
import { useSelector } from "@xstate/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { NodeProps } from "@/core/types";
import { InputWindow } from "./input/input-window";
import { Socket } from "@/core/sockets";
import { Input as InputNode } from "rete/_types/presets/classic";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { match } from "ts-pattern";
import { ResultOfAction } from "@/lib/type";
import { LogsTab } from "./logs/logs-tab";
import { Icons } from "@/components/icons";
import { useTheme } from "next-themes";
import { getWorkflow } from "@/actions/get-workflow";
import { updatePlaygroundLayout } from "@/actions/update-playground-layout";
import { Composer } from "@/core/composer";

const defaultLayout: FlexLayout.IJsonModel = {
  global: {},
  borders: [
    {
      type: "border",
      location: "bottom",
      children: [
        {
          type: "tab",
          name: "Logs",
          component: "logs",
          enableClose: false,
        },
      ],
    },
  ],
  layout: {
    type: "row",
    weight: 100,
    children: [
      {
        type: "row",
        weight: 20,
        children: [
          {
            type: "tabset",
            weight: 63.88557806912991,
            children: [
              {
                type: "tab",
                name: "Inspector",
                component: "inspector",
                enableClose: false,
              },
            ],
          },
          {
            type: "tabset",
            weight: 36.11442193087009,
            children: [
              {
                type: "tab",
                name: "Inputs",
                component: "inputWindow",
                enableClose: false,
              },
            ],
          },
        ],
      },
      {
        type: "tabset",
        weight: 80,
        children: [
          {
            type: "tab",
            name: "Composer",
            component: "rete",
            enableClose: false,
          },
        ],
      },
    ],
  },
};

export const Playground: React.FC<{
  workflow: ResultOfAction<typeof getWorkflow>;
}> = ({ workflow }) => {
  const params = useParams();
  const searchParams = useSearchParams();
  const executionId = searchParams.get("execution");

  const { theme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const store = useRef(
    createCraftStore({
      layout: FlexLayout.Model.fromJson(
        (workflow.layout as FlexLayout.IJsonModel) || defaultLayout
      ),
      theme,
      readonly: workflow.readonly,
      projectId: workflow.project.id,
      projectSlug: params.projectSlug as string,
      workflowId: workflow.id,
      workflowSlug: params.playgroundSlug as string,
      workflowVersionId: workflow.version.id,
      workflowExecutionId: executionId,
    })
  );

  useEffect(() => {
    const subb = store.current.subscribe(
      (state) => state.workflowExecutionId,
      async (workflowExecutionId) => {
        console.log("running", workflowExecutionId);
        const params = new URLSearchParams(searchParams);
        if (workflowExecutionId) params.set("execution", workflowExecutionId);
        if (!workflowExecutionId) params.delete("execution");
        if (params.get("execution") === executionId) return;
        if (params.get("execution") === workflow.execution?.id) {
          params.delete("execution");
        }
        router.push(pathname + "?" + params.toString());
      }
    );
    return subb;
  }, []);

  const { layout, di, setTheme, setWorkflowExecutionId } = useStore(
    store.current
  );
  useEffect(() => {
    setWorkflowExecutionId(searchParams.get("execution"));
  }, [searchParams.get("execution")]);
  useEffect(() => {
    setTheme(theme || "light");
  }, [theme]);

  // TODO: WHAT THE HACK IS THIS
  useEffect(() => {
    if (workflow.readonly) return;
    const layoutListener = store.current.subscribe(
      (state) => state.layout,
      async (layout) => {
        await updatePlaygroundLayout({
          layout: layout.toJson(),
          playgroundId: workflow.id,
        });
      }
    );
    return () => layoutListener();
  }, [workflow.readonly]);

  const debouncedLayoutChange = useCallback(
    debounce(async (layout: FlexLayout.Model) => {
      if (workflow.readonly) return;
      await updatePlaygroundLayout({
        layout: layout.toJson(),
        playgroundId: workflow.id,
      });
    }, 2000),
    [layout]
  );

  const factory = (layoutNode: FlexLayout.TabNode) => {
    const component = layoutNode.getComponent();
    const config = layoutNode.getConfig();
    if (component === "button") {
      return <button>{layoutNode.getName()}</button>;
    }
    if (component === "inspector") {
      return <InspectorWindow />;
    }
    if (component === "rete") {
      return <Composer workflow={workflow} store={store} />;
    }
    if (component === "inspectorNode") {
      const node = di?.editor.getNode(config.nodeId);
      if (!node) return null;
      return <InspectorNode nodeId={config.nodeId} />;
    }
    if (component === "inputWindow") {
      return <InputWindow />;
    }
    if (component === "logs") {
      if (workflow.readonly) {
        return <LoginToContinue />;
      }
      return <LogsTab workflow={workflow} />;
    }
  };

  return (
    <CraftContext.Provider value={store?.current}>
      <TooltipProvider>
        <div className="w-full h-full bg-muted/20 min-h-[calc(100vh-5rem)] py-1 px-1 relative">
          <FlexLayout.Layout
            model={layout}
            factory={factory}
            onModelChange={(model) => debouncedLayoutChange(model)}
            onRenderTab={(node, renderValues) => {
              const component = node.getComponent();
              match(component)
                .with("rete", () => {
                  renderValues.leading = (
                    <LayoutDashboard className="w-4 h-4" />
                  );
                })
                .with("inspector", () => {
                  renderValues.leading = (
                    <MousePointerSquareDashed className="w-4 h-4" />
                  );
                })
                .with("inputWindow", () => {
                  renderValues.leading = <Icons.input className="w-4 h-4" />;
                })
                .with("logs", () => {
                  renderValues.leading = <FileClock className="w-4 h-4" />;
                });
            }}
            onRenderTabSet={(node, renderValues) => {
              // renderValues.stickyButtons = [<FileClock className="w-4 h-4" />];
              // // renderValues.buttons.push(<Icons.add className="w-4 h-4" />);
              // renderValues.centerContent = (
              //   <Icons.alignCenter className="w-4 h-4" />
              // );
              // renderValues.headerContent = (
              //   <Icons.alignLeft className="w-4 h-4" />
              // );
              // renderValues.headerButtons.push(
              //   <Icons.bold className="w-4 h-4" />
              // );
            }}
            realtimeResize
          />
        </div>
      </TooltipProvider>
    </CraftContext.Provider>
  );
};

const LoginToContinue: React.FC<{}> = ({}) => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <h2 className="text-2xl font-bold mb-4">Please login to continue</h2>
      <Button
        onClick={() => {
          redirect("/login");
        }}
      >
        Login
      </Button>
    </div>
  );
};

const InspectorWindow: React.FC<{}> = ({}) => {
  const di = useCraftStore((state) => state.di);
  const layout = useCraftStore((state) => state.layout);
  const selectedNodeId = useCraftStore((state) => state.selectedNodeId);
  const setSelectedNode = useCraftStore((state) => state.setSelectedNodeId);
  useEffect(() => {
    if (!selectedNodeId) return;
    const node = di?.editor.getNode(selectedNodeId);
    if (!node) {
      setSelectedNode(null);
    }
  }, [selectedNodeId]);

  const handlePinTab = () => {
    const selectedNode = selectedNodeId && di?.editor.getNode(selectedNodeId);
    if (!selectedNode) return;
    const tabset = layout.getActiveTabset()?.getId()!;
    layout.doAction(
      FlexLayout.Actions.addNode(
        {
          type: "tab",
          component: "inspectorNode",
          name: selectedNode.label,
          config: {
            nodeId: selectedNodeId,
          },
        },
        tabset,
        FlexLayout.DockLocation.CENTER,
        1
      )
    );
  };

  return (
    <>
      {selectedNodeId ? (
        <div className="h-full flex flex-col">
          {/* <Button onClick={handlePinTab}>Pin</Button> */}
          <InspectorNode nodeId={selectedNodeId} />
        </div>
      ) : (
        <div className="flex items-center justify-center w-full h-full">
          Select a node to inspect
        </div>
      )}
    </>
  );
};
const InspectorNode: React.FC<{ nodeId: string }> = ({ nodeId }) => {
  const di = useCraftStore((state) => state.di);
  const node = di?.editor.getNode(nodeId) as NodeProps;
  const controls = Object.entries(node.controls);
  const state = useSelector(node.actor, (state) => state);
  const outputs = useMemo(() => {
    if (!state.context.outputs) return [];
    return Object.entries(node.outputs)
      .filter(([key, output]) => output?.socket.name !== "Trigger")
      .map(([key, output]) => {
        return {
          key,
          socket: output?.socket,
          value: state.context.outputs[key],
        };
      });
  }, [state]);
  return (
    <div className="h-full w-full flex flex-col">
      <Tabs defaultValue="controls" className="p-4 h-full">
        <TabsList>
          <TabsTrigger value="controls">Controls</TabsTrigger>
          <TabsTrigger value="inputs">Inputs</TabsTrigger>
          <TabsTrigger value="outputs">Outputs</TabsTrigger>
        </TabsList>
        <TabsContent value="controls" className="h-full">
          <div className="flex flex-col h-full overflow-hidden gap-4 ">
            <ScrollArea className="h-full w-full pr-4">
              {controls.map(([key, control]) => (
                <ControlWrapper key={key} control={control} label={key} />
              ))}
            </ScrollArea>
          </div>
        </TabsContent>
        <TabsContent value="inputs" className="h-full">
          <div className="flex flex-col h-full overflow-hidden space-y-2">
            <ScrollArea className="px-4 pb-10">
              <DynamicInputsForm inputs={node.inputs} />
            </ScrollArea>
          </div>
        </TabsContent>
        <TabsContent value="outputs" className="h-full">
          <ScrollArea>
            {outputs.map((output) => (
              <div key={output.key} className="">
                <Label className="capitalize">{output.key}</Label>
                {renderFieldValueBaseOnSocketType(output.socket!, output.value)}
              </div>
            ))}
          </ScrollArea>
        </TabsContent>
      </Tabs>
      {state.matches("error") && (
        <div className="py-4 px-4">
          <Alert variant={"destructive"} className="">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertTitle>{state.context.error?.name}</AlertTitle>
            <AlertDescription>{state.context.error?.message}</AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
};

export const renderFieldValueBaseOnSocketType = (
  socket: Socket,
  value: any
) => {
  switch (socket.name) {
    case "String":
      return <Input value={value} readOnly />;

    default:
      return null;
  }
};

export const DynamicInputsForm: React.FC<{
  inputs: { [key: string]: InputNode<Socket> | undefined };
}> = ({ inputs }) => {
  return (
    <>
      {Object.entries(inputs).map(([inputKey, input]) => {
        if (!input?.control || !input?.showControl) {
          if (input?.socket.name === "Trigger") return null;
          return (
            <Alert variant={"default"} key={inputKey}>
              <AlertTitle>
                Input: <Badge>{inputKey}</Badge>
              </AlertTitle>
              <AlertDescription>
                This input controlled by the incoming connection.
              </AlertDescription>
            </Alert>
          );
        }
        return (
          <ControlWrapper
            key={inputKey}
            control={input.control}
            label={inputKey}
          />
        );
      })}
    </>
  );
};

export const ControlWrapper: React.FC<{ control: any; label: string }> = ({
  control,
  label,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const ControlElement = getControl({
    element: ref.current!,
    type: "control",
    payload: control!,
  });
  return (
    <>
      <div
        className="space-y-1 flex flex-col"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Label htmlFor={control.id} className="capitalize">
          {label}
        </Label>
        <span ref={ref}></span>
        <ControlElement data={control} />
      </div>
    </>
  );
};