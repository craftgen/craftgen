"use client";
import "reflect-metadata";

import { useRete } from "rete-react-plugin";
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
import { Grip } from "lucide-react";
import { useStore } from "zustand";

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

  const [dehydrated, setDehydration] = useState(false);

  useEffect(() => {
    if (!dehydrated && rete?.di) {
      (async () => {
        await importEditor(rete?.di, {
          edges: playground.edges as any,
          nodes: playground.nodes as any,
        });
        await rete.di.setUI();
      })();
      // rete.di.dataFlow?.reset();
      setDehydration(true);
    }
  }, [rete, dehydrated]);

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
            <div className="draggable-handle cursor-move absolute top-1 right-1 z-50">
              <Grip />
            </div>
            <div ref={ref} className="w-full h-full " />
          </div>
          <div key={"inspector"} className="border-2 p-4 bg-background">
            <InspectorWindow nodeId={di?.inspector.selectedNodeId || null} />
          </div>
        </ResponsiveGridLayout>
      </div>
    </CraftContext.Provider>
  );
};

const ResponsiveGridLayout = WidthProvider(GridLayout);

const InspectorWindow: React.FC<{ nodeId: string | null }> = ({ nodeId }) => {
  const selectedNodeId = useCraftStore((state) => state.selectedNodeId);
  return <code>selectedNode = {selectedNodeId}</code>;
};
