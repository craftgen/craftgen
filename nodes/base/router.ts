import { Hono } from "jsr:@hono/hono";

import { CraftgenNodeConfig } from "./config.ts";

export class NodeBuilder {
  config: CraftgenNodeConfig;
  private router: Hono;

  constructor(basePath: string, config: CraftgenNodeConfig) {
    this.config = config;
    this.router = new Hono().basePath(basePath);

    this.setupBaseRoutes();
  }

  private setupBaseRoutes() {
    this.router.get("/", (c) => c.json({ ...this.config }));
  }

  public addRestEndpoints(setupFunc: (app: Hono) => Hono) {
    this.router.route("/api", setupFunc(this.router));
    return this;
  }

  public build() {
    return this.router;
  }
}
