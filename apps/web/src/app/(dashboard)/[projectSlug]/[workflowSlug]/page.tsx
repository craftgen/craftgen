import type { Metadata, ResolvingMetadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTRPCErrorFromUnknown } from "@trpc/server";

import { db } from "@craftgen/db/db";

import { api } from "@/trpc/server";

import { Editor } from "./editor";

export const dynamicParams = true;
export const revalidate = 300;

interface Props {
  params: {
    projectSlug: string;
    workflowSlug: string;
  };
  searchParams: Record<string, string | string[] | undefined>;
}

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  try {
    const workflowMeta = await api.craft.module.meta({
      projectSlug: params.projectSlug,
      workflowSlug: params.workflowSlug,
    });

    return {
      title: `${workflowMeta?.name} | ${workflowMeta?.project.name}`,
      description: workflowMeta?.description,
    };
  } catch (e: unknown) {
    console.log("ERROR", e);
    const error = getTRPCErrorFromUnknown(e);
    if (error.code === "NOT_FOUND") {
      notFound();
    } else if (error.code === "UNAUTHORIZED") {
      redirect(`/login?redirect=${params.projectSlug}/${params.workflowSlug}`);
    } else {
      console.log("ERROR", error);
      return new Response("Error", { status: 500 });
    }
  }
}

export async function generateStaticParams() {
  const projects = await db.query.project.findMany({
    columns: {
      slug: true,
    },
    with: {
      workflows: {
        columns: {
          slug: true,
        },
      },
    },
    limit: 10,
  });
  const paths = projects
    ?.map((project) => {
      return project.workflows.map((workflow) => ({
        projectSlug: project.slug,
        workflowSlug: workflow.slug,
      }));
    })
    .flat();
  return paths;
}

const PlaygroundPage: React.FC<Props> = async (props) => {
  try {
    const workflowMeta = await api.craft.module.meta({
      projectSlug: props.params.projectSlug,
      workflowSlug: props.params.workflowSlug,
    });
    if (!workflowMeta) {
      notFound();
    }
    return (
      <div className="flex h-full flex-col">
        <Editor
          projectSlug={workflowMeta.projectSlug}
          workflowSlug={workflowMeta.slug}
          version={workflowMeta.version?.version!}
          executionId={props.searchParams.execution as string}
        />
      </div>
    );
  } catch (e: unknown) {
    const error = getTRPCErrorFromUnknown(e);
    if (error.code === "NOT_FOUND") {
      notFound();
    } else if (error.code === "UNAUTHORIZED") {
      redirect(
        `/login?redirect=${props.params.projectSlug}/${props.params.workflowSlug}`,
      );
    } else {
      console.log("ERROR", error);
      return <div>Error</div>;
    }
  }
};

export default PlaygroundPage;
