import { ResultOf } from "@/lib/type";
import { getPlayground } from "../action";
import { createControlFlowEngine, createDataFlowEngine } from "./engine";
import { importEditor } from "./io";
import { NodeEditor } from "rete";
import { Schemes } from "./types";

export async function createHeadlessEditor(
  params: ResultOf<typeof getPlayground>
) {
  const editor = new NodeEditor<Schemes>();
  const engine = createControlFlowEngine();
  const dataFlow = createDataFlowEngine();

  editor.use(engine);
  editor.use(dataFlow);

  await importEditor(
    {
      editor,
    } as any,
    {
      nodes: params.nodes,
      edges: params.edges as any,
    }
  );
  return {
    editor,
    engine,
    dataFlow,
  };
}
