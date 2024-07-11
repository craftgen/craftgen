import { Hono } from "jsr:@hono/hono";

interface NodeRouter {
  basePath: string;
  getConfig: () => {};
}

export const createRouter = (props: NodeRouter) => {
  const app = new Hono().basePath(props.basePath);

  return app;
};
