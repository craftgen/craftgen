"use server";

import { getWebmaster } from "@/lib/google";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import {
  and,
  article,
  articleNode,
  db,
  eq,
  inArray,
  not,
  playground,
  project,
  projectMembers,
  variable,
} from "@seocraft/supabase/db";
import { cookies } from "next/headers";
import { format, sub } from "date-fns";

export const getProject = async (projectSlug: string) => {
  return await db.query.project.findFirst({
    where: (project, { eq }) => eq(project.slug, projectSlug),
  });
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

export const createPlayground = async ({
  project_id,
  name,
  description,
  template,
}: {
  project_id: string;
  name: string;
  description?: string;
  template?: string;
}) => {
  const supabase = createServerActionClient({ cookies });
  const session = await supabase.auth.getSession();

  const newPlayground = await db
    .insert(playground)
    .values({
      name,
      description,
      project_id,
      edges: [],
      nodes: [],
    })
    .returning();
  return newPlayground[0];
};

export const deletePlayground = async ({ id }: { id: string }) => {
  return await db.delete(playground).where(eq(playground.id, id));
};

export const getPlaygrounds = async (projectId: string) => {
  console.log("PROEJCT>", projectId);
  return await db.query.playground.findMany({
    where: (playground, { eq }) => eq(playground.project_id, projectId),
    with: {
      project: {
        columns: {
          slug: true,
        },
      },
    },
  });
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
