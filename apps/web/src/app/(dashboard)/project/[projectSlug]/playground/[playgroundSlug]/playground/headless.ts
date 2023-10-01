import { ResultOfAction } from "@/lib/type";
import { getWorkflow, getWorkflowById } from "../action";
import { createControlFlowEngine, createDataFlowEngine } from "./engine/engine";
import { importEditor } from "./io";
import { NodeEditor } from "rete";
import { Schemes } from "./types";
import { createCraftStore } from "./store";
import { Modules } from "./modules";

export async function createHeadlessEditor(
  params: ResultOfAction<typeof getWorkflow>
) {
  const editor = new NodeEditor<Schemes>();
  const engine = createControlFlowEngine();
  const dataFlow = createDataFlowEngine();
  const modules = new Modules(async ({ moduleId, overwrites }) => {
    const data = await getWorkflowById(moduleId);
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
    workflowId: params.id,
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
      nodes: params.version.nodes,
      edges: params.version.edges as any,
    }
  );
  return di;
}
