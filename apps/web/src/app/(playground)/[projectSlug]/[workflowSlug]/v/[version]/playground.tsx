"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { redirect, useParams } from "next/navigation";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Separator } from "@radix-ui/react-separator";
import type { Session } from "@supabase/supabase-js";
import { useSelector } from "@xstate/react";
import * as FlexLayout from "flexlayout-react";
import { LayoutGroup, motion } from "framer-motion";
import { debounce, groupBy, isNil } from "lodash-es";
import {
  ChevronDown,
  ChevronRight,
  Circle,
  CircleDot,
  FileClock,
  LayoutDashboard,
  MousePointerSquareDashed,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useTheme } from "next-themes";
import JsonView from "react18-json-view";
import { match, P } from "ts-pattern";
import { AnyActor, AnyActorRef } from "xstate";
import { useStore } from "zustand";

import { JSONSocket } from "@seocraft/core/src/controls/socket-generator";
import { Input } from "@seocraft/core/src/input-output";
import type { Socket } from "@seocraft/core/src/sockets";
import type { NodeProps } from "@seocraft/core/src/types";

import { updatePlaygroundLayout } from "@/actions/update-playground-layout";
import { UserNav } from "@/app/(dashboard)/components/user-nav";
import { TokenList } from "@/app/(dashboard)/project/[projectSlug]/settings/tokens/token-item";
import { Icon, Icons } from "@/components/icons";
import { JSONView } from "@/components/json-view";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { TooltipProvider } from "@/components/ui/tooltip";
// import { Composer } from "@/core/composer";
import { getControl } from "@/core/control";
import { createCraftStore } from "@/core/store";
import { CraftContext, useCraftStore } from "@/core/use-store";
import { cn } from "@/lib/utils";
import type { RouterOutputs } from "@/trpc/shared";

import { CreateReleaseButton } from "./components/create-release-button";
import { MenubarDemo } from "./components/menubar";
import { RestoreVersionButton } from "./components/restore-version-button";
import { VersionHistory } from "./components/version-history";
import { InputWindow } from "./input/input-window";
import { LogsTab } from "./logs/logs-tab";
import Markdown from "react-markdown";

import dynamic from "next/dynamic";
const Composer = dynamic(() =>
  import("@/core/composer").then((mod) => mod.Composer),
);

const defaultLayout: FlexLayout.IJsonModel = {
  global: {
    enableRotateBorderIcons: false,
  },
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
    {
      type: "border",
      location: "left",

      barSize: 40,
      enableDrop: false,
      children: [
        {
          type: "tab",
          id: "explorer",
          name: "Explorer",
          component: "explorer",
          enableClose: false,
          enableDrag: false,
        },
        {
          type: "tab",
          id: "credentials",
          name: "Credentials",
          component: "credentials",
          enableClose: false,
          enableDrag: false,
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
  workflow: RouterOutputs["craft"]["module"]["meta"];
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
      readonly: false,
      projectId: workflow.project.id,
      projectSlug: params.projectSlug as string,
      workflowId: workflow.id,
      workflowSlug: params.playgroundSlug as string,
      workflowVersionId: workflow.version?.id,
    }),
  );

  const { layout, di, setTheme } = useStore(store.current);

  useEffect(() => {
    setTheme(theme || "light");
  }, [theme]);

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
    return match(component)
      .with("credentials", () => {
        return (
          <motion.div
            animate={{
              opacity: 1,
            }}
            initial={{
              opacity: 0,
            }}
            exit={{
              opacity: 0,
            }}
          >
            <TokenList />
          </motion.div>
        );
      })
      .with("explorer", () => {
        return (
          <div className="p-4">
            <h2>Workflows</h2>
            <ul>
              <li>
                <Link href={`/${workflow.projectSlug}/${workflow.slug}`}>
                  {workflow.name}
                </Link>
              </li>
            </ul>
          </div>
        );
      })
      .with("inspector", () => {
        return <InspectorWindow />;
      })
      .with("rete", () => {
        return <Composer workflowMeta={workflow} store={store} />;
      })
      .with("inspectorNode", () => {
        const node = di?.editor.getNode(config.nodeId);
        if (!node) return null;
        return <InspectorNode node={node} />;
      })
      .with("inputWindow", () => {
        return <InputWindow />;
      })
      .with("logs", () => {
        if (workflow.readonly) {
          return <LoginToContinue />;
        }
        // return <LogsTab workflow={workflow} />;
      })
      .run();
  };

  return (
    <CraftContext.Provider value={store?.current}>
      <TooltipProvider>
        <div className="h-screen">
          <div className="flex h-10 w-full items-center justify-between border-b-2 px-2">
            <MenubarDemo />
            <div className="flex items-center space-x-2">
              {session && <UserNav session={session} />}
              {/* <VersionHistory workflow={workflow} /> */}
              {/* {!workflow.version.publishedAt ? (
                <CreateReleaseButton
                  playgroundId={workflow.id}
                  version={workflow.currentVersion}
                />
              ) : (
                <RestoreVersionButton />
              )} */}
              <Link href={`/${workflow.projectSlug}/settings`}>
                <Button variant={"outline"} size={"icon"}>
                  <Icon name="settings" />
                </Button>
              </Link>
            </div>
          </div>
          <motion.div
            className="bg-muted/20 relative h-[calc(100vh-2.5rem)] w-full px-1 py-1 "
            layout
          >
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
                  .with("explorer", () => {
                    renderValues.content = (
                      <Icons.folder className="h-6 w-6 rotate-90" />
                    );
                    renderValues.name = "Explorer";
                  })
                  .with("credentials", () => {
                    renderValues.content = (
                      <Icons.key className="h-6 w-6 rotate-90" />
                    );
                    renderValues.name = "Credentials";
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
          </motion.div>
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
  const selectedNode = useMemo(() => di?.selectedNode, [di?.selectedNodeId]);

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
        <ScrollArea className="h-full">
          <div className="mr-4 flex h-full flex-col p-4 pr-0 ">
            <InspectorNode node={selectedNode} />
          </div>
        </ScrollArea>
      ) : (
        <div className="my-auto flex h-full w-full flex-1 flex-col items-center justify-center">
          <div className="text-muted-foreground border-spacing-3 border  border-dashed p-4 py-6 font-sans text-xl font-bold">
            Select a node to inspect
          </div>
        </div>
      )}
    </>
  );
});

