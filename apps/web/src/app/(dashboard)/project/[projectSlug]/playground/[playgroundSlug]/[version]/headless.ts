import { ResultOfAction } from "@/lib/type";
import { getWorkflow, getWorkflowById } from "../action";
import { createControlFlowEngine, createDataFlowEngine } from "./engine/engine";
import { importEditor } from "./io";
import { NodeEditor } from "rete";
import { Schemes } from "./types";
import { createCraftStore } from "./store";
import { Modules } from "./modules";
import { DiContainer } from "./editor";

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
        ...(di as DiContainer),
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
    headless: true,
  };

  const store = createCraftStore({
    di: di as DiContainer,
    workflowId: params.id,
    projectId: params.project.id,
  });

  (di as any).store = store;

  editor.use(engine);
  editor.use(dataFlow);

  await importEditor(di as any, {
    nodes: params.version.nodes,
    edges: params.version.edges as any,
  });
  return di;
}
