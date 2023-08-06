"use client";
import "reflect-metadata";

import { useRete } from "rete-react-plugin";
import { createEditor } from "./playground/editor";
import { useCallback, useEffect, useMemo, useState } from "react";
import { exportEditor, importEditor } from "./playground/io";
import { getPlayground, savePlayground } from "./action";
import { useParams } from "next/navigation";
import { useStore } from "./playground/store";
import { debounce } from "lodash-es";

export const Playground: React.FC<{
  playground: NonNullable<Awaited<ReturnType<typeof getPlayground>>>;
}> = ({ playground }) => {
  const c = useCallback(
    (el: HTMLElement) => createEditor(el, playground),
    [playground]
  );
  const [ref, rete] = useRete(c);
  const { setDi } = useStore();

  useEffect(() => {
    if (!rete) return;
    setDi(rete?.di);
  }, [rete?.di]);

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
    (data: any) => {
      const json = exportEditor(rete?.di.editor!);
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
      console.log("context", context);
      switch (context.type) {
        case "nodecreated":
        case "noderemoved":
        case "connectioncreated":
        case "connectionremoved":
          onChange(context);
        default:
          console.log("context", context);
      }

      return context;
    });
  }, [rete]);

  return (
    <div className="w-full h-full border-2 border-pink-400/30 rounded">
      <div ref={ref} className="w-full h-[calc(100vh-5rem)]" />
    </div>
  );
};
