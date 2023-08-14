"use client";
import "reflect-metadata";

import { useRete } from "rete-react-plugin";
import { createEditorFunc } from "./playground/editor";
import { useCallback, useEffect, useMemo, useState } from "react";
import { exportEditor, importEditor } from "./playground/io";
import { getPlayground, savePlayground } from "./action";
import { useParams } from "next/navigation";
import { useStore } from "./playground/store";
import { debounce } from "lodash-es";

export const Playground: React.FC<{
  playground: NonNullable<Awaited<ReturnType<typeof getPlayground>>>;
}> = ({ playground }) => {
  const createEditor = useMemo(() => {
    return createEditorFunc(playground);
  }, [playground]);
  const [ref, rete] = useRete(createEditor);
  const { di, setDi } = useStore();

  useEffect(() => {
    if (!rete) return;
    setDi(rete?.di);
  }, [rete?.di]);

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
  const params = useParams();
  useEffect(() => {
    const listener = useStore.subscribe((state) => {
      console.log("@@@@", state);
    });
    return () => {
      listener();
    };
  });

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
  console.log(di?.inspector.selectedNodeId, rete?.di.inspector.selectedNodeId);
  return (
    <div className="w-full h-full">
      <div>
        <h2>Inspector</h2>
        {JSON.stringify(di?.inspector)}
        <InspectorWindow nodeId={di?.inspector.selectedNodeId || null} />
      </div>
      <div ref={ref} className="w-full h-[calc(100vh-5rem)]" />
    </div>
  );
};

const InspectorWindow: React.FC<{ nodeId: string | null }> = ({ nodeId }) => {
  console.log(nodeId);
  return <code>selectedNode = {nodeId}</code>;
};
