import { Hono } from "hono";
import { handle } from "hono/vercel";

import { Editor } from "@craftgen/core/editor";
import { nodes } from "@craftgen/core/types";

import { api } from "@/trpc/server";

const app = new Hono().basePath("/:project/:workflow/v/:version/api");

app.get("/schema", async (c) => {
  const workflow = await api.craft.module.get({
    projectSlug: c.req.param("project"),
    workflowSlug: c.req.param("workflow"),
    version: Number(c.req.param("version")),
  });
  // const workflow = await db.query.workflow.findFirst({
  //   where: (w, { and, eq }) =>
  //     and(
  //       eq(w.slug, c.req.param("workflow")),
  //       eq(w.projectSlug, c.req.param("project")),
  //     ),
  //   with: {
  //     versions: {
  //       where: (v, { eq }) => eq(v.version, Number(c.req.param("version"))),
  //     },
  //   },
  // });
  const params = {
    workflow,
    api: {
      trpc: api,
    },
  };

  console.log("API", api);

  const di = new Editor({
    config: {
      nodes,
      meta: {
        projectId: params.workflow.projectId,
        workflowId: params.workflow.id,
        workflowVersionId: params.workflow.version.id,
        executionId: params.workflow?.execution?.id,
      },
      api: {
        trpc: api!,
      },
    },
    content: {
      context: params.workflow.context,
      nodes: params.workflow.nodes,
      edges: params.workflow.edges,
      contexts: params.workflow.contexts,
    },
  });

  await di.setup();
  console.log("DI", di);
  return c.json({
    meta: { v: 1 },
    workflow,
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
