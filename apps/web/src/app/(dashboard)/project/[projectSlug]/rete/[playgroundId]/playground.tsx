"use client";
import "reflect-metadata";

import { useRete } from "rete-react-plugin";
import { createEditor } from "./playground/editor";
import { useCallback, useEffect, useState } from "react";
import { exportEditor, importEditor } from "./playground/io";
import { getPlayground, savePlayground } from "./action";
import { useParams } from "next/navigation";

export const Playground: React.FC<{
  playground: NonNullable<Awaited<ReturnType<typeof getPlayground>>>;
}> = ({ playground }) => {
  const [ref, rete] = useRete(createEditor);
  const [dehydrated, setDehydration] = useState(false);
  useEffect(() => {
    if (!dehydrated && rete?.di) {
      importEditor(rete?.di, {
        edges: playground.edges as any,
        nodes: playground.nodes as any,
      });
      rete.di.setUI();
      rete.di.dataFlow?.reset();
      setDehydration(true);
    }
  }, [rete, dehydrated]);
  const params = useParams();
  const onChange = useCallback(
    (data: any) => {
      const json = exportEditor(rete?.di.editor!);
      savePlayground({
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
      onChange(context);
      return context;
    });
  }, [rete]);

  return (
    <div className="w-full h-full border-2 border-pink-400/30 rounded">
      <div ref={ref} className="w-full h-[calc(100vh-5rem)]" />
    </div>
  );
};
