import { createMiddleware } from "npm:hono/factory";

const actor = createMiddleware(async (c, next) => {
  console.log(`[${c.req.method}] ${c.req.url}`);
  await next();
});
