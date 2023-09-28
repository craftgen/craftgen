"use server";

import { getDrive, getWebmaster } from "@/lib/google/auth";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import {
  and,
  article,
  articleNode,
  db,
  eq,
  inArray,
  nodeData,
  workflowNode,
  not,
  workflow,
  project,
  projectMembers,
  variable,
  workflowVersion,
} from "@seocraft/supabase/db";
import { cookies } from "next/headers";
import { format, sub } from "date-fns";
import { GoogleIntegrationsScope } from "./settings/integrations/page";
import { action } from "@/lib/safe-action";
import { z } from "zod";

export const getProject = async (projectSlug: string) => {
  return await db.query.project.findFirst({
    where: (project, { eq }) => eq(project.slug, projectSlug),
  });
};

export const getGoogleScopes = async () => {
  const supabase = createServerActionClient({ cookies });
  const session = await supabase.auth.getSession();

  const data = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.id, session.data.session?.user.id!),
    columns: {
      google_scopes: true,
    },
  });
  return data?.google_scopes as unknown as GoogleIntegrationsScope[];
};

export const updateProject = async (params: { id: string; name: string }) => {
  return await db
    .update(project)
    .set(params)
    .where(eq(project.id, params.id))
    .returning();
};
export const deleteProject = async (params: { id: string }) => {
  return await db.transaction(async (tx) => {
    await tx
      .delete(projectMembers)
      .where(eq(projectMembers.projectId, params.id));
    await tx.delete(project).where(eq(project.id, params.id));
  });
};

export const getProjectTokens = async (params: { project_id: string }) => {
  return await db.query.variable.findMany({
    where: (token, { eq }) => eq(token.project_id, params.project_id),
  });
};

export const insertProjectTokens = async (params: {
  project_id: string;
  tokens: {
    key: string;
    value: string;
  }[];
}) => {
  return await db
    .insert(variable)
    .values(
      params.tokens.map((token) => ({
        ...token,
        project_id: params.project_id,
      }))
    )
    .returning();
};

export const updateProjectToken = async (params: {
  id: string;
  key: string;
  value: string;
}) => {
  return await db
    .update(variable)
    .set(params)
    .where(eq(variable.id, params.id))
    .returning();
};

export const deleteProjectToken = async (params: { id: string }) => {
  return await db.delete(variable).where(eq(variable.id, params.id));
};

export const checkSlugAvailable = async (params: {
  slug: string;
  projectId: string;
}): Promise<boolean> => {
  const exist = await db
    .select({
      slug: workflow.slug,
    })
    .from(workflow)
    .where(
      and(
        eq(workflow.slug, params.slug),
        eq(workflow.projectId, params.projectId)
      )
    )
    .limit(1);
  return exist.length === 0;
};

export const createPlayground = action(
  z.object({
    projectId: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string().optional(),
    template: z.string().optional(),
  }),
  async ({ projectId, name, slug, description, template }) => {
    const supabase = createServerActionClient({ cookies });
    const session = await supabase.auth.getSession();

    const newPlayground = await db.transaction(async (tx) => {
      const project = await tx.query.project.findFirst({
        where: (project, { eq }) => eq(project.id, projectId),
        columns: {
          slug: true,
        },
      });
      if (!project) throw new Error("Project not found");
      const newP = await tx
        .insert(workflow)
        .values({
          name,
          slug,
          description,
          projectId,
          projectSlug: project?.slug,
        })
        .returning();

      await tx.insert(workflowVersion).values({
        playgroundId: newP[0].id,
      });
      return newP;
    });

    return newPlayground[0];
  }
);

export const deletePlayground = async ({ id }: { id: string }) => {
  return await db.delete(workflow).where(eq(workflow.id, id));
};

export const clonePlayground = async ({
  playgroundId,
  targetProjectId,
}: {
  playgroundId: string;
  targetProjectId: string;
}) => {
  throw new Error("Not implemented");
  //   return await db.transaction(async (tx) => {
  //     const originalPlayground = await tx.query.playground.findFirst({
  //       where: (playground, { eq }) => eq(playground.id, playgroundId),
  //       with: {
  //         project: true,
  //       },
  //     });

  //     if (!originalPlayground) throw new Error("Playground not found");

  //     const [clonePlayground] = await tx
  //       .insert(playground)
  //       .values({
  //         name: `${originalPlayground?.name} (Clone)`,
  //         description: originalPlayground.description,
  //         public: originalPlayground.public,
  //         project_id: targetProjectId,
  //         edges: [],
  //         nodes: [],
  //         slug: `${originalPlayground.slug}-${+new Date()}`,
  //         layout: originalPlayground.layout,
  //       })
  //       .returning();

  //     const edges = originalPlayground.edges;

  //     /**
  // [
  //   {
  //     "source": "dedd08c0-d1a7-41de-8b41-52220bae41e2",
  //     "sourceOutput": "value",
  //     "target": "53b78363-03b8-4421-a04a-a4158d09d060",
  //     "targetInput": "title"
  //   },
  //   {
  //     "source": "f126eb5b-e82d-4016-8787-8b2a24614267",
  //     "sourceOutput": "value",
  //     "target": "53b78363-03b8-4421-a04a-a4158d09d060",
  //     "targetInput": "description"
  //   }
  // ]
  //      */

  //     const cloneNodes = await Promise.all(
  //       originalPlayground.nodes.map(async (node) => {
  //         const [ogNode] = await tx
  //           .select()
  //           .from(nodeData)
  //           .where(eq(nodeData.id, node.id))
  //           .limit(1);
  //         const [cloneNode] = await tx
  //           .insert(nodeData)
  //           .values({
  //             project_id: originalPlayground.project.id,
  //             type: ogNode.type,
  //             state: ogNode.state,
  //           })
  //           .returning();
  //         await tx.insert(playgroundNode).values({
  //           node_id: cloneNode.id,
  //           playground_id: clonePlayground.id,
  //         });

  //         edges.forEach(async (edge) => {
  //           if (edge.source === node.id) {
  //             edge.source = cloneNode.id;
  //           }
  //           if (edge.target === node.id) {
  //             edge.target = cloneNode.id;
  //           }
  //         });

  //         return {
  //           ...node,
  //           id: cloneNode.id,
  //         };
  //       })
  //     );
  //     return await tx
  //       .update(playground)
  //       .set({
  //         nodes: cloneNodes,
  //         edges,
  //       })
  //       .where(eq(playground.id, clonePlayground.id));
  //   });
};

