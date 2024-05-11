interface requestPayload {
  workflowSlug: string;
  projectSlug: string;
  version: number;
}

Deno.serve(async (req: Request) => {
  const { code, context }: requestPayload = await req.json();

  const result = new Function(...Object.keys(context), `return (${code});`)(
    ...Object.values(context),
  );

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json", Connection: "keep-alive" },
  });
});