const InspectorNode: React.FC<{ node: NodeProps }> = observer(({ node }) => {
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
  const di = useCraftStore((state) => state.di);
  const runs = useSelector(di?.actor!, (state) =>
    Object.entries(state.children)
      .filter(([key, child]) => key.startsWith("call"))
      .filter(
        ([key, child]) =>
          child.getSnapshot().context.parent.id === node.actor.id,
      )
      .map(([key, child]) => child),
  );

  console.log("RUNS", runs);

  return (
    <div className="flex h-full w-full flex-1 flex-col">
      <Tabs defaultValue="controls">
        <TabsList>
          <TabsTrigger value="controls">Controls</TabsTrigger>
          <TabsTrigger value="outputs">Outputs</TabsTrigger>
        </TabsList>
        <TabsContent value="controls" className="h-full ">
          <div className="flex h-full flex-col gap-4 overflow-hidden ">
            <ScrollArea className="w-full">
              {controls.map(([key, control]) => (
                <ControlWrapper key={key} control={control} label={key} />
              ))}
              <DynamicInputsForm inputs={node.inputs} />
              <Separator />
              {runs && <Runs runs={runs} />}
            </ScrollArea>
          </div>
        </TabsContent>
        <TabsContent value="outputs" className="h-full">
          <ScrollArea>
            {outputs.map((output) => (
              <div key={output.key}>
                <Label className="capitalize">{output.key}</Label>
                {renderFieldValueBaseOnSocketType(output.socket, output.value)}
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
});

const Runs = ({ runs }: { runs: AnyActorRef[] }) => {
  return (
    <div className="mt-4 space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">Runs</h3>
        {/* <Button
          variant={"outline"}
          disabled={!state.can({ type: "RESET" })}
          onClick={() =>
            actor.send({
              type: "RESET",
            })
          }
        >
          Reset
        </Button> */}
      </div>

      <div className="flex flex-col space-y-2">
        {runs.length === 0 && (
          <div className="flex flex-col items-center justify-center space-y-2">
            <Icons.bird className="h-12 w-12" />
            <span className="text-muted-foreground">
              No runs available, when it happens it will show up here.
            </span>
          </div>
        )}
        {runs.map((run) => {
          return <Run key={run.id} run={run} />;
        })}
      </div>
    </div>
  );
};

const Run = ({ run }: { run: AnyActorRef }) => {
  const state = useSelector(run, (state) => state);
  console.log(state);
  return (
    <div className="bg-muted/20 flex flex-col space-y-2 rounded border p-2">
      <div className="flex flex-row items-center justify-between ">
        <div className="flex  items-center space-x-2">
          <Label>Run Id</Label>
          <Badge variant={"outline"}>{run.id}</Badge>
        </div>
        <div className="flex flex-row space-x-1">
          <Badge className={cn(state.status === "done" && "bg-green-400")}>
            {state.value}
          </Badge>
          {state.value === "error" && state.can({ type: "RETRY" }) && (
            <Button
              variant={"outline"}
              size={"sm"}
              onClick={() =>
                run.send({
                  type: "RETRY",
                })
              }
            >
              Retry
            </Button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-muted/30 border-1 rounded p-2">
          <Label>Input</Label>
          <div className="p-2">
            <JSONView src={state.context.inputs} />
          </div>
        </div>
        <div className="bg-muted/30 border-1 rounded p-2">
          <Label>Output</Label>
          <div className="p-2">
            <JSONView src={state.context.outputs} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const renderFieldValueBaseOnSocketType = (
  socket: Socket,
  value: any | undefined,
) => {
  return match([socket, value])
    .with(
      [
        {
          name: "string",
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
          name: "array",
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
          name: "string",
        },
        P.string.maxLength(100),
      ],
      ([socket, renderedValue]) => {
        return (
          <div className={"space-y-1"}>
            <Textarea value={renderedValue} readOnly />
          </div>
        );
      },
    )
    .otherwise(([_, value]) => {
      return <JsonView src={value} displaySize collapsed={3} />;
    });
};

export const DynamicInputsForm: React.FC<{
  inputs: Record<string, Input<AnyActor, Socket>>;
}> = observer(({ inputs }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { true: advanceInputs, false: basicInputs } = useMemo(() => {
    return (
      groupBy(Object.values(inputs), (input) => {
        return input.definition["x-isAdvanced"] || false;
      }) || { true: [], false: [] }
    );
  }, [inputs]);

  return (
    <motion.div>
      <LayoutGroup>
        {basicInputs?.map((input) => {
          return <InputWrapper key={input.definition["x-key"]} input={input} />;
        })}
        {advanceInputs?.length > 0 && (
          <div
            className={cn("flex w-full items-center justify-center divide-x-2")}
          >
            <Button
              variant={showAdvanced ? "outline" : "ghost"}
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? "Hide" : "Show"} Advance Settings
            </Button>
          </div>
        )}
        {showAdvanced &&
          advanceInputs?.map((input) => {
            return (
              <InputWrapper key={input.definition["x-key"]} input={input} />
            );
          })}
      </LayoutGroup>
    </motion.div>
  );
});

export const InputWrapper: React.FC<{ input: Input }> = observer(
  ({ input }) => {
    if (!input.control) {
      return (
        <Alert variant={"default"} key={input.label}>
          <AlertTitle>
            Input: <Badge>{input.id}</Badge>
          </AlertTitle>
          <AlertDescription>
            This input controlled by the incoming connection.
          </AlertDescription>
        </Alert>
      );
    }
    const handleToggleSocket = (val: boolean) => {
      input.actor.send({
        type: "UPDATE_SOCKET",
        params: {
          name: input.definition["x-key"],
          side: "input",
          socket: {
            "x-showSocket": val,
          },
        },
      });
    };

    const definition = useSelector(input.actor, input.selector);
    const connections = useMemo(() => {
      return Object.entries(definition["x-connection"] || {});
    }, [definition["x-connection"]]);
    const hasConnection = useMemo(() => {
      return connections.length > 0;
    }, [connections]);
    const handleToggleController = (val: boolean) => {
      input.actor.send({
        type: "UPDATE_SOCKET",
        params: {
          name: input.definition["x-key"],
          side: "input",
          socket: {
            "x-showControl": val,
          },
        },
      });
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        exit={{ opacity: 0 }}
        className={cn(
          "mb-2 flex flex-row space-x-1 p-2",
          hasConnection && "bg-muted/30 rounded border",
        )}
      >
        <div className="flex flex-col space-y-1">
          <Toggle
            onPressedChange={handleToggleSocket}
            pressed={definition["x-showSocket"]}
            size={"sm"}
            disabled={hasConnection}
          >
            {definition["x-showSocket"] ? (
              <CircleDot className="h-4 w-4" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
          </Toggle>
          {definition["x-actor-ref"] && (
            <Toggle
              variant={"default"}
              size={"sm"}
              onPressedChange={handleToggleController}
            >
              {definition["x-showControl"] ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Toggle>
          )}
        </div>
        <ControlWrapper control={input.control} definition={definition} />
      </motion.div>
    );
  },
);

export const ControlWrapper: React.FC<{
  control: any;
  definition: JSONSocket;
}> = observer(({ control, definition }) => {
  const ref = useRef<HTMLDivElement>(null);
  const ControlElement = getControl({
    element: ref.current!,
    type: "control",
    payload: control,
  });

  return (
    <>
      <div
        className="flex flex-1 flex-col"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <ControlElement data={control} />
      </div>
    </>
  );
});
