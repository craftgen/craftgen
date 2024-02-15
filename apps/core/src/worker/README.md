JS worker evaluates arbitrary JS code in a safe sandbox. Check `main.ts` as an entry point to the code.

We define an async messaging interface (`messenger.ts`) on top of the default `.postMessage` interface of WebWorkers for an easier DX.

To summarize, this bit of code can;

- Create a sandboxed JS execution environment.
- Define async interface on top of WebWorker API.
- Execute arbitrary `async` JS.
- Install/Uninstall CDN Libraries into the sandbox.
- Provide tern autocomplete generation for CDN libraries.

## JS Evaluation

Check `worker-internal/eval.ts` for the heart of JS evaluation. We opted for indirect eval so that we can prevent local scope access. All JS code executes within the global scope of their sandbox.

## CDN Libraries

`js-library` and `worker-internal/handlers/jsLibrary.ts` defines necessary logic to install/uninstall libraries into the sandbox. We use [`importScripts`](https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/importScripts) and dynamic `import` for levaraging CDN libraries but since these are very basic methods, we handle generating library accessors, handling namespace clashes and safely removing libraries.

## NodeJS Support

In theory, (almost) all the API we define here is NodeJS worker compatible so we can load the entry into a Node worker and fire it up. However, this is not tested yet. Only `importScripts` require a [polyfill](https://github.com/JamesJansson/importScripts/blob/master/importscripts.js).

Extra:

- [Node worker threads](https://nodejs.org/api/worker_threads.html)
