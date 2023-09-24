import { NextResponse } from "next/server";
import { getPlayground, getPlaygroundById } from "../action";
import { createHeadlessEditor } from "../playground/headless";

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

  const { dataFlow, editor, engine } = await createHeadlessEditor(playground);
  console.log({
    dataFlow,
    editor,
    engine,
  });

  return NextResponse.json({
    hello: "world",
  });
}
