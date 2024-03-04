"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { redirect, useParams } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import * as FlexLayout from "flexlayout-react";
import { motion } from "framer-motion";
import { debounce } from "lodash-es";
import {
  FileClock,
  LayoutDashboard,
  MousePointerSquareDashed,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useTheme } from "next-themes";
import JsonView from "react18-json-view";
import { match, P } from "ts-pattern";
import { useStore } from "zustand";

import type { Socket } from "@seocraft/core/src/sockets";

import { updatePlaygroundLayout } from "@/actions/update-playground-layout";
import { UserNav } from "@/app/(dashboard)/components/user-nav";
import { TokenList } from "@/app/(dashboard)/[projectSlug]/settings/tokens/token-item";
import { Icon, Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createCraftStore } from "@/core/store";
import { CraftContext, useCraftStore } from "@/core/use-store";
import type { RouterOutputs } from "@/trpc/shared";

import { CreateReleaseButton } from "./components/create-release-button";
import { MenubarDemo } from "./components/menubar";
import { RestoreVersionButton } from "./components/restore-version-button";
import { VersionHistory } from "./components/version-history";

import dynamic from "next/dynamic";
import { InspectorNode } from "./components/inspector-node";
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
}> = ({ workflow, session }) => {
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
      workflowSlug: params.workflowSlug as string,
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
              <VersionHistory workflow={workflow} />
              {!workflow.version?.publishedAt ? (
                <CreateReleaseButton
                  playgroundId={workflow.id}
                  version={workflow.version?.version!}
                />
              ) : (
                <RestoreVersionButton />
              )}
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
};

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
        <InspectorNode node={selectedNode} />
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
