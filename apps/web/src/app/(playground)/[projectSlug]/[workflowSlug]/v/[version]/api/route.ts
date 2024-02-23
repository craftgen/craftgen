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
    workflowSlug: params.workflowSlug,
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
      workflowSlug: params.workflowSlug,
      projectSlug: params.projectSlug,
      version: params.version,
    },
  });

  return Response.json({
    hello: "world",
  });
}
