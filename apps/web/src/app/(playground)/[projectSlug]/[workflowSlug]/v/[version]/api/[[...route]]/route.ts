import { Hono } from "hono";
import { handle } from "hono/vercel";
// import { api } from "@/trpc/server";

export const runtime = "edge";

console.log("RUNNING HONO");

const app = new Hono().basePath("/:project/:workflow/v/:version/api");

app.get("/schema", async (c) => {
  // const meta = await api.craft.module.meta({
  //   projectSlug: c.req.param("project"),
  //   workflowSlug: c.req.param("workflow"),
  //   version: Number(c.req.param("version")),
  // });
  return c.json({
    meta: {v: 1},
  });
});

app.get("/", (c) => {
  console.log("REQS", c.req.param());
  return c.text("GET /");
});
app.post("/", (c) => c.text("POST /"));
app.put("/", (c) => c.text("PUT /"));
app.delete("/", (c) => c.text("DELETE /"));

export const GET = handle(app);
export const POST = handle(app);
