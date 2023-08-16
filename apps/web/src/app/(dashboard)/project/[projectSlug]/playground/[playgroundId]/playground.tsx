"use client";
import "reflect-metadata";

import { Presets, useRete } from "rete-react-plugin";
import { createEditorFunc } from "./playground/editor";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { exportEditor, importEditor } from "./playground/io";
import { getPlayground, savePlayground, savePlaygroundLayout } from "./action";
import { useParams } from "next/navigation";
import {
  CraftContext,
  createCraftStore,
  useCraftStore,
} from "./playground/store";
import { debounce } from "lodash-es";
import GridLayout, { WidthProvider } from "react-grid-layout";
import { Grip, Maximize } from "lucide-react";
import { useStore } from "zustand";
import { NodeProps } from "./playground/types";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getControl } from "./playground/control";

export const Playground: React.FC<{
  playground: NonNullable<Awaited<ReturnType<typeof getPlayground>>>;
}> = ({ playground }) => {
  const params = useParams();
  const store = useRef(
    createCraftStore({
      layout: playground.layout as any,
      projectSlug: params.projectSlug as string,
      playgroundId: params.playgroundId as string,
    })
  );
  const createEditor = useMemo(() => {
    return createEditorFunc(playground, store.current);
  }, [playground, store.current]);
  const [ref, rete] = useRete(createEditor);
  const { di, layout, setLayout } = useStore(store.current);

  useEffect(() => {
    setLayout(playground.layout as GridLayout.Layout[]);
    const layoutListener = store.current.subscribe(
      (state) => state.layout,
      async (layout) => {
        await savePlaygroundLayout({
          layout,
          playgroundId: playground.id,
        });
      }
    );
    return () => layoutListener();
  }, []);

  const saveDebounced = debounce(
    (state) =>
      savePlayground({
        projectSlug: params.projectSlug as string,
        playgroundId: params.playgroundId as string,
        nodes: state.nodes,
        edges: state.edges,
      }),
    2000
  );

  const onChange = useCallback(
    async (data: any) => {
      const json = await exportEditor(rete?.di.editor!);
      console.log("@@@@@@@", { json });
      saveDebounced({
        projectSlug: params.projectSlug as string,
        playgroundId: params.playgroundId as string,
        nodes: json.nodes,
        edges: json.edges,
      });
    },
    [rete]
  );

  useEffect(() => {
    rete?.editor.addPipe((context) => {
      switch (context.type) {
        case "nodecreated":
        case "noderemoved":
        case "connectioncreated":
        case "connectionremoved":
          onChange(context);
        default:
      }

      return context;
    });
  }, [rete]);

  return (
    <CraftContext.Provider value={store?.current}>
      <TooltipProvider>
        <div className="w-full h-full bg-muted/20 min-h-[calc(100vh-5rem)] py-1 px-1">
          <ResponsiveGridLayout
            className="layout"
            layout={layout}
            onLayoutChange={setLayout}
            cols={12}
            margin={[2, 2]}
            rowHeight={60}
            draggableHandle=".draggable-handle"
          >
            <div key={"rete"} className="border-2 bg-background">
              <div className="absolute top-1 right-1 z-50 flex ">
                <div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={"ghost"}
                        size="icon"
                        onClick={() => di?.setUI()}
                      >
                        <Maximize />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Center the content</TooltipContent>
                  </Tooltip>
                </div>
                <div className="draggable-handle cursor-move ">
                  <Button variant={"ghost"} size="icon">
                    <Grip />
                  </Button>
                </div>
              </div>

              <div ref={ref} className="w-full h-full " />
            </div>
            <div
              key={"inspector"}
              className="border-2 p-4 bg-background rounded"
            >
              <InspectorWindow />
            </div>
          </ResponsiveGridLayout>
        </div>
      </TooltipProvider>
    </CraftContext.Provider>
  );
};

const ResponsiveGridLayout = WidthProvider(GridLayout);

const InspectorWindow: React.FC<{}> = ({}) => {
  const di = useCraftStore((state) => state.di);
  const selectedNodeId = useCraftStore((state) => state.selectedNodeId);
  const selectedNode = selectedNodeId && di?.editor.getNode(selectedNodeId);
  console.log(selectedNode);
  return (
    <div className="w-full h-full flex flex-col">
      {selectedNode ? (
        <InspectorNode node={selectedNode} />
      ) : (
        <div className="flex items-center justify-center w-full h-full">
          Select a node to inspect
        </div>
      )}
    </div>
  );
};
const InspectorNode: React.FC<{ node: NodeProps }> = ({ node }) => {
  const controls = Object.entries(node.controls);
  return (
    <div className="h-full w-full flex flex-col">
      <h4 className="font-bold">{node.label}</h4>
      <div className="flex flex-col h-full overflow-hidden">
        {controls.map(([key, control]) => (
          <ControlWrapper key={key} control={control} />
        ))}
      </div>
    </div>
  );
};

const ControlWrapper: React.FC<{ control: any }> = ({ control }) => {
  const ref = useRef<HTMLDivElement>(null);
  const ControlElement = getControl({
    element: ref.current!,
    type: "control",
    payload: control!,
  });
  return (
    <>
      <div ref={ref} />
      <ControlElement data={control} />
    </>
  );
};