export const getPlaygrounds = async (projectId: string) => {
  console.log("PROEJCT>", projectId);
  return await db.query.playground.findMany({
    where: (playground, { eq, and }) =>
      and(
        eq(playground.projectId, projectId)
        // eq(playground.version, 0) // The latest version
      ),
    with: {
      project: {
        columns: {
          slug: true,
        },
      },
    },
  });
};

export const getUser = async () => {
  const supabase = createServerActionClient({ cookies });
  const session = await supabase.auth.getSession();

  return await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.id, session.data.session?.user.id!),
  });
};

export const getSheets = async ({ query }: { query: string }) => {
  const supabase = createServerActionClient({ cookies });
  const session = await supabase.auth.getSession();
  const drive = await getDrive({ session: session.data.session! });
  const drives = await drive.drives.list({});
  const files = await drive.files.list({});

  // const sheet = await getSheet({ session: session.data.session! });

  // const sheets = await getSpreadsheetData({
  //   session: session.data.session!,
  //   query,
  // });
  return {
    // sheet,
    drives: drives.data.drives,
    files: files.data.files,
    // sheets,
  };
};

export const getAnalytics = async ({ siteUrl }: { siteUrl: string }) => {
  try {
    const supabase = createServerActionClient({ cookies });
    const session = await supabase.auth.getSession();
    const webmaster = await getWebmaster({ session: session.data.session! });

    const res = await webmaster.searchanalytics.query({
      siteUrl,
      requestBody: {
        dimensions: ["date"],
        startDate: format(sub(new Date(), { days: 10 }), "yyyy-MM-dd"),
        endDate: format(sub(new Date(), { days: 3 }), "yyyy-MM-dd"),
      },
    });
    return res.data;
  } catch (e) {
    console.log("ERROR", e);
  }
};

export const getSearchQueries = async ({ siteUrl }: { siteUrl: string }) => {
  const supabase = createServerActionClient({ cookies });
  const session = await supabase.auth.getSession();
  const webmaster = await getWebmaster({ session: session.data.session! });

  const res = await webmaster.searchanalytics.query({
    siteUrl,
    requestBody: {
      dimensions: ["query"],
      startDate: format(sub(new Date(), { days: 10 }), "yyyy-MM-dd"),
      endDate: format(sub(new Date(), { days: 3 }), "yyyy-MM-dd"),
    },
  });
  return res.data;
};

export const getArticles = async ({ projectId }: { projectId: string }) => {
  const articles = await db.query.article.findMany({
    where: (article, { eq }) => eq(article.projectId, projectId),
    with: {
      project: true,
      metadata: true,
    },
  });
  return articles.map((article) => {
    return {
      ...article,
      link: `/project/${article.project.slug}/articles/${article.slug}`,
      originalLink: `${article.project.site}${article.slug}`,
    };
  });
};
export const getArticle = async ({
  projectId,
  articleSlug,
}: {
  projectId: string;
  articleSlug: string[];
}) => {
  return await db.query.article.findFirst({
    where: (article, { eq, and }) =>
      and(
        eq(article.slug, articleSlug.join("/")),
        eq(article.projectId, projectId)
      ),
    with: {
      project: true,
      metadata: true,
      nodes: true,
    },
  });
};
export const updateArticle = async ({
  id,
  nodes,
  title,
  slug,
}: {
  id: string;
  title?: string;
  slug?: string;
  nodes: any[];
}) => {
  console.log("NODES", nodes, id);
  return await db.transaction(async (tx) => {
    const existingArticle = await tx.query.article.findFirst({
      where: (article, { eq }) => eq(article.id, id),
      with: {
        nodes: true,
        project: true,
      },
    });
    console.log("EXISTING", existingArticle);
    if (title || slug) {
      const updates = {
        ...(title && { title }),
        ...(slug && { slug }),
      };
      await tx.update(article).set(updates).where(eq(article.id, id));
    }

    await tx.delete(articleNode).where(
      and(
        eq(articleNode.articleId, id),
        not(
          inArray(
            articleNode.id,
            nodes.map((node) => node.id)
          )
        )
      )
    );

    nodes.forEach(async (node) => {
      console.log("node", node);
      await tx
        .insert(articleNode)
        .values({
          id: node.id,
          type: node.type,
          data: node,
          articleId: id,
        })
        .onConflictDoUpdate({
          target: articleNode.id,
          set: {
            type: node.type,
            data: node,
          },
        });
    });
    return await tx.query.article.findFirst({
      where: (article, { eq }) => eq(article.id, id),
      with: {
        nodes: true,
        project: true,
      },
    });
  });
};

export const createArticle = async ({
  projectId,
  title = "New Article",
  slug = `new-article-${+new Date()}`,
}: {
  projectId: string;
  title?: string;
  slug?: string;
}) => {
  const newArticle = await db
    .insert(article)
    .values({
      title: title,
      slug,
      projectId,
    })
    .returning();
  return newArticle[0];
};
