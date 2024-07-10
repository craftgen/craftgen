import type { AnyRouter } from 'npm:@trpc/server@11.0.0-rc.452'
import type {
  FetchCreateContextFnOptions,
  FetchHandlerRequestOptions,
} from 'npm:@trpc/server@11.0.0-rc.452/adapters/fetch'
import { fetchRequestHandler } from 'npm:@trpc/server@11.0.0-rc.452/adapters/fetch'
import type { Context, MiddlewareHandler } from 'npm:hono'

type tRPCOptions = Omit<
  FetchHandlerRequestOptions<AnyRouter>,
  'req' | 'endpoint' | 'createContext'
> &
  Partial<Pick<FetchHandlerRequestOptions<AnyRouter>, 'endpoint'>> & {
    createContext?(
      opts: FetchCreateContextFnOptions,
      c: Context
    ): Record<string, unknown> | Promise<Record<string, unknown>>
  }

export const trpcServer = ({
  endpoint = '/trpc',
  createContext,
  ...rest
}: tRPCOptions): MiddlewareHandler => {
  return async (c) => {
    const res = fetchRequestHandler({
      ...rest,
      createContext: async (opts) => ({
        ...(createContext ? await createContext(opts, c) : {}),
        // propagate env by default
        env: c.env,
      }),
      endpoint,
      req: c.req.raw,
    }).then((res) => c.body(res.body, res))
    return res
  }
}