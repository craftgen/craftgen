"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { redirect, useParams } from "next/navigation";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import type { Session } from "@supabase/supabase-js";
import { useSelector } from "@xstate/react";
import * as FlexLayout from "flexlayout-react";
import { debounce } from "lodash-es";
import {
  Circle,
  CircleDot,
  FileClock,
  LayoutDashboard,
  MousePointerSquareDashed,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useTheme } from "next-themes";
import JsonView from "react18-json-view";
import type { Input as InputNode } from "rete/_types/presets/classic";
import { match, P } from "ts-pattern";
import { useStore } from "zustand";

import type { Socket } from "@seocraft/core/src/sockets";
import type { NodeProps } from "@seocraft/core/src/types";

import { updatePlaygroundLayout } from "@/actions/update-playground-layout";
import { UserNav } from "@/app/(dashboard)/components/user-nav";
import { Icons } from "@/components/icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Composer } from "@/core/composer";
import { getControl } from "@/core/control";
import { createCraftStore } from "@/core/store";
import { CraftContext, useCraftStore } from "@/core/use-store";
import { useRegisterPlaygroundActions } from "@/core/useRegisterPlaygroundActions";
import type { RouterOutputs } from "@/trpc/shared";

import { CreateReleaseButton } from "./components/create-release-button";
import { MenubarDemo } from "./components/menubar";
import { RestoreVersionButton } from "./components/restore-version-button";
import { VersionHistory } from "./components/version-history";
import { InputWindow } from "./input/input-window";
import { LogsTab } from "./logs/logs-tab";

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
          // {
          //   type: "tabset",
          //   weight: 36.11442193087009,
          //   children: [
          //     {
          //       type: "tab",
          //       name: "Inputs",
          //       component: "inputWindow",
          //       enableClose: false,
          //     },
          //   ],
          // },
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
  workflow: RouterOutputs["craft"]["module"]["get"];
  session: Session | null;
}> = observer(({ workflow, session }) => {
  const params = useParams();
  const { theme } = useTheme();

  const store = useRef(
    createCraftStore({
      layout: FlexLayout.Model.fromJson(
        (workflow.layout as FlexLayout.IJsonModel) || defaultLayout,
      ),
      theme,
      readonly: workflow.readonly,
      projectId: workflow.project.id,
      projectSlug: params.projectSlug as string,
      workflowId: workflow.id,
      workflowSlug: params.playgroundSlug as string,
      workflowVersionId: workflow.version.id,
    }),
  );

  const { layout, di, setTheme } = useStore(store.current);

  useRegisterPlaygroundActions({ di });
  // useRegisterModuleSearchActions({ di });
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
      },
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
    [layout],
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
      return <InspectorNode node={node} />;
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
        <div className="h-screen">
          <div className="flex h-10 w-full items-center justify-between border-b-2 px-2">
            <MenubarDemo />
            <div className="flex items-center space-x-2">
              {session && <UserNav session={session} />}
              <VersionHistory workflow={workflow} />
              {!workflow.version.publishedAt ? (
                <CreateReleaseButton
                  playgroundId={workflow.id}
                  version={workflow.currentVersion}
                />
              ) : (
                <RestoreVersionButton />
              )}
            </div>
          </div>
          <div className="bg-muted/20 relative h-[calc(100vh-2.5rem)] w-full px-1 py-1">
            <FlexLayout.Layout
              model={layout}
              factory={factory}
              onModelChange={(model) => debouncedLayoutChange(model)}
              onRenderTab={(node, renderValues) => {
                const component = node.getComponent();
                match(component)
                  .with("rete", () => {
                    renderValues.leading = (
                      <LayoutDashboard className="h-4 w-4" />
                    );
                  })
                  .with("inspector", () => {
                    renderValues.leading = (
                      <MousePointerSquareDashed className="h-4 w-4" />
                    );
                  })
                  .with("inputWindow", () => {
                    renderValues.leading = <Icons.input className="h-4 w-4" />;
                  })
                  .with("logs", () => {
                    renderValues.leading = <FileClock className="h-4 w-4" />;
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
        </div>
      </TooltipProvider>
    </CraftContext.Provider>
  );
});

const LoginToContinue: React.FC<{}> = ({}) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <h2 className="mb-4 text-2xl font-bold">Please login to continue</h2>
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

const InspectorWindow: React.FC<{}> = observer(({}) => {
  const di = useCraftStore((state) => state.di);
  const layout = useCraftStore((state) => state.layout);
  const selectedNode = di?.selectedNode;

  const handlePinTab = () => {
    if (!selectedNode) return;
    const tabset = layout.getActiveTabset()?.getId()!;
    layout.doAction(
      FlexLayout.Actions.addNode(
        {
          type: "tab",
          component: "inspectorNode",
          name: selectedNode.label,
          config: {
            nodeId: selectedNode.id,
          },
        },
        tabset,
        FlexLayout.DockLocation.CENTER,
        1,
      ),
    );
  };

  return (
    <>
      {selectedNode ? (
        <div className="flex h-full flex-col">
          {/* <Button onClick={handlePinTab}>Pin</Button> */}
          <InspectorNode node={selectedNode} />
        </div>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center">
          <div>Select a node to inspect</div>
          <div>
            <pre>
              <code>execId: {di?.executionId}</code>
            </pre>
          </div>
        </div>
      )}
    </>
  );
});

const InspectorNode: React.FC<{ node: NodeProps }> = ({ node }) => {
  const di = useCraftStore((state) => state.di);
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
    <div className="flex h-full w-full flex-col">
      <Tabs defaultValue="controls" className="h-full p-4">
        <TabsList>
          <TabsTrigger value="controls">Controls</TabsTrigger>
          {/* <TabsTrigger value="inputs">Inputs</TabsTrigger> */}
          <TabsTrigger value="outputs">Outputs</TabsTrigger>
        </TabsList>
        <TabsContent value="controls" className="h-full ">
          <div className="flex h-full flex-col gap-4 overflow-hidden ">
            <ScrollArea className="h-full w-full pr-4">
              {controls.map(([key, control]) => (
                <ControlWrapper key={key} control={control} label={key} />
              ))}
              <DynamicInputsForm inputs={node.inputs} />
            </ScrollArea>
          </div>
        </TabsContent>
        <TabsContent value="outputs" className="h-full">
          <ScrollArea>
            {outputs.map((output) => (
              <div key={output.key} className="">
                <Label className="capitalize">{output.key}</Label>
                {renderFieldValueBaseOnSocketType(output.socket, output.value)}
              </div>
            ))}
          </ScrollArea>
        </TabsContent>
      </Tabs>
      {state.matches("error") && (
        <div className="px-4 py-4">
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
  value: any | undefined,
) => {
  // let renderedValue = value;
  // if (renderedValue === undefined || renderedValue === null) {
  //   switch (socket.name) {
  //     case "String":
  //       renderedValue = "";
  //     case "Number":
  //       renderedValue = 0;
  //     default:
  //   }
  // }
  return match([socket, value])
    .with(
      [
        {
          name: "String",
        },
        P.string.minLength(100),
      ],
      ([socket, renderedValue]) => {
        return (
          <div>
            <Textarea value={renderedValue} rows={10} />
          </div>
        );
      },
    )
    .with(
      [
        {
          name: "Array",
          definition: {
            type: "array",
            items: {
              type: "string",
            },
            "x-cog-array-type": "iterator",
            "x-cog-array-display": "concatenate",
          },
        },
        P.any,
      ],
      ([socket, renderedValue]) => {
        return (
          <div>
            <Textarea value={renderedValue.join("")} rows={10} readOnly />
          </div>
        );
      },
    )
    .with(
      [
        {
          name: "String",
        },
        P.string.maxLength(100),
      ],
      ([socket, renderedValue]) => {
        return (
          <div className={"space-y-1"}>
            {/* <Label>{socket.definition.title || socket.definition.name}</Label> */}
            <Input value={renderedValue} readOnly />
            {/* <p className={cn("text-muted-foreground text-[0.8rem]")}>
              {socket.definition?.description}
            </p> */}
          </div>
        );
      },
    )
    .otherwise(([_, value]) => {
      return <JsonView src={value} displaySize collapsed={3} />;
    });

  // switch (socket.name) {
  //   case "String":
  //     if (renderedValue.length > 100) {
  //       return (
  //         <div>
  //           <Textarea value={renderedValue} rows={10} />
  //         </div>
  //       );
  //     }
  //     return <Input value={renderedValue} readOnly />;
  //   case "Number":
  //     return <Input type="number" value={renderedValue} readOnly />;
  //   case "Tool":
  //     return <JsonView src={renderedValue} displaySize collapsed={3} />;
  //   default:
  //     return null;
  // }
};

export const DynamicInputsForm: React.FC<{
  inputs: Record<string, InputNode<Socket> | undefined>;
}> = ({ inputs }) => {
  return (
    <>
      {Object.entries(inputs).map(([inputKey, input]) => {
        if (!input?.control || !input?.showControl) {
          if (input?.socket.name === "Trigger") return null;
          console.log(input)
          return (
            <Alert variant={"default"} key={inputKey}>
              <AlertTitle>
                Input: <Badge>{inputKey}</Badge>
              </AlertTitle>
              <AlertDescription>
                <pre>
                  <code>{JSON.stringify({ inputKey }, null, 2)}</code>
                </pre>
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
    payload: control,
  });
  const handleToggle = (val: boolean) => {
    control.actor.send({
      type: "UPDATE_SOCKET",
      params: {
        name: control.definition["x-key"],
        side: "input",
        socket: {
          "x-showSocket": val,
        },
      },
    });
  };

  const showInput = useSelector(
    control.actor,
    (snap) =>
      snap.context.inputSockets[control.definition["x-key"]]["x-showSocket"],
  );

  return (
    <>
      <div
        className="mb-2 flex flex-row space-x-1"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Toggle onPressedChange={handleToggle} pressed={showInput} size={"sm"}>
          {showInput ? (
            <CircleDot className="h-4 w-4" />
          ) : (
            <Circle className="h-4 w-4" />
          )}
        </Toggle>
        <span className="flex flex-1 flex-col">
          <ControlElement data={control} />
        </span>
      </div>
    </>
  );
};
