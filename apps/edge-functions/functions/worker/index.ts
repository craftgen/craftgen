interface requestPayload {
  code: string;
  context: object;
}

Deno.serve(async (req: Request) => {
  const { code, context }: requestPayload = await req.json();

  try {
    const evalll = new Function(...Object.keys(context), `return (${code});`);
    const result = await evalll(...Object.values(context));
    return new Response(
      JSON.stringify({
        result,
        ok: true,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          Connection: "keep-alive",
        },
      },
    );
  } catch (e) {
		return new Response(
			JSON.stringify({
				result: e.message,
				ok: false,
			}),
			{
				headers: {
					"Content-Type": "application/json",
					Connection: "keep-alive",
				},
			},
		);
  }
});
