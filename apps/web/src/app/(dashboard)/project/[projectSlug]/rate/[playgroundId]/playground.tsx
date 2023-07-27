"use client";
import "reflect-metadata";

import { useRete } from "rete-react-plugin";
import { createEditor } from "./playground/editor";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { exportGraph, importGraph } from "./playground/io";

export const Playground: React.FC<{ projectId: string }> = ({}) => {
  const [ref, rete] = useRete(createEditor);
  const [storage, setStorage] = useState(null);
  useEffect(() => {
    const nodes = rete?.editor.getNodes();
  }, [rete?.editor]);
  const handleExport = async () => {
    if (!rete?.editor) return;
    const json = await exportGraph(rete?.editor);
    setStorage(json);
    console.log({ json });
  };

  const handleImport = async () => {
    if (!rete?.editor) return;
    rete.editor.clear();
    console.log({
      nodes: rete.editor.getNodes(),
    });
    const graph = await importGraph(storage, rete.editor);
    // console.log({ graph });
  };

  return (
    <>
      <Button onClick={handleExport}>Export</Button>
      <Button onClick={handleImport}>Import</Button>
      <div>
        {storage && (
          <pre>
            <code>{JSON.stringify(storage, null, 2)}</code>
          </pre>
        )}
      </div>
      <div ref={ref} className="w-screen h-[calc(100vh-20rem)]" />
    </>
  );
};
