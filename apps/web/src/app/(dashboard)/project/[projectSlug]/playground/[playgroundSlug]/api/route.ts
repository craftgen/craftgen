import { NextResponse } from "next/server";
import { getPlayground, getPlaygroundById } from "../action";
import { createHeadlessEditor } from "../playground/headless";
import { ModuleNode } from "../playground/nodes";

export async function POST(
  request: Request,
  { params }: { params: { projectSlug: string; playgroundSlug: string } }
) {
  const input = await request.json();
  console.log("req", input, params);

  const playground = await getPlayground({
    playgroundSlug: params.playgroundSlug,
    projectSlug: params.projectSlug,
  });
  console.log("playground", playground);

  const di = await createHeadlessEditor(playground);
  const a = JSON.parse(
    '{"value":"connected","done":false,"context":{"moduleId":"ef1de145-35bf-476c-b5ce-c038ecd86c9b","inputId":"3f0d7e8e-d0b9-4fba-9da8-8ff14c25de17","inputs":[{"name":"title","type":"string","description":""}],"outputs":["input"],"error":null,"inputData":{"title":["1f1f"]},"outputData":{"input":["Hello 1f1f"]}},"historyValue":{},"_internalQueue":[],"children":{},"tags":[],"meta":{}}'
  );
  const module = new ModuleNode(di as any, { state: a } as any);
  console.log("module", module.module);
  while (!module.module) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const data = await module.module?.exec(
    "3f0d7e8e-d0b9-4fba-9da8-8ff14c25de17",
    input
  );
  console.log("res", data);
  // console.log({
  //   module,
  // });
  // module.actor.send({
  //   type: "RUN",
  //   inputData: {
  //     title: ["neco"],
  //   },
  // });
  // const data = await new Promise((resolve) => {
  //   module.actor.subscribe((state) => {
  //     console.log("STATE", state.value);
  //     console.log("STATE", state.context);
  //     if (state.matches("complete")) {
  //       console.log("COMPLETE", { message: state.context.message });
  //       resolve(state.context);
  //     }
  //   });
  // });

  return NextResponse.json({
    hello: "world",
    data,
  });
}
