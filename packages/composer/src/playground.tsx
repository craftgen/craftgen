"use client";

import "./rete.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import dynamic from "next/dynamic";
// import Link from "next/link";
// import { redirect, useParams } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import * as FlexLayout from "flexlayout-react";
import { motion } from "framer-motion";
import { debounce } from "lodash-es";
import {
  FileClock,
  LayoutDashboard,
  MousePointerSquareDashed,
} from "lucide-react";
import { useTheme } from "next-themes";
import { match, P } from "ts-pattern";
import { useStore } from "zustand";

// import { updatePlaygroundLayout } from "@/actions/update-playground-layout";
// import { UserNav } from "@/app/(dashboard)/components/user-nav";
// import { createCraftStore } from "@/core/store";
// import { CraftContext, useCraftStore } from "@/core/use-store";
import type { RouterOutputs } from "@craftgen/api";
// import type { Socket } from "@craftgen/core/sockets";
import { Button } from "@craftgen/ui/components/button";
import { Icon, Icons } from "@craftgen/ui/components/icons";
import { JSONView } from "@craftgen/ui/components/json-view";
import { Textarea } from "@craftgen/ui/components/textarea";
import { TooltipProvider } from "@craftgen/ui/components/tooltip";
import { TokenList } from "@craftgen/ui/views/token-item";

import { CreateReleaseButton } from "./components/create-release-button";
import { InspectorNode } from "./components/inspector-node";
import { MenubarDemo } from "./components/menubar";
import { RestoreVersionButton } from "./components/restore-version-button";
import { VersionHistory } from "./components/version-history";
// const Composer = dynamic(() =>
//   import("@craftgen/composer/composer").then((mod) => mod.Composer),
// );
import { Composer } from "./composer";
import { InspectorWindow } from "./inspector-window";
import { LogsTab } from "./logs/logs-tab";
import { createCraftStore } from "./store";
import { CraftContext } from "./use-store";

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
      minSize: 400,
      barSize: 40,
      size: 400,
      enableDrop: false,
      selected: 0,
      children: [
        {
          type: "tab",
          name: "Inspector",
          component: "inspector",
          enableClose: false,
          enableDrag: false,
        },
        // {
        //   type: "tab",
        //   id: "explorer",
        //   name: "Explorer",
        //   component: "explorer",
        //   enableClose: false,
        //   enableDrag: false,
        // },
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
      // {
      //   type: "row",
      //   weight: 20,
      //   minWidth: 280,
      //   children: [
      //     {
      //       type: "tabset",
      //       weight: 63.88557806912991,
      //       children: [
      //         {
      //           type: "tab",
      //           name: "Inspector",
      //           component: "inspector",
      //           enableClose: false,
      //         },
      //       ],
      //     },
      //   ],
      // },
      {
        type: "tabset",
        weight: 100,
        minWidth: 280,
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
  Link: any;
}> = ({ workflow, session, Link }) => {
  const { theme } = useTheme();

  const store = useRef(
    createCraftStore({
      layout: FlexLayout.Model.fromJson(
        (workflow.layout as FlexLayout.IJsonModel) || defaultLayout,
      ),
      theme,
      readonly: false,
      projectId: workflow.project.id,
      projectSlug: workflow.projectSlug,
      workflowId: workflow.id,
      workflowSlug: workflow.slug,
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
        // await updatePlaygroundLayout({
        //   layout: layout.toJson(),
        //   playgroundId: workflow.id,
        // });
      },
    );
    return () => layoutListener();
  }, [workflow.readonly]);

  const debouncedLayoutChange = useCallback(
    debounce(async (layout: FlexLayout.Model) => {
      if (workflow.readonly) return;
      // await updatePlaygroundLayout({
      //   layout: layout.toJson(),
      //   playgroundId: workflow.id,
      // });
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
            <TokenList projectSlug={workflow.project.slug} />
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
        return <LogsTab workflow={workflow} />;
      })
      .run();
  };

  return (
    <CraftContext.Provider value={store?.current}>
      <div className="">
        <motion.div className="relative h-[calc(100vh-4rem-2px)] bg-muted/20 px-1 py-1 ">
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
                  renderValues.content = (
                    <MousePointerSquareDashed className="h-4 w-4" />
                  );
                  renderValues.name = "Inspector";
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
    </CraftContext.Provider>
  );
};

const LoginToContinue: React.FC<{}> = ({}) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <h2 className="mb-4 text-2xl font-bold">Please login to continue</h2>
      <Button
        onClick={() => {
          // redirect("/login");
        }}
      >
        Login
      </Button>
    </div>
  );
};

// <div className="flex h-10 w-full items-center justify-between border-b-2 px-2">
//   <MenubarDemo />
//   <div className="flex items-center space-x-2">
//     {/* {session && <UserNav session={session} />} */}
//     <VersionHistory workflow={workflow} />
//     {!workflow.version?.publishedAt ? (
//       <CreateReleaseButton
//         playgroundId={workflow.id}
//         version={workflow.version?.version!}
//       />
//     ) : (
//       <RestoreVersionButton />
//     )}
//     {/* <Link href={`/${workflow.projectSlug}/settings`}>
//       <Button variant={"outline"} size={"icon"}>
//         <Icon name="settings" />
//       </Button>
//     </Link> */}
//   </div>
// </div>
