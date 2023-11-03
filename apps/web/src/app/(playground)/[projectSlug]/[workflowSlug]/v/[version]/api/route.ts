import { NextResponse } from "next/server";

import { getWorkflow } from "@/actions/get-workflow";
import { client } from "@/trigger";

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: { projectSlug: string; playgroundSlug: string; version: string };
  },
) {
  const input = await request.json();
  console.log("req", input, params);

  const workflow = await getWorkflow({
    workflowSlug: params.playgroundSlug,
    projectSlug: params.projectSlug,
    version: Number(params.version),
  });
  console.log("playground", workflow);
  if (!workflow.data) {
    throw new Error("Workflow not found 1");
  }

  await client.sendEvent({
    name: "workflow.execute",
    payload: {
      workflowSlug: params.playgroundSlug,
      projectSlug: params.projectSlug,
      version: params.version,
    },
  });

  // const di = await createHeadlessEditor(workflow.data);
  // const a = JSON.parse(
  //   '{"value":"connected","done":false,"context":{"moduleId":"ef1de145-35bf-476c-b5ce-c038ecd86c9b","inputId":"3f0d7e8e-d0b9-4fba-9da8-8ff14c25de17","inputs":[{"name":"title","type":"string","description":""}],"outputs":["input"],"error":null,"inputData":{"title":["1f1f"]},"outputData":{"input":["Hello 1f1f"]}},"historyValue":{},"_internalQueue":[],"children":{},"tags":[],"meta":{}}'
  // );
  // const craft = new ModuleNode(di as any, { state: a } as any);
  // console.log("module", craft.module);
  // while (!craft.module) {
  //   await new Promise((resolve) => setTimeout(resolve, 10));
  // }
  // const data = await craft.module?.exec(
  //   "3f0d7e8e-d0b9-4fba-9da8-8ff14c25de17",
  //   input
  // );
  // console.log("res", data);

  return NextResponse.json({
    hello: "world",
    // data,
  });
}
