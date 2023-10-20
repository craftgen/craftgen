// import { ResultOfAction } from "@/lib/type";
import { createControlFlowEngine, createDataFlowEngine } from "./engine";
import { importEditor } from "./io";
import { NodeEditor } from "rete";
import type { DiContainer, Schemes } from "./types";
import { Modules } from "./modules";
import { structures } from "rete-structures";

// import { getWorkflow } from "@/actions/get-workflow";
// import { getWorkflowById } from "@/actions/get-workflow-by-id";

export async function createHeadlessEditor(
  // params: ResultOfAction<typeof getWorkflow>,
  params: any,
  overwrites?: Partial<DiContainer>
) {
  const editor = new NodeEditor<Schemes>();
  const engine = createControlFlowEngine();
  const dataFlow = createDataFlowEngine();
  const modules = new Modules(async ({ moduleId, overwrites }) => {
    // const data = await getWorkflowById(moduleId);
    const data = { nodes: [], edges: [] };
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
  const graph = structures(editor);
  const di: DiContainer = {
    editor,
    engine,
    dataFlow,
    modules,
    graph,
    headless: true,
    logger: console,
    ...overwrites,
  };

  editor.use(engine);
  editor.use(dataFlow);

  await importEditor(di, {
    nodes: params.nodes,
    edges: params.edges,
  });
  return di;
}
