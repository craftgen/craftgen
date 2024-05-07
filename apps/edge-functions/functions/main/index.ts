// TODO: Add separate worker per session
import { STATUS_CODE } from "https://deno.land/std/http/status.ts";


Deno.serve(async (req: Request) => {
	const url = new URL(req.url);
	const { pathname } = url;

	if (pathname === '/_internal/health') {
		return new Response(
			JSON.stringify({ 'message': 'ok' }),
			{ status: 200, headers: { 'Content-Type': 'application/json' } },
		);
	}

	if (pathname === '/_internal/metric') {
		const metric = await EdgeRuntime.getRuntimeMetrics();
		return Response.json(metric);
	}

	const createWorker = async () => {
		return await EdgeRuntime.userWorkers.create({
			cpuTimeHardLimitMs: 20_000,
			cpuTimeSoftLimitMs: 10_000,
			envVars: [],
			forceCreate: false,
			importMapPath: null,
			memoryLimitMb: 100,
			netAccessDisabled: true,
			noModuleCache: false,
			servicePath: "/home/deno/functions/worker",
			workerTimeoutMs: 10_000,
		});
	};

	const callWorker = async () => {
		try {
			const worker = await createWorker();
			const controller = new AbortController();

			const signal = controller.signal;

			//setTimeout(() => controller.abort(), 10_000);

			return await worker.fetch(req, { signal });
		} catch (e) {
			console.error(e);

			if (e instanceof Deno.errors.WorkerRequestCancelled) {
				console.log('cancelled!');
			}

			const error = { msg: e.toString() };

			return new Response(
				JSON.stringify(error),
				{ status: 500, headers: { 'Content-Type': 'application/json' } },
			);
		}
	};

	return callWorker();
});

console.log('code evaluator service started');
