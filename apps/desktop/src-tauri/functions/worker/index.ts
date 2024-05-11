interface requestPayload {
	code: string;
	context: object;
}

Deno.serve(async (req: Request) => {
	const { code, context }: requestPayload = await req.json();

	const result = (new Function(...Object.keys(context), `return (${code});`))(...Object.values(context));

	return new Response(
		JSON.stringify({
			result,
			status: 'not bad'
		}),
		{ headers: { 'Content-Type': 'application/json', 'Connection': 'keep-alive' } },
	);
});
