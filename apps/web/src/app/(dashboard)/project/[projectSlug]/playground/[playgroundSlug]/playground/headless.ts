import { ResultOf } from "@/lib/type";
import { getPlayground, getPlaygroundById } from "../action";
import { createControlFlowEngine, createDataFlowEngine } from "./engine/engine";
import { importEditor } from "./io";
import { NodeEditor } from "rete";
import { Schemes } from "./types";
import { createCraftStore } from "./store";
import { Modules } from "./modules";

export async function createHeadlessEditor(
  params: ResultOf<typeof getPlayground>
) {
  const editor = new NodeEditor<Schemes>();
  const engine = createControlFlowEngine();
  const dataFlow = createDataFlowEngine();
  const modules = new Modules(async ({ moduleId, overwrites }) => {
    const data = await getPlaygroundById(moduleId);
    if (!data) throw new Error(`Module ${moduleId} not found`);
    await importEditor(
      {
        ...di,
        ...overwrites,
      },
      {
        nodes: data.nodes as any,
        edges: data.edges as any,
      }
    );
  });
  const di = {
    editor,
    engine,
    dataFlow,
    modules,
  } as any;

  const store = createCraftStore({
    di,
    playgroundId: params.id,
    projectId: params.project.id,
  });

  di.store = store;

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
  return di;
}
