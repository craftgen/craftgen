"use client";
import "reflect-metadata";

import { useRete } from "rete-react-plugin";
import { createEditorFunc } from "./editor";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  deleteEdge,
  deleteNode,
  getPlayground,
  updateNodeMeta,
  saveEdge,
  saveNode,
  savePlaygroundLayout,
} from "../action";
import { useParams } from "next/navigation";
import { CraftContext, createCraftStore, useCraftStore } from "./store";
import { debounce } from "lodash-es";
import { Lock, Maximize } from "lucide-react";
import { useStore } from "zustand";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getControl } from "./control";
import { ContextMenuProvider } from "./context-menu";
import * as FlexLayout from "flexlayout-react";
import { getConnectionSockets } from "./utils";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { useSelector } from "@xstate/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { NodeProps } from "./types";
import { InputWindow } from "./input/tab";
import { Socket } from "./sockets";
import { Input as InputNode } from "rete/_types/presets/classic";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { match } from "ts-pattern";

const defaultLayout: FlexLayout.IJsonModel = {
  global: {},
  borders: [],
  layout: {
    type: "row",
    weight: 100,
    children: [
      {
        type: "row",
        weight: 50,
        children: [
          {
            type: "tabset",
            weight: 100,
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
            weight: 100,
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
        weight: 50,
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
  playground: NonNullable<Awaited<ReturnType<typeof getPlayground>>>;
}> = ({ playground }) => {
  const params = useParams();
  const store = useRef(
    createCraftStore({
      layout: FlexLayout.Model.fromJson(
        (playground.layout as FlexLayout.IJsonModel) || defaultLayout
      ),
      readonly: playground.readonly,
      projectId: playground.project.id,
      projectSlug: params.projectSlug as string,
      playgroundId: playground.id,
      playgroundSlug: params.playgroundSlug as string,
    })
  );

  const { layout } = useStore(store.current);

  useEffect(() => {
    if (playground.readonly) return;
    const layoutListener = store.current.subscribe(
      (state) => state.layout,
      async (layout) => {
        await savePlaygroundLayout({
          layout: layout.toJson(),
          playgroundId: playground.id,
        });
      }
    );
    return () => layoutListener();
  }, [playground.readonly]);
  const debouncedLayoutChange = useCallback(
    debounce(async (layout: FlexLayout.Model) => {
      if (playground.readonly) return;
      await savePlaygroundLayout({
        layout: layout.toJson(),
        playgroundId: playground.id,
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
      return <Composer playground={playground} store={store} />;
    }
    if (component === "inspectorNode") {
      return <InspectorNode nodeId={config.nodeId} />;
    }
    if (component === "inputWindow") {
      return <InputWindow />;
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
            realtimeResize
          />
        </div>
      </TooltipProvider>
    </CraftContext.Provider>
  );
};

const Composer: React.FC<{ playground: any; store: any }> = ({
  playground,
  store,
}) => {
  const di = useCraftStore((state) => state.di);
  const projectSlug = useCraftStore((state) => state.projectSlug);
  const playgroundId = useCraftStore((state) => state.playgroundId);

  const createEditor = useMemo(() => {
    return createEditorFunc({
      playground,
      store: store.current,
    });
  }, [playground, store.current]);
  const [ref, rete] = useRete(createEditor);

  const { toast } = useToast();

  const fn = debounce(updateNodeMeta, 500);
  const updateMeta = useCallback(
    async (params: {
      id: string;
      position?: { x: number; y: number };
      width?: number;
      height?: number;
    }) => {
      return fn(params);
    },
    []
  );

  useEffect(() => {
    rete?.area.addPipe((context) => {
      match(context)
        .with({ type: "noderesized" }, ({ data }) => {
          console.log("noderesized", { data });
          di?.editor.getNode(data.id).setSize(data.size);
          updateMeta(data);
        })
        .with({ type: "nodetranslated" }, ({ data }) => {
          if (
            data.position.x !== data.previous.y ||
            data.position.y !== data.previous.y
          ) {
            updateMeta(data);
          }
        });

      return context;
    });
  }, [rete]);

  useEffect(() => {
    rete?.editor.addPipe((context) => {
      match(context)
        .with({ type: "connectioncreate" }, ({ data }) => {
          const { source, target } = getConnectionSockets(di?.editor!, data);
          if (target && !source.isCompatibleWith(target)) {
            console.log("Sockets are not compatible", "error");
            toast({
              title: "Sockets are not compatible",
              description: (
                <span>
                  Socket <Badge> {source.name} </Badge> is not compatible with{" "}
                  <Badge>{target.name} </Badge>
                </span>
              ),
            });
          }
        })
        .with({ type: "nodecreated" }, async ({ data }) => {
          const size = data.size;
          console.log("nodecreated", {
            data,
            size,
          });
          await saveNode({
            playgroundId: playground.id,
            data: {
              id: data.id,
              type: data.ID,
              color: "default",
              label: data.label,
              position: { x: 0, y: 0 }, // When node is created it's position is 0,0 and it's moved later on.
              ...size,
            },
          });
        })
        .with({ type: "noderemove" }, async ({ data }) => {
          console.log("noderemove", { data });
          await deleteNode({
            playgroundId: playground.id,
            data: {
              id: data.id,
            },
          });
        })
        .with({ type: "connectioncreated" }, async ({ data }) => {
          console.log("connectioncreated", { data });
          await saveEdge({
            playgroundId: playground.id,
            data: JSON.parse(JSON.stringify(data)),
          });
        })
        .with({ type: "connectionremoved" }, async ({ data }) => {
          console.log("connectionremoved", { data });
          await deleteEdge({
            playgroundId: playground.id,
            data: JSON.parse(JSON.stringify(data)),
          });
        });

      return context;
    });
  }, [rete]);
  return (
    <div className="w-full h-full">
      <div className="absolute top-1 right-1 z-50 flex ">
        {playground.readonly && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant={"outline"} className="cursor-pointer" size="sm">
                <Lock className="w-4 h-4 mr-2" />
                Read Only
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              You don&apos;t have access to edit fork it, to customize
            </TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant={"ghost"} size="icon" onClick={() => di?.setUI()}>
              <Maximize />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Center the content</TooltipContent>
        </Tooltip>
      </div>
      <ContextMenuProvider>
        <div ref={ref} className="w-full h-full " />
      </ContextMenuProvider>
    </div>
  );
};

const InspectorWindow: React.FC<{}> = ({}) => {
  const di = useCraftStore((state) => state.di);
  const layout = useCraftStore((state) => state.layout);
  const selectedNodeId = useCraftStore((state) => state.selectedNodeId);

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
  const [updateCounter, setUpdateCounter] = useState(0);
  useEffect(() => {
    if (!node) return;
    const sub = node.actor.subscribe(() => {
      debounce(() => {
        setUpdateCounter((prev) => prev + 1);
      }, 100)();
    });
    return sub.unsubscribe;
  }, [node]);
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
            <ScrollArea className="h-full w-full">
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

const ControlWrapper: React.FC<{ control: any; label: string }> = ({
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
      <div ref={ref} className="space-y-1 flex flex-col">
        <Label htmlFor={control.id} className="capitalize">
          {label}
        </Label>
        <ControlElement data={control} />
      </div>
    </>
  );
};
