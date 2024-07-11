export const createWorker = async (params: {
  moduleCode?: string;
  servicePath?: string;
}) => {
  const memoryLimitMb = 150;
  const workerTimeoutMs = 5 * 60 * 1000;
  const noModuleCache = false;

  // you can provide an import map inline
  // const inlineImportMap = {
  //   imports: {
  //     "std/": "https://deno.land/std@0.131.0/",
  //     "cors": "./examples/_shared/cors.ts"
  //   }
  // }

  // const importMapPath = `data:${encodeURIComponent(JSON.stringify(importMap))}?${encodeURIComponent('/home/deno/functions/test')}`;
  const importMapPath = null;
  const envVarsObj = Deno.env.toObject();
  const envVars = Object.keys(envVarsObj).map((k) => [k, envVarsObj[k]]);
  const forceCreate = true;
  const netAccessDisabled = false;

  // load source from an eszip
  //const maybeEszip = await Deno.readFile('./bin.eszip');
  //const maybeEntrypoint = 'file:///src/index.ts';

  // const maybeEntrypoint = 'file:///src/index.ts';
  // or load module source from an inline module

  const maybeModuleCode = `
    const moduleCodeWithTests = \`
    import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
    export default interface Person {
      firstName: string;
      lastName: string;
    }

    export function sayHello(p: Person): string {
      return "Hello, " + p.firstName + "!";
    }

    Deno.test("sayHello function", () => {
      const grace: Person = {
        lastName: "Hopper",
        firstName: "Grace",
      };

      assertEquals("Hello, Grace 2!", sayHello(grace));
    });
    console.log(sayHello({ firstName: "Grace", lastName: "Hopper" }));
    \`;
      Deno.serve((req) => new Response(moduleCodeWithTests));
      `;

  //k
  const cpuTimeSoftLimitMs = 10000;
  const cpuTimeHardLimitMs = 20000;

  return await EdgeRuntime.userWorkers.create({
    servicePath: params.servicePath,
    memoryLimitMb,
    workerTimeoutMs,
    noModuleCache,
    importMapPath,
    envVars,
    forceCreate,
    netAccessDisabled,
    cpuTimeSoftLimitMs,
    cpuTimeHardLimitMs,

    // maybeEszip,
    // maybeEntrypoint,
    // maybeModuleCode: maybeModuleCode,
  });
};
