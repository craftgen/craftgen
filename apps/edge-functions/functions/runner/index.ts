// import {Editor } from '../../core/src/index.ts'
// import { Editor } from 'https://github.com/craftgen/craftgen/raw/main/apps/core/src/editor.ts'
import {getModels} from './ollama.ts'
import express from "npm:express@4";

const app = express();

app.get("/", (request, response) => {
  response.send("Hello from Express!");
});

// app.listen(3000);

interface requestPayload {
  code: string;
  context: object;
}

Deno.serve(async (req: Request) => {
  const { code, context }: requestPayload = await req.json();
  // console.log('Editor', Editor)
  const models = await getModels();


  console.log("THE APP", app);
  return new Response(
    JSON.stringify({
      models,
      ok: true,
    }),
    {
      headers: {
        "Content-Type": "application/json",
        Connection: "keep-alive",
      },
    },
  );
});
